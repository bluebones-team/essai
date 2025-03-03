import { randomUUID } from 'crypto';
import { sql } from 'kysely';
import { difference, intersection, omit, pick } from 'shared';
import { date2ts, ExperimentState, MessageType, OutputCode } from 'shared/data';
import { type ApiRecordTypes } from 'shared/router';
import { db } from '~/client';
import { o } from '~/util';
import type { RouterContext } from './context';
import { expCacher, msgMgr, otpMgr, tokenMgr, userCacher } from './service';

const user2own = (data: BTables['user']): FTables['user']['own'] => ({
  ...pick(data, [
    'uid',
    'name',
    'face',
    'gender',
    'birthday',
    'phone',
    'emails',
    'recruiter',
  ]),
  pwd: !!data.pwd,
});
const get_experiment_by_rcid = (rcid: string) =>
  db
    .selectFrom('experiment')
    .innerJoin('recruitment', 'recruitment.eid', 'experiment.eid')
    .innerJoin('recruitment_condition', (join) =>
      join
        .onRef('recruitment_condition.rid', '=', 'recruitment.rid')
        .on('recruitment_condition.rcid', '=', rcid),
    );

export const routes: {
  [K in keyof ApiRecordTypes]?: (
    ctx: RouterContext<K>,
  ) => MaybePromise<ApiRecordTypes[K]['out'] | void>;
} = {
  //#region /
  async '/token/refresh'({ input, user }) {
    return o.succ(tokenMgr.create(user));
  },
  async '/login/pwd'({ input }) {
    const { phone, pwd } = input;
    const user = await db
      .selectFrom('user')
      .selectAll()
      .where('phone', '=', phone)
      .executeTakeFirst();
    if (!user) return o(OutputCode.NoUser.value);
    if (user.pwd && user.pwd !== pwd) return o.fail('密码错误');
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/login/phone'({ input }) {
    const { phone, code } = input;
    const output = await otpMgr.phone.verify(phone, code);
    if (output) return output;
    const user = await db
      .selectFrom('user')
      .selectAll()
      .where('phone', '=', phone)
      .executeTakeFirst();
    if (!user) return o(OutputCode.NoUser.value);
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/login/token'({ input, user }) {
    return o.succ(user2own(user));
  },
  async '/otp/phone'({ input }) {
    const output = await otpMgr.phone.send(input);
    return output ?? o.succ();
  },
  //#endregion /
  //#region /usr
  async '/usr/c'({ input }) {
    const { code, ...restInput } = input;
    const output = await otpMgr.phone.verify(input.phone, code);
    if (output) return output;
    const user = await db
      .insertInto('user')
      .values({
        uid: randomUUID(),
        name: '张三',
        face: `https://picsum.photos/200?t=${Date.now()}`,
        ...restInput,
        emails: [],
        recruiter: false,
        created_at: date2ts(new Date()),
      })
      .returningAll()
      .executeTakeFirst();
    if (!user) return o.fail('注册失败');
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/usr/d'({ input, user }) {
    await db.deleteFrom('user').where('uid', '=', user.uid).execute();
    return o.succ();
  },
  async '/usr/u'({ input, user }) {
    await db
      .updateTable('user')
      .set(input)
      .where('uid', '=', user.uid)
      .execute();
    return o.succ();
  },
  async '/usr/pwd/u'({ input, user }) {
    const { old: oldPwd, new: newPwd } = input;
    if (user.pwd && user.pwd !== oldPwd) return o.fail('旧密码错误');
    await db
      .updateTable('user')
      .set('pwd', newPwd)
      .where('uid', '=', user.uid)
      .execute();
    return o.succ();
  },
  async '/usr/phone/u'({ input, user }) {
    const { old: oldPhone, new: newPhone, code } = input;
    const _user = await db
      .selectFrom('user')
      .selectAll()
      .where('phone', '=', newPhone)
      .executeTakeFirst();
    if (_user) return o.fail('手机号已被注册');
    const output = await otpMgr.phone.verify(newPhone, code);
    if (output) return output;
    if (user.phone !== oldPhone) return o.fail('旧手机号错误');
    await db
      .updateTable('user')
      .set('phone', newPhone)
      .where('uid', '=', user.uid)
      .execute();
    return o.succ();
  },
  async '/usr/ptc/ls'({ input, user }) {
    const query = db
      .selectFrom('user')
      .innerJoin('user_participant', (join) =>
        join
          .onRef('user_participant.puid', '=', 'user.uid')
          .on('user_participant.uid', '=', user.uid)
          .on('user_participant.rtype', '=', input.rtype),
      )
      .paginate(input)
      .select([
        'user.uid',
        'user.name',
        'user.face',
        'user.gender',
        'user.birthday',
        'user_participant.rtype',
      ]);
    return o.succ(await query.execute());
  },
  async '/usr/ptc/c'({ input, user }) {
    await db
      .insertInto('user_participant')
      .values({
        uid: user.uid,
        puid: input.uid,
        rtype: input.rtype,
      })
      .execute();
    return o.succ();
  },
  async '/usr/ptc/d'({ input, user }) {
    await db
      .deleteFrom('user_participant')
      .where((eb) =>
        eb.and({
          uid: user.uid,
          puid: input.uid,
          rtype: input.rtype,
        }),
      )
      .execute();
    return o.succ();
  },
  //#endregion /usr
  //#region /exp
  async '/exp/c'({ input, user }) {
    const eid = randomUUID();
    await db
      .insertInto('experiment')
      .values({
        ...input,
        eid,
        uid: user.uid,
        state: ExperimentState.Ready.value,
        created_at: date2ts(new Date()),
      })
      .execute();
    return o.succ({ eid });
  },
  async '/exp/u'({ input, user }) {
    const { eid, ...restInput } = input;
    await db
      .updateTable('experiment')
      .set(restInput)
      .where((eb) => eb.and({ eid, uid: user.uid }))
      .execute();
    return o.succ();
  },
  async '/exp/d'({ input, user }) {
    await db
      .deleteFrom('experiment')
      .where((eb) => eb.and({ ...input, uid: user.uid }))
      .execute();
    return o.succ();
  },
  async '/exp/pub'({ input, user }) {
    /**@TODO 检查实验内是否存在未招满的招募条件 */
    await db
      .updateTable('experiment')
      .set('state', ExperimentState.Reviewing.value)
      .where((eb) => eb.and({ ...input, uid: user.uid }))
      .execute();
    return o.succ();
  },
  async '/exp/join'({ input, user }) {
    if (await userCacher.isOwnRcid(user.uid, input.rcid))
      return o.fail('不能报名自己的实验');
    const data = await get_experiment_by_rcid(input.rcid)
      .select([
        'experiment.eid',
        'experiment.state',
        'recruitment_condition.size',
      ])
      .executeTakeFirst();
    if (!data) return o.fail('实验不存在');
    if (data.state !== ExperimentState.Passed.value)
      return o.fail('实验未发布');
    if (await userCacher.isJoinedEid(user.uid, data.eid))
      return o.fail('不能重复参加同一个实验');
    const ptc_data = await db
      .selectFrom('recruitment_participant')
      .where('rcid', '=', input.rcid)
      .select((eb) => [eb.fn.count<number>('uid').as('count')])
      .executeTakeFirst();
    /**@TODO 检查报名用户是否满足招募条件 */
    if (!ptc_data) return o.fail('招募条件不存在');
    if (ptc_data.count > data.size)
      return o.error('参与者过多: recruitment_participant.rcid', input.rcid);
    if (ptc_data.count === data.size) return o.fail('参与者已满');
    await db
      .insertInto('recruitment_participant')
      .values({ uid: user.uid, rcid: input.rcid })
      .execute();
    return o.succ();
  },
  async '/exp/push'({ input, user }) {
    const { rcid, uids } = input;
    if (!(await userCacher.isOwnRcid(user.uid, rcid)))
      return o.fail('这不是你的招募条件');
    const data = await get_experiment_by_rcid(rcid)
      .select(['experiment.eid', 'experiment.title'])
      .executeTakeFirst();
    if (!data) return o.fail('实验不存在');
    const user_ptcs = await db
      .selectFrom('user_participant')
      .where('uid', '=', user.uid)
      .select(['puid'])
      .execute();
    if (
      difference(
        uids,
        user_ptcs.map((e) => e.puid),
      ).length > 0
    )
      return o.fail('推送用户应在参与者库中');
    const recruitment_ptcs = await db
      .selectFrom('recruitment_participant')
      .where('rcid', '=', rcid)
      .select(['uid'])
      .execute();
    if (
      intersection(
        uids,
        recruitment_ptcs.map((e) => e.uid),
      ).length > 0
    )
      return o.fail('存在已报名的参与者');
    /**@TODO 检查推送用户是否满足招募条件 */
    uids.forEach((uid) =>
      msgMgr.send({
        uid,
        type: MessageType['Participant.Push'].value,
        title: data.title,
        content: `eid: ${data.eid}`,
      }),
    );
    return o.succ();
  },
  async '/exp/public'({ input, user }) {
    const { eid } = input;
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    if (experiment.state !== ExperimentState.Passed.value)
      return o.fail('这个实验还没发布');
    return o.succ(omit(experiment, ['created_at', 'state']));
  },
  async '/exp/public/ls'({ input, user }) {
    const query = db
      .selectFrom('experiment')
      .select([
        'experiment.eid',
        'experiment.uid',
        'experiment.title',
        'experiment.type',
        'experiment.position',
        'experiment.notice',
      ])
      .paginate(input)
      .filter('experiment', {
        ...input,
        state: ExperimentState.Passed.value,
      });
    return o.succ(await query.execute());
  },
  async '/exp/public/range'({ input, user }) {
    type Range = FTables['experiment']['filter']['range'];
    const data = await db
      .selectFrom((eb) =>
        db
          .selectFrom('experiment')
          .innerJoin('recruitment', 'experiment.eid', 'recruitment.eid')
          .where('experiment.state', '=', ExperimentState.Passed.value)
          .select(({ fn, ref, lit }) => [
            'fee',
            /**@see https://www.postgresql.org/docs/current/functions-array.html */
            fn('array_length', ['recruitment.durations', lit(1)]).as('times'),
            /**
             * SUM: integer -> bigint
             * @see https://www.postgresql.org/docs/current/functions-aggregate.html
             *
             * node-postgres: bigint -> string
             * @see https://node-postgres.com/features/types
             *
             * so use ::numeric: bigint -> numeric
             * @see https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL
             */
            sql<number>`(SELECT sum(v)::numeric FROM unnest(${ref('recruitment.durations')}) AS v)`.as(
              'duration',
            ),
          ])
          .as('sub'),
      )
      .select(({ ref }) => [
        sql<
          Range['fee_range']
        >`ARRAY[min(${ref('sub.fee')}), max(${ref('sub.fee')})]`.as(
          'fee_range',
        ),
        sql<
          Range['times_range']
        >`ARRAY[min(${ref('sub.times')}), max(${ref('sub.times')})]`.as(
          'times_range',
        ),
        sql<
          Range['duration_range']
        >`ARRAY[min(${ref('sub.duration')}), max(${ref('sub.duration')})]`.as(
          'duration_range',
        ),
      ])
      .executeTakeFirstOrThrow();
    /**@TODO 判断是否有公开项目 */
    if (data.fee_range.some((e) => e === null))
      return o.fail('目前还没有公开项目');
    return o.succ(Object.assign(data));
  },
  async '/exp/joined'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isJoinedEid(user.uid, eid)))
      return o.fail('你得先报名实验');
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    return o.succ(omit(experiment, ['created_at', 'state']));
  },
  async '/exp/joined/ls'({ input, user }) {
    const eids = await userCacher.getJoinedEids(user.uid);
    if (!eids.length) return o.succ([]);
    const query = db
      .selectFrom('experiment')
      .where('experiment.eid', 'in', eids)
      .selectAll()
      .paginate(input)
      .filter('experiment', input);
    return o.succ(await query.execute());
  },
  async '/exp/own'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isOwnEid(user.uid, eid)))
      return o.fail('这不是你的实验');
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    return o.succ(
      pick(experiment, [
        'eid',
        'uid',
        'title',
        'type',
        'position',
        'notice',
        'state',
      ]),
    );
  },
  async '/exp/own/ls'({ input, user }) {
    const eids = await userCacher.getOwnEids(user.uid);
    if (!eids.length) return o.succ([]);
    const query = db
      .selectFrom('experiment')
      .selectAll()
      .where('experiment.eid', 'in', eids)
      .paginate(input)
      .filter('experiment', input);
    return o.succ(await query.execute());
  },
  //#endregion /exp
  //#region /recruit
  async '/recruit'({ input, user }) {
    if (!(await userCacher.isOwnEid(user.uid, input.eid)))
      return o.fail('这不是你的实验');
    const recruitment = await db
      .selectFrom('recruitment')
      .where((eb) => eb.and(input))
      .selectAll()
      .executeTakeFirst();
    if (!recruitment) return o.fail('招募不存在');
    return o.succ(recruitment);
  },
  async '/recruit/c'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isOwnEid(user.uid, eid)))
      return o.fail('这不是你的实验');
    await db
      .insertInto('recruitment')
      .values({ ...input, rid: randomUUID() })
      .execute();
    return o.succ();
  },
  async '/recruit/u'({ input, user }) {
    const { rid, ...restInput } = input;
    if (!(await userCacher.isOwnRid(user.uid, rid)))
      return o.fail('这不是你的招募');
    await db
      .updateTable('recruitment')
      .set(restInput)
      .where('rid', '=', rid)
      .execute();
    return o.succ();
  },
  async '/recruit/d'({ input, user }) {
    const { rid } = input;
    if (!(await userCacher.isOwnRid(user.uid, rid)))
      return o.fail('这不是你的招募');
    await db.deleteFrom('recruitment').where('rid', '=', rid).execute();
    return o.succ();
  },
  async '/recruit/condition/ls'({ input, user }) {
    const { rid } = input;
    if (!(await userCacher.isOwnRid(user.uid, rid)))
      return o.fail('这不是你的招募');
    const recruitment_conditions = await db
      .selectFrom('recruitment_condition')
      .where('rid', '=', rid)
      .innerJoin(
        'recruitment_participant',
        'recruitment_participant.rcid',
        'rcid',
      )
      .groupBy('rcid')
      .select((eb) => [
        eb.fn.count<number>('recruitment_participant.uid').as('count'),
        'rcid',
        'size',
      ])
      .paginate(input)
      .execute();

    return o.succ(recruitment_conditions);
  },
  async '/recruit/condition/c'({ input, user }) {
    const { rid } = input;
    if (!(await userCacher.isOwnRid(user.uid, rid)))
      return o.fail('这不是你的招募');
    await db
      .insertInto('recruitment_condition')
      .values({ ...input, rcid: randomUUID() })
      .execute();
    return o.succ();
  },
  async '/recruit/condition/u'({ input, user }) {
    const { rcid, ...restInput } = input;
    if (!(await userCacher.isOwnRcid(user.uid, rcid)))
      return o.fail('这不是你的招募条件');
    await db
      .updateTable('recruitment_condition')
      .set(restInput)
      .where('rcid', '=', rcid)
      .execute();
    return o.succ();
  },
  async '/recruit/condition/d'({ input, user }) {
    const { rcid } = input;
    if (!(await userCacher.isOwnRcid(user.uid, rcid)))
      return o.fail('这不是你的招募条件');
    await db
      .deleteFrom('recruitment_condition')
      .where('rcid', '=', rcid)
      .execute();
    return o.succ();
  },
  async '/recruit/ptc/ls'({ input, user }) {
    const { rcid } = input;
    if (!(await userCacher.isOwnRcid(user.uid, rcid)))
      return o.fail('这不是你的招募条件');
    const participants = await db
      .selectFrom('recruitment_participant')
      .where('rcid', '=', rcid)
      .innerJoin('user', 'user.uid', 'uid')
      .select(['uid', 'name', 'face', 'gender', 'birthday'])
      .paginate(input)
      .execute();
    return o.succ(participants);
  },
  async '/recruit/ptc/d'({ input, user }) {
    if (!(await userCacher.isOwnRcid(user.uid, input.rcid)))
      return o.fail('这不是你的招募条件');
    await db
      .deleteFrom('recruitment_participant')
      .where((eb) => eb.and(input))
      .execute();
    return o.succ();
  },
  //#endregion /recruit
  //#region /msg
  async '/msg/stream'({ ws, user, send }) {
    if (!ws) return;
    msgMgr.on('send', ({ uid, ...e }) => {
      if (user.uid !== uid) return;
      const output = o.succ({ ...e, has_read: false });
      send(output);
    });
  },
  async '/msg/ls'({ input, user, send }) {
    const messages = await db
      .selectFrom('message')
      .leftJoin('message_read', (join) =>
        join
          .onRef('message_read.mid', '=', 'message.mid')
          .on('message_read.uid', '=', user.uid),
      )
      .select(({ ref }) => [
        'message.type',
        'message.created_at',
        'message.title',
        'message.content',
        'message.mid',
        sql<boolean>`(${ref('message_read.uid')} IS NOT NULL)`.as('has_read'),
      ])
      .where((eb) =>
        eb('message.uid', '=', user.uid).or(
          'type',
          '=',
          MessageType['Sys.Announcement'].value,
        ),
      )
      .paginate(input)
      .execute();
    return o.succ(messages);
  },
  async '/msg/read'({ input, user }) {
    const rows = await db
      .selectFrom('message_read')
      .where((eb) => eb.and({ mid: input.mid, uid: user.uid }))
      .execute();
    if (rows.length) return o.fail('不可重复标记已读消息');
    await db
      .insertInto('message_read')
      .values({ mid: input.mid, uid: user.uid })
      .execute();
    return o.succ();
  },
  //#endregion /msg
  //#region /feedback
  //#endregion /feedback
};
