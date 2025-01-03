import { mdiInformationOutline } from '@mdi/js';
import { pick } from 'shared';
import {
  defineComponent,
  withDirectives,
  type TdHTMLAttributes,
  type VNode,
  type VNodeChild,
} from 'vue';
import { VAlert } from 'vuetify/components/VAlert';
import { VBtn } from 'vuetify/components/VBtn';
import { VChip } from 'vuetify/components/VChip';
import { VDataTableVirtual } from 'vuetify/components/VDataTable';
import { VItem, VItemGroup } from 'vuetify/components/VItemGroup';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Ripple } from 'vuetify/directives';
import { pickModel } from '~/ts/util';

export type TableHeader<T> = {
  title: string;
  key: keyof T & string;
  value?: (item: T) => string | number | VNode;
  cellProps?: TdHTMLAttributes;
  [x: string]: any;
};
export type TableSlots<
  T extends Slots<VDataTableVirtual> = Slots<VDataTableVirtual>,
> = Partial<{
  toolbar(...e: Parameters<NonNullable<T['top']>>): VNodeChild;
  groupChip(item: any): VNodeChild;
  noData(): string | null;
}>;
export const Table = defineComponent(function <
  T extends {},
  S extends string,
  M extends boolean,
  V = M extends true ? T[] : T,
>(
  p: {
    items: T[];
    headers: TableHeader<T>[];
    groupBy?: { order: 'desc' | 'asc'; key: keyof T & string }[];
    'onClick:item'?: (item: T) => any;
    multiple?: M;
    search?: S;
    customFilter?: (value: unknown, query: S, item?: any) => boolean;
    slots?: TableSlots;
  } & {
    modelValue?: V;
    'onUpdate:modelValue'?: (v: V) => void;
  },
) {
  const itemSlots: (item: T) => Slots<VItem> = (item) => ({
    default: ({ isSelected, toggle }) => [
      withDirectives(
        <tr
          class={{
            activated: isSelected,
            'no-select': true,
          }}
          onClick={(e) => {
            p['onClick:item']?.(item);
            toggle?.();
          }}
        >
          {p.groupBy && <td></td>}
          {p.headers.map(({ value, key, cellProps }) => (
            <td {...cellProps}>{value?.(item) ?? item[key] + ''}</td>
          ))}
        </tr>,
        [[Ripple, true]],
      ),
    ],
  });
  const tableSlots: Slots<VDataTableVirtual> = {
    top: (e) => [<VToolbar>{p.slots?.toolbar?.(e)}</VToolbar>],
    'header.data-table-group': (e) => [],
    'group-header': ({ item, columns, toggleGroup, isGroupOpen }) => [
      <tr>
        <td colspan={columns.length} onClick={() => toggleGroup(item)}>
          <VBtn
            ripple={false}
            size="small"
            variant="text"
            icon={isGroupOpen(item) ? '$expand' : '$next'}
          />
          {p.slots?.groupChip?.(item)}
          <VChip text={item.items.length + ''} size="small" variant="text" />
        </td>
      </tr>,
    ],
    item: ({ item }) => [<VItem value={item} v-slots={itemSlots(item)} />],
    'no-data': () => [
      <VAlert
        icon={mdiInformationOutline}
        title={p.slots?.noData?.() ?? 'No data'}
      />,
    ],
  };
  return () => (
    <VItemGroup {...pickModel(p)} multiple={p.multiple}>
      {/* @ts-ignore */}
      <VDataTableVirtual
        {...pick(p, ['items', 'headers', 'groupBy', 'search', 'customFilter'])}
        class="h-100 overflow-auto"
        density="comfortable"
        fixedHeader
        hover
        v-slots={tableSlots}
      />
    </VItemGroup>
  );
});
