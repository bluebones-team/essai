import { mdiAlertOutline } from '@mdi/js';
import { defineComponent } from 'vue';
import { VAvatar } from 'vuetify/components/VAvatar';
import { VIcon } from 'vuetify/components/VIcon';
import { VImg } from 'vuetify/components/VImg';
import { VProgressCircular } from 'vuetify/components/VProgressCircular';

export const Pic = defineComponent(function (p: {
  src: string;
  size?: number | string;
  rounded?: number | boolean | string;
  disabled?: boolean;
  loadingSrc?: string;
  errorSrc?: string;
}) {
  return () => (
    <VAvatar {...{ size: p.size, rounded: p.rounded ?? 'circle' }}>
      <VImg
        {...{ src: p.src, lazySrc: p.loadingSrc }}
        aspectRatio="1"
        cover
        v-slots={{
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
            p.errorSrc ? (
              <VImg src={p.errorSrc} lazySrc={p.loadingSrc} />
            ) : (
              <VIcon color="error" icon={mdiAlertOutline} size={p.size} />
            ),
        }}
      />
    </VAvatar>
  );
});
