import { mdiInformationOutline } from '@mdi/js';
import {
  defineComponent,
  useModel,
  withDirectives,
  type SetupContext,
  type SlotsType,
  type TdHTMLAttributes,
  type VNode,
} from 'vue';
import { VAlert } from 'vuetify/components/VAlert';
import { VBtn } from 'vuetify/components/VBtn';
import { VChip } from 'vuetify/components/VChip';
import { VDataTableVirtual } from 'vuetify/components/VDataTable';
import { VItem, VItemGroup } from 'vuetify/components/VItemGroup';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Ripple } from 'vuetify/directives';

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
  toolbar: T['top'];
  groupChip(item: any): VNode;
  noData: T['no-data'];
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
  } & {
    modelValue?: V;
    'onUpdate:modelValue'?: (v: V) => void;
  },
  { slots }: Omit<SetupContext<[], SlotsType<TableSlots>>, 'expose'>,
) {
  const model = useModel(p, 'modelValue');
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
    top: (e) => [<VToolbar>{slots.toolbar?.(e)}</VToolbar>],
    'header.data-table-group': (e) => [],
    'group-header': ({ item, columns, toggleGroup, isGroupOpen }) => [
      <tr>
        <td colspan={columns.length} onClick={() => toggleGroup(item)}>
          <VBtn
            ripple={false}
            size="small"
            variant="text"
            icon={isGroupOpen(item) ? '$expand' : '$next'}
          ></VBtn>
          {slots.groupChip?.(item)}
          <VChip
            text={item.items.length + ''}
            size="small"
            variant="text"
          ></VChip>
        </td>
      </tr>,
    ],
    item: ({ item }) => [
      <VItem value={item} v-slots={itemSlots(item)}></VItem>,
    ],
    'no-data': () => [
      <VAlert icon={mdiInformationOutline}>{slots.noData?.()}</VAlert>,
    ],
  };
  return () => (
    <VItemGroup v-model={model.value} multiple={p.multiple}>
      {/* @ts-ignore */}
      <VDataTableVirtual
        {...{
          items: p.items,
          headers: p.headers,
          groupBy: p.groupBy,
          search: p.search,
          customFilter: p.customFilter,
        }}
        class="h-100 overflow-auto"
        density="comfortable"
        fixedHeader
        hover
        v-slots={tableSlots}
      ></VDataTableVirtual>
    </VItemGroup>
  );
});
