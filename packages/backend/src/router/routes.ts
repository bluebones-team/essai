import { difference, intersection, pick } from 'shared';
import {
  date2ts,
  ExperimentState,
  JoinState,
  MessageType,
  OutputCode,
} from 'shared/data';
import { type Router } from 'shared/router';
import { db } from '~/client';
import { expMgr, msgMgr, otpMgr, tokenMgr } from '~/router/service';
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
const get_experiment_by_rcid = async (rcid: string) => {
  const conditions = await db
    .selectFrom('recruitment_condition')
    .where((eb) => eb.and({ rcid }))
    .executeTakeFirst();
  if (conditions.length !== 1)
    return o.error('ID重复', 'recruitment_condition.rcid', rcid);
  const condition = conditions[0];
  const recruitments = await db.select('recruitment', { rid: condition.rid });
  if (recruitments.length !== 1)
    return o.error('ID重复', 'recruitment.rid', condition.rid);
  const recruitment = recruitments[0];
  const experiments = await db.select('experiment', { eid: recruitment.eid });
  if (experiments.length !== 1)
    return o.error('ID重复', 'experiment.eid', recruitment.eid);
  return { condition, recruitment, experiment: experiments[0] };
};
export const routes: Router.Routes = {
  //#region /
  async '/token/refresh'({ input, user }) {
    return o.succ(tokenMgr.create(user));
  },
  async '/login/pwd'({ input }) {
    const { phone, pwd } = input;
    const user = await db.select('user', { phone }).executeTakeFirst();
    if (!user) return o(OutputCode.NoUser.value);
    if (user.pwd && user.pwd !== pwd) return o.fail('密码错误');
    return o.succ(Object.assign(tokenMgr.create(user), user2own(user)));
  },
  async '/login/phone'({ input }) {
    const { phone, code } = input;
    const output = await otpMgr.phone.verify(phone, code);
    if (output) return output;
    const user = await db.select('user', { phone }).executeTakeFirst();
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
    const _user = await db
      .select('user', { phone: newPhone })
      .executeTakeFirst();
    if (_user) return o.fail('手机号已被注册');
    const output = await otpMgr.phone.verify(newPhone, code);
    if (output) return output;
    if (user.phone !== oldPhone) return o.fail('旧手机号错误');
    await db.update('user', user, { phone: newPhone }).execute();
    return o.succ();
  },
  async '/usr/ptc/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const users = await db
      .selectFrom('user')
      .innerJoin('user_participant', (join) => {
        const builder = join
          .onRef('user_participant.puid', '=', 'user.uid')
          .on('user_participant.uid', '=', user.uid);
        return filter
          ? builder.on('user_participant.rtype', '=', filter?.rtype)
          : builder;
      })
      .select([
        'uid',
        'name',
        'face',
        'gender',
        'birthday',
        'user_participant.rtype as rtype',
      ])
      .execute();
    return o.succ(users);
  },
  async '/usr/ptc/c'({ input, user }) {
    await db.insert('user_participant', {
      uid: user.uid,
      puid: input.uid,
      rtype: input.rtype,
    });
    return o.succ();
  },
  async '/usr/ptc/d'({ input, user }) {
    await db.delete('user_participant', {
      uid: user.uid,
      puid: input.uid,
      rtype: input.rtype,
    });
    return o.succ();
  },
  //#endregion /usr
  //#region /exp
  async '/exp/c'({ input, user }) {
    await db.insert('experiment', {
      ...input,
      uid: user.uid,
      state: ExperimentState.Ready.value,
      created_at: date2ts(new Date()),
    });
    return o.succ();
  },
  async '/exp/u'({ input, user }) {
    const { eid, ...restInput } = input;
    await db.update('experiment', { eid, uid: user.uid }, restInput);
    return o.succ();
  },
  async '/exp/d'({ input, user }) {
    await db.delete('experiment', { ...input, uid: user.uid });
    return o.succ();
  },
  async '/exp/pub'({ input, user }) {
    await db.update(
      'experiment',
      { ...input, uid: user.uid },
      { state: ExperimentState.Reviewing.value },
    );
    return o.succ();
  },
  async '/exp/join'({ input, user }) {
    const data = await get_experiment_by_rcid(input.rcid);
    if (o.is(data)) return data;
    const { condition, experiment } = data;
    if (experiment.state !== ExperimentState.Passed.value)
      return o.fail('实验未发布');
    const participants = await db.select('recruitment_participant', {
      rcid: input.rcid,
    });
    if (participants.some((e) => e.uid === user.uid))
      return o.fail('不能重复参加');
    if (participants.length > condition.size)
      return o.error('参与者过多', 'recruitment_participant.rcid', input.rcid);
    if (participants.length === condition.size) return o.fail('参与者已满');
    await db.insert('recruitment_participant', {
      uid: user.uid,
      rcid: input.rcid,
      state: JoinState.Pending.value,
    });
    return o.succ();
  },
  async '/exp/push'({ input, user }) {
    const { rcid, uids } = input;
    const user_ptcs = await db.select('user_participant', { uid: user.uid });
    if (
      difference(
        uids,
        user_ptcs.map((e) => e.puid),
      ).length > 0
    )
      return o.fail('推送用户应在参与者库中');
    const recruitment_ptcs = await db.select('recruitment_participant', {
      rcid,
    });
    if (
      intersection(
        uids,
        recruitment_ptcs.map((e) => e.uid),
      ).length > 0
    )
      return o.fail('存在已报名的参与者');
    const data = await get_experiment_by_rcid(input.rcid);
    if (o.is(data)) return data;
    const { experiment } = data;
    /**@todo 推送消息到参与者 */
    uids.forEach((uid) =>
      msgMgr.send({
        // suid: user.uid,
        uid,
        type: MessageType['Participant.Push'].value,
        title: experiment.title,
        content: `eid: ${experiment.eid}`,
      }),
    );
    return o.succ();
  },
  async '/exp/public'({ input, user }) {
    const { eid } = input;
    const experiment = await expMgr.get(eid);
    if (o.is(experiment)) return experiment;
    if (experiment.state !== ExperimentState.Passed.value)
      return o.fail('实验未发布');
    return o.succ(
      pick(experiment, ['eid', 'uid', 'title', 'type', 'position', 'notice']),
    );
  },
  async '/exp/public/sup'({ input, user }) {
    const { eid } = input;
    const experiment = await expMgr.get(eid);
    if (o.is(experiment)) return experiment;
    if (experiment.state !== ExperimentState.Passed.value)
      return o.fail('实验未发布');
    return o.succ(pick(experiment, ['uid', 'notice']));
  },
  async '/exp/public/list'({ input, user }) {
    const { pn, ps, filter } = input;
    const conditions = {
      state: ExperimentState.Passed.value,
    } satisfies Partial<BTables['experiment']>;
    /**@todo 复杂查询 */
    const experiments = await db.select('experiment', conditions, { pn, ps });
    return o.succ(
      experiments.map((e) =>
        pick(e, ['eid', 'uid', 'title', 'type', 'position', 'notice']),
      ),
    );
  },
  async '/exp/joined'({ input, user }) {
    const { eid } = input;
    /**@todo 联结查询 */
    const recruitments = await db.select('recruitment', { eid });
    if (recruitments.length !== 1)
      return o.error('ID重复', 'experiment.eid', eid);
    const recruitment = recruitments[0];
    const conditions = await db.select('recruitment_condition', {
      rid: recruitment.rid,
    });
    if (conditions.length !== 1)
      return o.error('ID重复', 'recruitment_condition.rid', recruitment.rid);
    const condition = conditions[0];
    const participants = await db.select('recruitment_participant', {
      rcid: condition.rcid,
    });
    if (!participants.some((e) => e.uid === user.uid)) return o.fail('未报名');

    const experiment = await expMgr.get(eid);
    if (o.is(experiment)) return experiment;
    return o.succ(
      pick(experiment, ['eid', 'uid', 'title', 'type', 'position', 'notice']),
    );
  },
  //#endregion /exp
};
