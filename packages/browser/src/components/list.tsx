import { computed, defineComponent, useModel, type VNode } from 'vue';
import {
  VList,
  VListGroup,
  VListItem,
  VListSubheader,
} from 'vuetify/components/VList';
import { VScrollYReverseTransition } from 'vuetify/components/transitions';
import { useDefaults } from '~/ts/hook';
import { checkModel } from '~/ts/util';

const typePropsMap = {
  default: {
    list: { class: 'd-flex flex-column overflow-auto bg-background' },
    item: { class: 'bg-surface', border: true },
  },
  nav: {
    list: {
      density: 'compact' as 'compact',
      activeClass: 'text-primary',
      nav: true,
      slim: true,
    },
    item: {},
  },
  groups: {
    list: {
      density: 'compact' as 'compact',
      activeClass: 'text-primary',
      nav: true,
      slim: true,
    },
    item: {},
  },
};
function Items<T>(props: {
  itemProps: Props<VListItem>;
  items?: { value: T; show?: () => boolean }[];
  noItemText?: string;
}) {
  return props.items?.length
    ? props.items.map((item) => (
        <VListItem
          key={item.value + ''}
          v-show={item.show?.() ?? true}
          {...Object.assign(props.itemProps, item)}
        />
      ))
    : [<VListItem key="-1" title={props.noItemText ?? '没有项目'} />];
}
function Sections<T>(props: {
  sections?: {
    title: string;
    items?:
      | {
          value: T;
          show?: (() => boolean) | undefined;
        }[]
      | undefined;
    noItems?: string | undefined;
  }[];
  sectionRender: (
    e: NonNullable<typeof props.sections>[number],
  ) => VNode | VNode[];
}) {
  return (
    <VScrollYReverseTransition group>
      {props.sections?.flatMap(props.sectionRender)}
    </VScrollYReverseTransition>
  );
}

export const List = defineComponent(function <T>(
  _p: {
    type?: keyof typeof typePropsMap;
    sections?: {
      title: string;
      items?: { value: T; show?: () => boolean }[];
      noItems?: string;
    }[];
    items?: T[];
  } & {
    modelValue?: T;
    'onUpdate:modelValue'?: (value: T) => void;
  },
  { slots: _slots }: { slots: Slots<VList> },
) {
  const model = useModel(_p, 'modelValue');
  const p = useDefaults(_p, { type: 'default' });
  const typeProps = computed(() => typePropsMap[p.type]);
  function ListRoot(
    props: Props<VList>,
    { slots }: { slots: { default: () => VNode } },
  ) {
    const actualProps = Object.assign({}, typeProps.value.list, props);
    return (
      <VList
        selected={[model.value]}
        onUpdate:selected={(e) => {
          // @ts-ignore
          model.value = e[0];
        }}
        mandatory
        {...actualProps}
        v-slots={Object.assign(_slots, {
          default: _slots.default ?? slots.default,
        })}
      />
    );
  }

  return () =>
    p.items ? (
      <ListRoot items={p.items} itemProps />
    ) : p.type === 'groups' ? (
      <ListRoot openStrategy="multiple">
        <Sections
          sections={p.sections}
          sectionRender={({ title, items, noItems }) => (
            <VListGroup
              key={title}
              v-slots={{
                activator: ({ props }) => [
                  <VListItem title={title} {...props} />,
                ],
                default: () =>
                  Items({
                    itemProps: typeProps.value.item,
                    items,
                    noItemText: noItems,
                  }),
              }}
            ></VListGroup>
          )}
        />
      </ListRoot>
    ) : (
      <ListRoot>
        <Sections
          sections={p.sections}
          sectionRender={({ title, items, noItems }) => [
            <VListSubheader title={title} key={title} />,
            ...Items({
              itemProps: typeProps.value.item,
              items,
              noItemText: noItems,
            }),
          ]}
        />
      </ListRoot>
    );
});
