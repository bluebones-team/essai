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

type ItemConfig<K extends string = string, V extends {} = {}> = [K, V];
type ItemAddtional<K extends string = string, I extends number = number> = {
  /**成员名 */ _name: K;
  /**成员值 */ _value: I;
};
type EnumAddtional<
  V extends number[] = number[],
  C extends ItemConfig[1][] = ItemConfig[1][],
> = {
  /**所有成员枚举 */ _enums: V;
  /**所有成员 */ _items: C;
};
/**推断枚举值 */
export type Enum<T extends EnumAddtional> = T['_enums'][number];
/**构建枚举对象 */
export function toEnum<const T extends ItemConfig[]>(config: T) {
  type EnumValue = IntToTuple<T['length']>;
  //@ts-ignore
  type EnumIndex = EnumValue[number];
  type EnumObject<I = EnumIndex> = UnionToIntersection<
    I extends number
      ? T[I] extends ItemConfig<infer K, infer V>
        ? { readonly [P in I | K]: V & ItemAddtional<K, I> }
        : never
      : never
  >;
  return config.reduce(
    (acc, [k, v], i) => {
      Object.assign(v, { _name: k, _value: i } satisfies ItemAddtional);
      Object.assign(acc, { [k]: v, [i]: v });
      acc._enums.push(i);
      acc._items.push(v);
      return acc;
    },
    { _enums: [], _items: [] } as EnumAddtional,
  ) as EnumObject &
    //@ts-ignore
    EnumAddtional<EnumValue, UnionToTuple<EnumObject[EnumIndex]>>;
}

/**业务码 */
export const BizCode = toEnum([
  ['Success', { title: '响应成功', ok: true }],
  ['Fail', { title: '响应失败', ok: false }],
  ['Unauthorizen', { title: 'Token 无效', ok: false }],
]);
export type BizCode = Enum<typeof BizCode>;
/**招募类型 */
export const RecruitmentType = toEnum([
  ['Subject', { title: '被试', color: 'green' }],
  ['Experimenter', { title: '主试', color: 'red' }],
]);
export type RecruitmentType = Enum<typeof RecruitmentType>;
/**项目类型 */
export const ProjectType = toEnum([
  ['Survey', { title: '问卷（线下）', color: 'green' }],
  ['Interview', { title: '访谈（线下）', color: 'red' }],
  ['Behavior', { title: '行为实验', color: 'blue' }],
  ['ERP', { title: '事件相关电位', color: 'purple' }],
  ['tDCS', { title: '经颅电刺激', color: 'cyan' }],
  ['TMS', { title: '经颅磁刺激', color: 'orange' }],
  ['fMRI', { title: '功能性磁共振成像', color: 'gold' }],
  ['fNIRS', { title: '近红外光学成像', color: 'lime' }],
  ['Other', { title: '其他', color: 'gray' }],
]);
export type ProjectType = Enum<typeof ProjectType>;
/**项目状态 */
export const ProjectState = toEnum([
  [
    'Ready',
    {
      title: '待发布',
      color: 'default',
      noItem: '新建一个项目吧',
      editable: true,
    },
  ],
  [
    'Reviewing',
    {
      title: '审核中',
      color: 'warning',
      noItem: '发布一个项目吧',
      editable: false,
    },
  ],
  // ['Failed', { title: '未过审', color: 'error', noItem:'',editable: true }],
  [
    'Passed',
    {
      title: '发布中',
      color: 'info',
      noItem: '请先等项目过审',
      editable: false,
    },
  ],
  [
    'Completed',
    {
      title: '已完成',
      color: 'success',
      noItem: '你还没有完成的项目',
      editable: false,
    },
  ],
]);
export type ProjectState = Enum<typeof ProjectState>;
/**用户性别 */
export const Gender = toEnum([
  ['Male', { title: '男', color: 'blue', icon: mdiGenderMale }],
  ['Female', { title: '女', color: 'red', icon: mdiGenderFemale }],
]);
export type Gender = Enum<typeof Gender>;
/**身份证类型 */
export const CardType = toEnum([
  ['IDCard', { title: '身份证', color: 'green' }],
  ['Passport', { title: '护照', color: 'red' }],
  ['Other', { title: '其他', color: 'gray' }],
]);
export type CardType = Enum<typeof CardType>;
/**项目举报类型 */
export const RptProjectType = toEnum([
  ['Fee', { title: '报酬', color: 'green' }],
  ['AD', { title: '广告信息', color: 'red' }],
  ['Other', { title: '其他', color: 'gray' }],
]);
export type RptProjectType = Enum<typeof RptProjectType>;
/**用户举报类型 */
export const RptUserType = toEnum([
  ['NoContact', { title: '无法联系', color: 'green' }],
  ['NoJoin', { title: '未按时参加', color: 'red' }],
  ['Other', { title: '其他', color: 'gray' }],
]);
export type RptUserType = Enum<typeof RptUserType>;
/**消息类型 */
export const MessageType = toEnum([
  [
    'System',
    { title: '系统公告', icon: mdiBullhornVariantOutline, group: '系统' },
  ],
  ['Security', { title: '账号安全', icon: mdiLockOutline, group: '系统' }],
  [
    'PushProject',
    { title: '项目推送', icon: mdiFileSendOutline, group: '参与者' },
  ],
  [
    'JoinResult',
    { title: '报名结果', icon: mdiAccountPlusOutline, group: '参与者' },
  ],
  [
    'EventChanged',
    { title: '日程变动', icon: mdiCalendarClock, group: '参与者' },
  ],
  ['EventNotice', { title: '日程提醒', icon: mdiAlarm, group: '参与者' }],
  [
    'ReviewResult',
    { title: '审核结果', icon: mdiFilePlusOutline, group: '招募者' },
  ],
  [
    'ApproveJoin',
    { title: '批准报名', icon: mdiAccountCheckOutline, group: '招募者' },
  ],
  [
    'ProjectFinish',
    { title: '项目结束', icon: mdiFileRemoveOutline, group: '招募者' },
  ],
]);
export type MessageType = Enum<typeof MessageType>;
/**日程类型 */
export const EventType = toEnum([
  ['Public', { title: '公开', color: 'green' }],
  ['Joined', { title: '参与', color: 'red' }],
  ['Own', { title: '自己', color: 'blue' }],
]);
export type EventType = Enum<typeof EventType>;
/**反馈类型 */
export const FeedbackType = toEnum([
  [
    'Bug',
    {
      title: 'Bug',
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
      title: '功能提议',
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
  ['Unregistered', { title: '未注册', color: 'red' }],
  ['Registering', { title: '注册中', color: 'green' }],
  ['Registered', { title: '已注册', color: 'blue' }],
  ['Baned', { title: '已封禁', color: 'gray' }],
]);
export type UserStatus = Enum<typeof UserStatus>;

// frontend
/**用户角色 */
export const Role = toEnum([
  ['Participant', { title: '参与者', color: 'green' }],
  ['Recruiter', { title: '招募者', color: 'red' }],
]);
export type Role = Enum<typeof Role>;
/**页面主题 */
export const Theme = toEnum([
  ['System', { title: '跟随系统', color: 'green' }],
  ['Light', { title: '浅色', color: 'red' }],
  ['Dark', { title: '深色', color: 'gray' }],
]);
export type Theme = Enum<typeof Theme>;
