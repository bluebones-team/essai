import { toEnum, type Enum } from 'shared/enum';

export const Tabbar = toEnum([
  ['join', { label: '报名', icon: 'home' }],
  ['joined', { label: '已参加', icon: 'chat' }],
  ['manage', { label: '管理', icon: 'home' }],
  ['push', { label: '推送', icon: 'chat' }],
  ['user', { label: '我的', icon: 'user' }],
]);
export type Tabbar = Enum<typeof Tabbar>;
export const PanelType = toEnum([
  [
    'participate',
    { label: '参与者', tabBars: [Tabbar.join, Tabbar.joined, Tabbar.user] },
  ],
  [
    'recruiter',
    { label: '招募者', tabBars: [Tabbar.manage, Tabbar.push, Tabbar.user] },
  ],
]);
export type PanelType = Enum<typeof PanelType>;
