import {
  computed,
  defineComponent,
  inject,
  useModel,
  type ComputedRef,
  type SetupContext,
} from 'vue';
import { useDisplay, type SubmitEventPromise } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VCardActions } from 'vuetify/components/VCard';
import { VForm } from 'vuetify/components/VForm';
import { VSpacer } from 'vuetify/components/VGrid';
import { injectSymbol } from '~/ts/state';

function useSizeStyle(mobile: ComputedRef<boolean>) {
  return computed(() => ({
    small: { width: mobile.value ? '100%' : '20rem' },
    default: { width: 'auto' },
    large: { width: mobile.value ? '100vw' : '40rem' },
  }));
}
export const Form = defineComponent(function (
  p: {
    size?: keyof ReturnType<typeof useSizeStyle>['value'];
    actions?: RequiredKeys<Props<VBtn>, 'text'>[];
    onPass?(): void;
    onFail?(errors: Awaited<SubmitEventPromise>['errors']): void;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?: (value: boolean) => void;
  },
  { slots }: Omit<SetupContext, 'expose'>,
) {
  const model = useModel(p, 'modelValue');
  const editable = inject(injectSymbol.editable) ?? { value: false };
  const { mobile } = useDisplay();
  const sizeStyle = useSizeStyle(mobile);
  return () => (
    <VForm
      v-model={model.value}
      validateOn="submit lazy"
      fastFail
      readonly={!editable.value}
      style={sizeStyle.value[p.size ?? 'default']}
      onSubmit={async (e) => {
        e.preventDefault();
        const { valid, errors } = await e;
        valid ? p.onPass?.() : p.onFail?.(errors);
      }}
    >
      {slots.default?.()}
      {p.actions?.length && (
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          {p.actions.map((action, i) => (
            <VBtn key={action.text} {...action} />
          ))}
        </VCardActions>
      )}
    </VForm>
  );
});
