import { mergeProps, type JSX } from 'vuerx-jsx';
import { z } from 'zod';

export function Field(
  p: ModelProps<string> & {
    label?: string;
    hint?: string;
    extra?: JSX.InputHTMLAttributes<HTMLInputElement>;
    prepend?: Jsx;
    append?: Jsx;
  },
) {
  return (
    <>
      <label class="fieldset-label">Title</label>
      <label class="input validator">
        {p.prepend}
        <input
          {...(mergeProps({ text: 'text' }, p.extra) as typeof p.extra)}
          value={p.model()}
          on:change={(e) => p.model.set(e.currentTarget.value)}
        />
        {p.append}
      </label>
      <p class="validator-hint">{p.hint}</p>
    </>
  );
}
function createSchemaField<T extends z.ZodTypeAny>(
  schema: T,
  extra?: LooseObject,
) {
  const { metadata } = schema;
  const sharedProps = () => ({
    placeholder: metadata?.text,
    title: metadata?.desc,
    // validator() {},
    ...extra,
  });
  if (metadata) {
    if (metadata.type === 'textarea') {
      console.log(sharedProps());
      return <textarea class="textarea" {...sharedProps()}></textarea>;
    }
    if (metadata.type === 'date')
      return <input type="date" class="input" {...sharedProps()} />;
    if (metadata.type === 'range')
      return <input type="range" class="range" {...sharedProps()} />;
    if (metadata.items)
      return (
        <select class="select" {...sharedProps()}>
          {metadata.items.map((item) => (
            <option value={item.value}>{item.text}</option>
          ))}
        </select>
      );
  }
  if (schema instanceof z.ZodString)
    return <input type="text" class="input" {...sharedProps()} />;
  if (schema instanceof z.ZodNumber)
    return <input type="number" class="input" {...sharedProps()} />;
  if (schema instanceof z.ZodBoolean)
    return <input type="checkbox" class="toggle" {...sharedProps()} />;
  if (schema instanceof z.ZodBranded || schema instanceof z.ZodOptional)
    return createSchemaField(schema.unwrap(), extra);
  return `not supported field type: ${schema._def.typeName}`;
}
export function Form<T extends LooseObject>(p: {
  title: string;
  schema: z.ZodObject<T>;
  layout(comps: { [K in keyof T]: (p: LooseObject) => Jsx }): Jsx[];
}) {
  const comps = new Proxy(p.schema.shape, {
    get: (o, k: string) =>
      o[k]
        ? (p: {}) => createSchemaField(o[k], { name: k, ...p })
        : `field ${k} not found`,
  });
  return (
    <fieldset class="fieldset bg-base-200 border border-base-300 p-4 rounded-box">
      <legend class="fieldset-legend">{p.title}</legend>
      <div class="grid grid-cols-12 gap-4">{p.layout(comps)}</div>
    </fieldset>
  );
}
