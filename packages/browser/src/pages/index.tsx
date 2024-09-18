import { mdiArrowRight, mdiHomeOutline, mdiQqchat } from '@mdi/js';
import { defineComponent } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VFooter } from 'vuetify/components/VFooter';
import { VIcon } from 'vuetify/components/VIcon';
import { VMain } from 'vuetify/components/VMain';

const Divider = () => <hr style="opacity: 0.2" />;
//@ts-ignore
const Card = ({ title, text }) => (
  <div class="pa-4 bg-surface rounded-lg elevation-6 text-left w-md-25">
    <p class="text-h6 font-weight-bold mb-2">{title}</p>
    <p class="font-weight-light">{text}</p>
  </div>
);
//@ts-ignore
const Block = ({ title, subtitle }, { slots }) => (
  <>
    <Divider />
    <div class="text-center my-16">
      <h2 class="text-h4 mb-2">{title}</h2>
      <p class="mb-4 font-weight-light">{subtitle}</p>
      {slots.default?.()}
    </div>
  </>
);
//@ts-ignore
const Link = (props, { slots }) => (
  <a
    target="_blank"
    class="text-decoration-none text-surface mx-1 text-caption"
    {...props}
  >
    {slots.default?.()}
  </a>
);

export const route: SupplyRoute = {
  meta: {
    nav: {
      tip: '主页',
      icon: mdiHomeOutline,
      order: 2,
      hideOn: 'mobile',
    },
  },
};
export default defineComponent(
  function () {
    return () => (
      <VMain class="h-100 overflow-auto" style="word-break: break-all">
        <div class="mx-4 py-16 text-center">
          <h1 class="text-h2 font-weight-black mt-16 mb-6">线下实验招募平台</h1>
          <p class="text-h6 mx-auto" style="max-width: 800px">
            这里是蓝骨头工作流的起点，欢迎加入我们的团队！
          </p>
          <div class="my-8 d-flex flex-wrap justify-center ga-6">
            {[
              {
                text: '从这开始',
                variant: 'flat' as const,
                to: '/public',
                appendIcon: mdiArrowRight,
              },
              {
                text: '关于我们',
                variant: 'outlined' as const,
                to: '/about',
              },
            ].map((e) => (
              <VBtn size="large" {...e} />
            ))}
          </div>
          <Divider />
          <div class="d-flex flex-wrap justify-center ga-6 my-16">
            {[
              {
                title: '项目筛选',
                text: '这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好',
              },
              {
                title: '日程安排',
                text: '这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好',
              },
              {
                title: '项目推送',
                text: '这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好这个功能好',
              },
            ].map((e) => (
              <Card {...e} />
            ))}
          </div>
        </div>
        <VFooter class="bg-primary text-center py-16">
          <div class="mx-auto">
            {[
              {
                icon: mdiQqchat,
                href: 'https://qm.qq.com/q/214gmxUVKw',
              },
            ].map((e) => (
              <Link {...e}>
                <VIcon icon={e.icon} />
              </Link>
            ))}
            <Divider />
            {[
              {
                text: `©${new Date().getFullYear()} 蓝骨头团队`,
                href: '/about',
                target: '_self',
              },
              {
                text: '赣ICP备2024021771号',
                href: 'http://beian.miit.gov.cn/',
              },
            ].map((e) => (
              <Link {...e}></Link>
            ))}
          </div>
        </VFooter>
      </VMain>
    );
  },
  { name: 'Index' },
);
