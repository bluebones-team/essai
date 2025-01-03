import {
  mdiAccountCheckOutline,
  mdiAccountPlusOutline,
  mdiAlarm,
  mdiBullhornVariantOutline,
  mdiCalendarClock,
  mdiFilePlusOutline,
  mdiFileRemoveOutline,
  mdiFileSendOutline,
  mdiGenderFemale,
  mdiGenderMale,
  mdiLockOutline,
} from '@mdi/js';

type ItemData = Partial<ItemMeta<typeof unique, typeof unique>> &
  Record<string, unknown>;
type ItemKD<K extends string = string, D extends ItemData = ItemData> = [K, D];
type ItemMeta<K = string, V = number> = {
  /**成员名 */ name: K;
  /**成员值 */ value: V;
};
export type EnumMeta<
  V extends number[] = number[],
  D extends Merge<ItemData, ItemMeta>[] = Merge<ItemData, ItemMeta>[],
> = {
  /**所有成员枚举 */ enums: V;
  /**所有成员 */ items: D;
};
/**推断枚举值 */
export type Enum<T extends EnumMeta> = T['enums'][number];
/**构建枚举对象 */
export function toEnum<const T extends ItemKD[]>(config: T) {
  type EnumValue = IntToTuple<T['length']>;
  //@ts-ignore
  type EnumIndex = EnumValue[number];
  type EnumObject<I = EnumIndex> = UnionToIntersection<
    I extends number
      ? T[I] extends ItemKD<infer K, infer V>
        ? { readonly [P in I | K]: V & ItemMeta<K, I> }
        : never
      : never
  >;
  return config.reduce<EnumMeta>(
    (acc, [k, v], i) => {
      Object.assign(v, { name: k, value: i } satisfies ItemMeta);
      Object.assign(acc, { [k]: v, [i]: v });
      acc.enums.push(i);
      acc.items.push(v);
      return acc;
    },
    { enums: [], items: [] },
  ) as EnumObject &
    //@ts-ignore
    EnumMeta<EnumValue, UnionToTuple<EnumObject[EnumIndex]>>;
}

/**业务码 */
export const OutputCode = toEnum([
  ['Success', { msg: 'ok' }],
  ['Fail', { msg: 'fail' }],
  ['Unauthorizen', { msg: 'token invalid' }],
  ['NoUser', { msg: '用户不存在' }],
]);
export type OutputCode = Enum<typeof OutputCode>;
/**招募类型 */
export const RecruitmentType = toEnum([
  ['Subject', { text: '被试', color: 'green' }],
  ['Experimenter', { text: '主试', color: 'red' }],
]);
export type RecruitmentType = Enum<typeof RecruitmentType>;
/**实验类型 */
export const ExperimentType = toEnum([
  // ['Survey', { text: '问卷（线下）', color: 'green' }],
  // ['Interview', { text: '访谈（线下）', color: 'red' }],
  ['Behavior', { text: '行为实验', color: 'blue' }],
  ['ERP', { text: '事件相关电位', color: 'purple' }],
  ['tDCS', { text: '经颅电刺激', color: 'cyan' }],
  ['TMS', { text: '经颅磁刺激', color: 'orange' }],
  ['fMRI', { text: '功能性磁共振成像', color: 'gold' }],
  ['fNIRS', { text: '近红外光学成像', color: 'lime' }],
  ['Other', { text: '其他', color: 'gray' }],
]);
export type ExperimentType = Enum<typeof ExperimentType>;
/**实验状态 */
export const ExperimentState = toEnum([
  [
    'Ready',
    {
      text: '待发布',
      color: 'default',
      noItem: '请先创建实验',
      readonly: false,
    },
  ],
  [
    'Reviewing',
    {
      text: '审核中',
      color: 'warning',
      noItem: '请先发布实验',
      readonly: true,
    },
  ],
  // ['Failed', { text: '未过审', color: 'error', noItem:'',editable: true }],
  [
    'Passed',
    {
      text: '发布中',
      color: 'info',
      noItem: '请先等实验过审',
      readonly: true,
    },
  ],
  [
    'Completed',
    {
      text: '已完成',
      color: 'success',
      noItem: '还没有完成的实验',
      readonly: true,
    },
  ],
]);
export type ExperimentState = Enum<typeof ExperimentState>;
/**报名状态 */
export const JoinState = toEnum([
  ['Approved', { text: '已采纳', color: 'success' }],
  ['Rejected', { text: '未采纳', color: 'default' }],
]);
export type JoinState = Enum<typeof JoinState>;
/**用户性别 */
export const Gender = toEnum([
  ['Male', { text: '男', color: 'blue', icon: mdiGenderMale }],
  ['Female', { text: '女', color: 'red', icon: mdiGenderFemale }],
]);
export type Gender = Enum<typeof Gender>;
/**身份证类型 */
export const CardType = toEnum([
  ['IDCard', { text: '身份证', color: 'green' }],
  ['Passport', { text: '护照', color: 'red' }],
  ['Other', { text: '其他', color: 'gray' }],
]);
export type CardType = Enum<typeof CardType>;
/**实验举报类型 */
export const ReportProjectType = toEnum([
  ['Fee', { text: '报酬', color: 'green' }],
  ['AD', { text: '广告信息', color: 'red' }],
  ['Other', { text: '其他', color: 'gray' }],
]);
export type ReportProjectType = Enum<typeof ReportProjectType>;
/**用户举报类型 */
export const ReportUserType = toEnum([
  ['NoContact', { text: '无法联系', color: 'green' }],
  ['NoJoin', { text: '未按时参加', color: 'red' }],
  ['Other', { text: '其他', color: 'gray' }],
]);
export type ReportUserType = Enum<typeof ReportUserType>;
/**消息类型 */
export const MessageType = toEnum([
  [
    'System',
    { text: '系统公告', icon: mdiBullhornVariantOutline, group: '系统' },
  ],
  ['Security', { text: '账号安全', icon: mdiLockOutline, group: '系统' }],
  [
    'PushProject',
    { text: '实验推送', icon: mdiFileSendOutline, group: '参与者' },
  ],
  [
    'JoinResult',
    { text: '报名结果', icon: mdiAccountPlusOutline, group: '参与者' },
  ],
  [
    'EventChanged',
    { text: '日程变动', icon: mdiCalendarClock, group: '参与者' },
  ],
  ['EventNotice', { text: '日程提醒', icon: mdiAlarm, group: '参与者' }],
  [
    'ReviewResult',
    { text: '审核结果', icon: mdiFilePlusOutline, group: '招募者' },
  ],
  [
    'ApproveJoin',
    { text: '批准报名', icon: mdiAccountCheckOutline, group: '招募者' },
  ],
  [
    'ProjectFinish',
    { text: '实验结束', icon: mdiFileRemoveOutline, group: '招募者' },
  ],
]);
export type MessageType = Enum<typeof MessageType>;
/**日程类型 */
export const EventType = toEnum([
  ['Public', { text: '公开', color: 'green' }],
  ['Joined', { text: '参与', color: 'red' }],
  ['Own', { text: '自己', color: 'blue' }],
]);
export type EventType = Enum<typeof EventType>;
/**反馈类型 */
export const FeedbackType = toEnum([
  [
    'Bug',
    {
      text: 'Bug',
      display: [
        {
          label: 'Bug描述',
          rows: 3,
        },
        {
          label: '如何触发这个Bug？',
          hint: '我们将根据这些步骤重现Bug',
          rows: 3,
        },
      ],
    },
  ],
  [
    'Feature',
    {
      text: '功能提议',
      display: [
        {
          label: '您遇到了什么问题？',
          hint: '我们需要明确这个需求',
          rows: 3,
        },
        {
          label: '您觉得应该如何解决？',
          hint: '我们将优先考虑您的建议',
          rows: 3,
        },
      ],
    },
  ],
]);
export type FeedbackType = Enum<typeof FeedbackType>;
/**用户状态 */
export const UserStatus = toEnum([
  ['Unregistered', { text: '未注册', color: 'red' }],
  ['Registering', { text: '注册中', color: 'green' }],
  ['Registered', { text: '已注册', color: 'blue' }],
  ['Baned', { text: '已封禁', color: 'gray' }],
]);
export type UserStatus = Enum<typeof UserStatus>;

// frontend
/**用户角色 */
export const Role = toEnum([
  ['Participant', { text: '参与者', color: 'green' }],
  ['Recruiter', { text: '招募者', color: 'red' }],
]);
export type Role = Enum<typeof Role>;
/**页面主题 */
export const Theme = toEnum([
  ['System', { text: '跟随系统', color: 'green' }],
  ['Light', { text: '浅色', color: 'red' }],
  ['Dark', { text: '深色', color: 'gray' }],
]);
export type Theme = Enum<typeof Theme>;
