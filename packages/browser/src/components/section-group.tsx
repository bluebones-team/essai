import { Section } from '~/components/section';
import { VScrollYReverseTransition } from 'vuetify/components/transitions';

export function SectionGroup(props: { sections: Props<typeof Section>[] }) {
  return (
    <VScrollYReverseTransition group appear>
      {props.sections.map((item, i) => (
        <Section
          key={item.title ?? i}
          //@ts-ignore
          style={{ transitionDelay: `${i * 0.1}s` }}
          {...item}
        />
      ))}
    </VScrollYReverseTransition>
  );
}
