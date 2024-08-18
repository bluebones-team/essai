import { isVNode, type VNode } from 'vue';

const contentPropsMap = {
  h1: { class: 'text-h5' },
  p: { class: 'text-h6' },
};
export function Article(props: {
  contents: ([keyof typeof contentPropsMap, string] | VNode)[];
}) {
  return (
    <div class="pa-6">
      {props.contents.map((e) => {
        if (isVNode(e)) return e;
        const [Tag, text] = e;
        return <Tag {...contentPropsMap[Tag]}>{text}</Tag>;
      })}
    </div>
  );
}
