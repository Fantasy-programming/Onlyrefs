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
      class={` fixed left-0 top-0 z-[99999] flex h-7 w-full select-none justify-end p-2 ${props.class} `}
      {...rest}
    >
      <div>
        <div
          class="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10"
          id="titlebar-minimize"
          onClick={() => appWindow.minimize()}
        >
          <VsChromeMinimize class="h-1/2 w-1/2" />
        </div>
        <div
          class="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10"
          id="titlebar-maximize"
          onClick={() => appWindow.toggleMaximize()}
        >
          <VsChromeMaximize class="h-1/2 w-1/2" />
        </div>
        <div
          class="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-destructive hover:text-white"
          id="titlebar-close"
          onClick={() => appWindow.close()}
        >
          <RiSystemCloseLine class="h-1/2 w-1/2" />
        </div>
      </div>
    </div>
  );
};
