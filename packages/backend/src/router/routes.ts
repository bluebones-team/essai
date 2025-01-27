import { difference, flow, intersection, pick } from 'shared';
import {
  date2ts,
  ExperimentState,
  JoinState,
  MessageType,
  OutputCode,
} from 'shared/data';
import { type Router } from 'shared/router';
import { db } from '~/client';
import {
  expCacher,
  experimentService,
  msgMgr,
  otpMgr,
  tokenMgr,
  userCacher,
} from '~/router/service';
import { o } from '~/util';

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

export const routes: Router.Routes = {
  //#region /
  async '/token/refresh'({ input, user }) {
    return o.succ(tokenMgr.create(user));
  },
  async '/login/pwd'({ input }) {
    const { phone, pwd } = input;
    const user = await db.read('user', { phone }).executeTakeFirst();
    if (!user) return o(OutputCode.NoUser.value);
    if (user.pwd && user.pwd !== pwd) return o.fail('密码错误');
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/login/phone'({ input }) {
    const { phone, code } = input;
    const output = await otpMgr.phone.verify(phone, code);
    if (output) return output;
    const user = await db.read('user', { phone }).executeTakeFirst();
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
        name: '张三',
        face: `https://picsum.photos/200?t=${Date.now()}`,
        ...restInput,
        emails: [],
        recruiter: false,
        created_at: date2ts(new Date()),
      } satisfies PartialByKey<
        BTables['user'],
        'uid'
      > as unknown as BTables['user'])
      .returningAll()
      .executeTakeFirst();
    if (!user) return o.fail('注册失败');
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/usr/d'({ input, user }) {
    await db
      .deleteFrom('user')
      .where((eb) => eb.and(user))
      .execute();
    return o.succ();
  },
  async '/usr/u'({ input, user }) {
    await db.update('user', user, input).execute();
    return o.succ();
  },
  async '/usr/pwd/u'({ input, user }) {
    const { old: oldPwd, new: newPwd } = input;
    if (user.pwd && user.pwd !== oldPwd) return o.fail('旧密码错误');
    await db.update('user', user, { pwd: newPwd }).execute();
    return o.succ();
  },
  async '/usr/phone/u'({ input, user }) {
    const { old: oldPhone, new: newPhone, code } = input;
    const _user = await db.read('user', { phone: newPhone }).executeTakeFirst();
    if (_user) return o.fail('手机号已被注册');
    const output = await otpMgr.phone.verify(newPhone, code);
    if (output) return output;
    if (user.phone !== oldPhone) return o.fail('旧手机号错误');
    await db.update('user', user, { phone: newPhone }).execute();
    return o.succ();
  },
  async '/usr/ptc/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const query = flow(db.page({ ps, pn }))(
      db
        .selectFrom('user')
        .innerJoin('user_participant', (join) => {
          const builder = join
            .onRef('user_participant.puid', '=', 'user.uid')
            .on('user_participant.uid', '=', user.uid);
          return filter
            ? builder.on('user_participant.rtype', '=', filter.rtype)
            : builder;
        })
        .select([
          'uid',
          'name',
          'face',
          'gender',
          'birthday',
          'user_participant.rtype as rtype',
        ]),
    );
    return o.succ(await query.execute());
  },
  async '/usr/ptc/c'({ input, user }) {
    await db
      .create('user_participant', {
        uid: user.uid,
        puid: input.uid,
        rtype: input.rtype,
      })
      .execute();
    return o.succ();
  },
  async '/usr/ptc/d'({ input, user }) {
    await db
      .delete('user_participant', {
        uid: user.uid,
        puid: input.uid,
        rtype: input.rtype,
      })
      .execute();
    return o.succ();
  },
  //#endregion /usr
  //#region /exp
  async '/exp/c'({ input, user }) {
    await db
      .create('experiment', {
        ...input,
        uid: user.uid,
        state: ExperimentState.Ready.value,
        created_at: date2ts(new Date()),
      })
      .execute();
    return o.succ();
  },
  async '/exp/u'({ input, user }) {
    const { eid, ...restInput } = input;
    await db.update('experiment', { eid, uid: user.uid }, restInput).execute();
    return o.succ();
  },
  async '/exp/d'({ input, user }) {
    await db.delete('experiment', { ...input, uid: user.uid }).execute();
    return o.succ();
  },
  async '/exp/pub'({ input, user }) {
    await db
      .update(
        'experiment',
        { ...input, uid: user.uid },
        { state: ExperimentState.Reviewing.value },
      )
      .execute();
    return o.succ();
  },
  async '/exp/join'({ input, user }) {
    const data = await get_experiment_by_rcid(input.rcid)
      .select(['experiment.state', 'recruitment_condition.size'])
      .executeTakeFirst();
    if (!data) return o.fail('实验不存在');
    if (data.state !== ExperimentState.Passed.value)
      return o.fail('实验未发布');
    const ptc_data = await db
      .selectFrom('recruitment_participant')
      .where('rcid', '=', input.rcid)
      .select((eb) => [
        eb.fn.countAll<number>().as('count'),
        eb.fn
          .max(eb.case().when('uid', '=', user.uid).then(1).else(0).end())
          .as('is_joined'),
      ])
      .executeTakeFirst();
    if (!ptc_data) return o.fail('招募条件不存在');
    if (ptc_data.is_joined) return o.fail('不能重复参加');
    if (ptc_data.count > data.size)
      return o.error('参与者过多', 'recruitment_participant.rcid', input.rcid);
    if (ptc_data.count === data.size) return o.fail('参与者已满');
    await db
      .create('recruitment_participant', {
        uid: user.uid,
        rcid: input.rcid,
        state: JoinState.Pending.value,
      })
      .execute();
    return o.succ();
  },
  async '/exp/push'({ input, user }) {
    const { rcid, uids } = input;
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
    const data = await get_experiment_by_rcid(input.rcid)
      .select(['experiment.eid', 'experiment.title'])
      .executeTakeFirst();
    if (!data) return o.fail('实验不存在');
    uids.forEach((uid) =>
      msgMgr.send({
        // suid: user.uid,
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
    if (!experimentService.public.is(experiment))
      return o.fail('这个实验还没发布');
    return o.succ(
      pick(experiment, ['eid', 'uid', 'title', 'type', 'position', 'notice']),
    );
  },
  async '/exp/public/sup'({ input, user }) {
    const { eid } = input;
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    if (!experimentService.public.is(experiment))
      return o.fail('这个实验还没发布');
    return o.succ(pick(experiment, ['uid', 'notice']));
  },
  async '/exp/public/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const query = flow(
      experimentService.filter(filter),
      db.page({ pn, ps }),
    )(experimentService.public.query());
    return o.succ(await query.execute());
  },
  async '/exp/joined'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isJoinedEid(user.uid, eid)))
      return o.fail('你得先报名实验');
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    return o.succ(
      pick(experiment, ['eid', 'uid', 'title', 'type', 'position', 'notice']),
    );
  },
  async '/exp/joined/sup'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isJoinedEid(user.uid, eid)))
      return o.fail('你得先报名实验');
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    return o.succ(pick(experiment, ['uid', 'notice']));
  },
  async '/exp/joined/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const eids = (await userCacher.getJoinedEids(user.uid)).map((e) => +e);
    const query = flow(
      experimentService.filter(filter),
      db.page({ pn, ps }),
    )(db.selectFrom('experiment').where('eid', 'in', eids).selectAll());
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
  async '/exp/own/sup'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isOwnEid(user.uid, eid)))
      return o.fail('这不是你的实验');
    const experiment = await expCacher.get(eid);
    if (!experiment) return o.fail('实验不存在');
    return o.succ(pick(experiment, ['uid', 'position', 'notice']));
  },
  async '/exp/own/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const eids = (await userCacher.getOwnEids(user.uid)).map((e) => +e);
    const query = flow(
      experimentService.filter(filter),
      db.page({ pn, ps }),
    )(db.selectFrom('experiment').where('eid', 'in', eids).selectAll());
    return o.succ(await query.execute());
  },
  //#endregion /exp
  //#region /recruit
  async '/recruit/c'({ input, user }) {
    const { eid } = input;
    if (!(await userCacher.isOwnEid(user.uid, eid)))
      return o.fail('这不是你的实验');
    const recruit = await db
      .create('recruitment', input)
      .returning('rid')
      .executeTakeFirst();
    if (!recruit) return o.fail('招募创建失败');
    return o.succ();
  },
  async '/recruit/u'({ input, user }) {
    const { rid, ...restInput } = input;
    const recruit = await db
      .update('recruitment', { rid }, restInput)
      .returning('rid')
      .executeTakeFirst();
    if (!recruit) return o.fail('招募创建失败');
    return o.succ();
  },
  async '/recruit/d'({ input, user }) {
    await db.delete('recruitment', input).execute();
    return o.succ();
  },
  //#endregion /recruit
};
