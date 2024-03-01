import { appWindow } from "@tauri-apps/api/window";
import { RiSystemCloseLine } from "solid-icons/ri";
import { VsChromeMinimize, VsChromeMaximize } from "solid-icons/vs";

const WindowDecoration = () => {
  return (
    <div
      data-tauri-drag-region
      class=" h-8 rounded-t-md bg-transparent shadow-subtleBtn flex justify-end top-0 left-0 right-0 fixed select-none"
    >
      <div
        class="inline-flex justify-center items-center h-8 w-8 hover:bg-foreground/10"
        id="titlebar-minimize"
        onClick={() => appWindow.minimize()}
      >
        <VsChromeMinimize class="w-1/2 h-1/2 " />
      </div>
      <div
        class="inline-flex justify-center items-center h-8 w-8 hover:bg-foreground/10"
        id="titlebar-maximize"
        onClick={() => appWindow.toggleMaximize()}
      >
        <VsChromeMaximize class="w-1/2 h-1/2 " />
      </div>
      <div
        class="inline-flex justify-center items-center text-foreground hover:text-white hover:bg-destructive h-8 w-8"
        id="titlebar-close"
        onClick={() => appWindow.close()}
      >
        <RiSystemCloseLine class="w-1/2 h-1/2 " />
      </div>
    </div>
  );
};

export default WindowDecoration;
