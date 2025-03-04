/// <reference types="vite/client" />
/// <reference types="shared/types" />

import 'vuerx-jsx';

declare module 'vuerx-jsx' {
  namespace JSX {
    interface CustomEvents extends HTMLElementEventMap {}
  }
}
