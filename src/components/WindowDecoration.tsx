import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';

import { appWindow } from '@tauri-apps/api/window';
import { RiSystemCloseLine } from 'solid-icons/ri';
import { VsChromeMinimize, VsChromeMaximize } from 'solid-icons/vs';

export interface WindowProps extends ComponentProps<'div'> {}

export const WindowDecoration: Component<WindowProps> = (props) => {
  const [, rest] = splitProps(props, []);

  return (
    <div
      data-tauri-drag-region
      class={`relative left-0 right-0 top-0 z-50 flex h-6 select-none justify-end rounded-t-md bg-transparent p-2 pt-2 ${props.class} `}
      {...rest}
    >
      <div
        class="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-foreground/10"
        id="titlebar-minimize"
        onClick={() => appWindow.minimize()}
      >
        <VsChromeMinimize class="h-1/2 w-1/2 " />
      </div>
      <div
        class="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-foreground/10"
        id="titlebar-maximize"
        onClick={() => appWindow.toggleMaximize()}
      >
        <VsChromeMaximize class="h-1/2 w-1/2 " />
      </div>
      <div
        class="inline-flex h-6 w-6 items-center justify-center rounded-full text-foreground hover:bg-destructive hover:text-white"
        id="titlebar-close"
        onClick={() => appWindow.close()}
      >
        <RiSystemCloseLine class="h-1/2 w-1/2 " />
      </div>
    </div>
  );
};
