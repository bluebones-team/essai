import { mdiCheckCircleOutline } from '@mdi/js';
import { VIcon } from 'vuetify/components/VIcon';
import { VSkeletonLoader } from 'vuetify/components/VSkeletonLoader';
import { VSwitch } from 'vuetify/components/VSwitch';

export const comp = {
  switch<T>([data, key]: [T, keyof T], title: string, subtitle?: string) {
    return {
      title,
      subtitle,
      horizontal: true,
      comp: () => (
        <VSwitch
          v-model={data[key]}
          density="compact"
          style={{ '--v-input-control-height': '0px', width: 'max-content' }}
          hideDetails
          inset
        />
      ),
    };
  },
};
export const panel = {
  content: (props = {}) => (
    <VSkeletonLoader type="article" class="rounded-xl" boilerplate {...props} />
  ),
  text: (text: string, isSelected: boolean) => (
    <p
      class={{
        'ma-4': true,
        'text-primary font-weight-black': isSelected,
      }}
    >
      {isSelected && <VIcon class="mr-1" icon={mdiCheckCircleOutline} />}
      {text}
    </p>
  ),
  toComp(text: string, props?: {}) {
    return ({ toggle, isSelected }: any) => (
      <div onClick={toggle}>
        {this.content(props)}
        {this.text(text, isSelected)}
      </div>
    );
  },
};
