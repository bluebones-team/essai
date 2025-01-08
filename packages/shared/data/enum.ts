import {
  mdiAccountPlusOutline,
  mdiBullhornVariantOutline,
  mdiFilePlusOutline,
  mdiFileRemoveOutline,
  mdiFileSendOutline,
  mdiGenderFemale,
  mdiGenderMale,
  mdiLockOutline,
  mdiThemeLightDark,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';

const unique = Symbol();
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
  ['NoUser', { msg: 'user not found' }],
  ['ServerError', { msg: 'server error' }],
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
  ['Pending', { text: '待采纳', color: 'default' }],
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
export const ReportType = toEnum([
  ['Experiment.Fee', { text: '报酬过低或过高' }],
  ['Experiment.AD', { text: '存在广告信息' }],
  ['Experiment.Other', { text: '其他' }],
  ['User.Other', { text: '其他' }],
]);
export type ReportType = Enum<typeof ReportType>;
/**消息类型 */
export const MessageType = toEnum([
  [
    'Sys.Announcement',
    { text: '系统公告', icon: mdiBullhornVariantOutline, group: '系统' },
  ],
  ['Sys.Security', { text: '账号安全', icon: mdiLockOutline, group: '系统' }],
  [
    'Participant.Push',
    { text: '实验推送', icon: mdiFileSendOutline, group: '参与者' },
  ],
  [
    'Participant.JoinResult',
    { text: '报名结果', icon: mdiAccountPlusOutline, group: '参与者' },
  ],
  // [
  //   'EventChanged',
  //   { text: '日程变动', icon: mdiCalendarClock, group: '参与者' },
  // ],
  // ['EventNotice', { text: '日程提醒', icon: mdiAlarm, group: '参与者' }],
  [
    'Recruiter.ReviewResult',
    { text: '审核结果', icon: mdiFilePlusOutline, group: '招募者' },
  ],
  [
    'Recruiter.Finish',
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
      text: '使用问题',
      desc: '尽可能详细描述您遇到的问题，以便我们更快地定位并解决',
    },
  ],
  [
    'Feature',
    {
      text: '功能建议',
      desc: '尽可能详细描述您希望实现的新功能，以便我们更快地评估和实现',
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
  ['Participant', { text: '参与者' }],
  ['Recruiter', { text: '招募者' }],
]);
export type Role = Enum<typeof Role>;
/**页面主题 */
export const Theme = toEnum([
  ['System', { text: '跟随系统', icon: mdiThemeLightDark }],
  ['Light', { text: '浅色', icon: mdiWeatherSunny }],
  ['Dark', { text: '深色', icon: mdiWeatherNight }],
]);
export type Theme = Enum<typeof Theme>;
