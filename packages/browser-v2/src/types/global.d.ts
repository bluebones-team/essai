import type { JSX } from 'vuerx-jsx';

declare global {
  /**shortcut for `JSX.Element` */
  type Jsx = JSX.Element;
  type NotFunction = object | Primative;
  type Signal<T extends NotFunction> = (() => T) & {
    set(value: T): void;
    update(updater: (prev: T) => T): void;
  };
  type ModelProps<T extends NotFunction> = { model: Signal<T> };
}
