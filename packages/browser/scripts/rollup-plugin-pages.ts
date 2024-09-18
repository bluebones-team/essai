import type { Program } from 'estree';
import { createFilter, FilterPattern } from 'vite';

type ProxyNode<T> = [T] extends [{ type: infer P }]
  ? { [K in keyof T]: ProxyNode<NonNullable<T[K]>> } & {
      is<K extends Extract<P, string>>(
        type: K,
      ): ProxyNode<Extract<T, { type: K }>>;
    }
  : T;
const $ = <T>(e: T) =>
  (Object.prototype.hasOwnProperty.call(e, 'type')
    ? new Proxy(e as T & {}, {
        get(o: any, p) {
          return p === 'is'
            ? (t: string) => (o.type === t ? $(o) : null)
            : $(o[p]);
        },
      })
    : e) as ProxyNode<T>;

const fileRoutesId = 'virtual:file-routes';
export function Pages(
  options: { include?: FilterPattern; exclude?: FilterPattern } = {
    include: 'src/pages/**/*.tsx',
    exclude: 'src/pages/**/components/**',
  },
) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'file-routes',
    load(id) {
      if (id === fileRoutesId) return 'console.log("test")';
      return null;
    },
    transform(code, id) {
      if (!filter(id)) return null;
      const ast = this.parse(code) as unknown as Program;
      ast.body.forEach((node) => {
        $(node)
          .is('ExportNamedDeclaration')
          ?.declaration?.is('VariableDeclaration')
          ?.declarations.forEach((declaration) => {
            const d = $(declaration);
            if (d.id.is('Identifier')?.name !== 'route') return;
            d.init?.is('ObjectExpression')?.properties.forEach((property) => {
              console.log(declaration.init);
            });
          });
      });
      return null;
    },
  };
}
