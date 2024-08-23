import { mdiHelpBoxOutline } from '@mdi/js';
import {
  defineComponent,
  h,
  type Component,
  type SetupContext,
  type SlotsType,
  type VNode,
} from 'vue';
import {
  VCard,
  VCardSubtitle,
  VCardText,
  VCardTitle,
} from 'vuetify/components/VCard';
import { VDivider } from 'vuetify/components/VDivider';
import { VIcon } from 'vuetify/components/VIcon';
import { VSheet } from 'vuetify/components/VSheet';

function Title(item: Props<typeof Section>['items'][number]) {
  return (
    <div>
      {item.title && (
        <VCardTitle
          class={{
            'text-subtitle-1 font-weight-bold py-4 text-wrap': true,
            'pb-2': !item.horizontal || item.subtitle,
          }}
        >
          {item.title}
          {item.tip && (
            <VIcon class="ml-1" icon={mdiHelpBoxOutline} onClick={() => {}} />
          )}
        </VCardTitle>
      )}
      {item.subtitle && (
        <VCardSubtitle class="pb-4 text-body-2 text-wrap">
          {item.subtitle}
        </VCardSubtitle>
      )}
    </div>
  );
}
function Content(
  item: Props<typeof Section>['items'][number],
  {
    slots,
  }: Omit<SetupContext<[], SlotsType<{ default?: () => VNode }>>, 'expose'>,
) {
  return (
    <VCardText
      class={
        item.horizontal ? 'py-4 d-flex justify-end align-center' : 'pt-2 pb-4'
      }
    >
      {item.comp && h(item.comp)}
      {slots.default?.()}
    </VCardText>
  );
}
const Item = defineComponent(function (
  p: { item: Props<typeof Section>['items'][number]; showDivider?: boolean },
  { slots },
) {
  return () => (
    <>
      {p.showDivider && <VDivider />}
      <VCard
        class={{
          'd-flex justify-space-between align-center': p.item.horizontal,
        }}
        variant="flat"
      >
        {p.item.prepend && h(p.item.prepend)}
        <Title {...p.item} />
        <Content {...p.item} v-slots={slots}></Content>
      </VCard>
    </>
  );
});
export const Section = defineComponent(function (
  props: {
    title?: string;
    subtitle?: string;
    items: {
      title?: string;
      subtitle?: string;
      tip?: string;
      horizontal?: boolean;
      prepend?: Component;
      comp?: Component;
    }[];
  },
  { slots },
) {
  return () => (
    <section class="mx-md-9 mx-3">
      {props.title && (
        <VCardTitle class="pt-8 pb-4 font-weight-bold text-h6">
          {props.title}
        </VCardTitle>
      )}
      {props.subtitle && (
        <VCardSubtitle class="mb-4 text-button opacity-100">
          {props.subtitle}
        </VCardSubtitle>
      )}
      <VSheet class="mb-6 mx-4" elevation="2" border>
        {/* <VScrollYReverseTransition group appear> */}
        {props.items.map((item, index) => (
          <Item key={item.title ?? index} item={item} showDivider={!!index}>
            {slots[`item-${index}`]?.()}
          </Item>
        ))}
        {/* </VScrollYReverseTransition> */}
      </VSheet>
    </section>
  );
});
