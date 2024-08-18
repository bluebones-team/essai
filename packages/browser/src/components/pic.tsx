import { mdiAlertOutline } from '@mdi/js';
import { defineComponent } from 'vue';
import { VAvatar } from 'vuetify/components/VAvatar';
import { VIcon } from 'vuetify/components/VIcon';
import { VImg } from 'vuetify/components/VImg';
import { VProgressCircular } from 'vuetify/components/VProgressCircular';

export const Pic = defineComponent(function (props: {
  src: string;
  size?: number | string;
  rounded?: number | boolean | string;
  disabled?: boolean;
  loadingSrc?: string;
  errorSrc?: string;
}) {
  return () => (
    <VAvatar {...{ size: props.size, rounded: props.rounded ?? 'circle' }}>
      <VImg
        {...{ src: props.src, lazySrc: props.loadingSrc }}
        aspectRatio="1"
        cover
      >
        {{
          placeholder: () => (
            <div class="d-flex align-center justify-center h-100">
              <VProgressCircular
                color="grey-lighten-1"
                size="small"
                indeterminate
              />
            </div>
          ),
          error: () =>
            props.errorSrc ? (
              <VImg src={props.errorSrc} lazySrc={props.loadingSrc} />
            ) : (
              <VIcon color="error" icon={mdiAlertOutline} size={props.size} />
            ),
        }}
      </VImg>
    </VAvatar>
  );
});
