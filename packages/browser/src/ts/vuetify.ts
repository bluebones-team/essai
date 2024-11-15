import 'vuetify/styles';
import type { Role, Theme } from 'shared/data';
import { createVuetify, type ThemeDefinition } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { Ripple, Tooltip } from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { en, zhHans } from 'vuetify/locale';
import { cyan, grey, indigo, purple, teal } from 'vuetify/util/colors';

export type ActualTheme = Exclude<Theme, typeof Theme.System.value>;
export type AppTheme = ReturnType<typeof toAppTheme>;
export function toAppTheme(role: Role, theme: ActualTheme) {
  return `${role}-${theme}` as const;
}
export const themes = {
  '0-1': {
    colors: {
      primary: cyan.darken4,
      secondary: teal.lighten1,
      background: grey.lighten4,
    },
  },
  '1-1': {
    colors: {
      primary: indigo.darken4,
      secondary: purple.lighten1,
      background: grey.lighten4,
    },
  },
  '0-2': {
    dark: true,
    colors: {
      primary: cyan.darken2,
      secondary: teal.darken3,
    },
  },
  '1-2': {
    dark: true,
    colors: {
      primary: indigo.lighten2,
      secondary: purple.darken2,
    },
  },
} satisfies Record<AppTheme, ThemeDefinition>;
export const vuetify = createVuetify({
  defaults: {
    VTextField: { color: 'primary', variant: 'underlined' },
    VSelect: { color: 'primary', variant: 'underlined' },
    VTextarea: { color: 'primary', variant: 'underlined' },
    VBtn: { color: 'primary', rounded: 'lg' },
    VRangeSlider: { color: 'primary' },
    VSwitch: { color: 'primary' },
    VRadioGroup: { color: 'primary' },
    VCheckbox: { color: 'primary' },
    VBtnToggle: { color: 'primary' },
    VProgressLinear: { color: 'primary' },
    VDatePicker: { color: 'primary' },
    VList: { color: 'primary' },
    VSheet: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
  },
  blueprint: md3,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes,
  },
  locale: {
    locale: 'en',
    messages: { zhHans, en },
  },
  directives: { Tooltip, Ripple },
});
