import { appWindow } from '@tauri-apps/api/window';
import { RiSystemCloseLine } from 'solid-icons/ri';
import { VsChromeMinimize, VsChromeMaximize } from 'solid-icons/vs';

export const WindowDecoration = () => {
  return (
    <div
      data-tauri-drag-region
      class="fixed left-0 right-0 top-0 z-50 flex h-8 select-none justify-end rounded-t-md bg-transparent shadow-subtleBtn"
    >
      <div
        class="inline-flex h-8 w-8 items-center justify-center hover:bg-foreground/10"
        id="titlebar-minimize"
        onClick={() => appWindow.minimize()}
      >
        <VsChromeMinimize class="h-1/2 w-1/2 " />
      </div>
      <div
        class="inline-flex h-8 w-8 items-center justify-center hover:bg-foreground/10"
        id="titlebar-maximize"
        onClick={() => appWindow.toggleMaximize()}
      >
        <VsChromeMaximize class="h-1/2 w-1/2 " />
      </div>
      <div
        class="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-destructive hover:text-white"
        id="titlebar-close"
        onClick={() => appWindow.close()}
      >
        <RiSystemCloseLine class="h-1/2 w-1/2 " />
      </div>
    </div>
  );
};
