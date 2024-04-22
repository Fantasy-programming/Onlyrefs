import { Show, createSignal } from 'solid-js';
import { useColorMode } from '@kobalte/core';
import { gridSizeHook } from '../../state/hook';

import { FiSettings, FiSun, FiMoon, FiGrid } from 'solid-icons/fi';
import { BsGrid3x3Gap } from 'solid-icons/bs';
import { TbGridDots } from 'solid-icons/tb';
import { Toggle } from '../ui/toggle';

import Logo from '~/assets/logo-simple.svg';

export const SideNavigation = () => {
  const { toggleColorMode, colorMode } = useColorMode();
  const [gridPressed, setGridPressed] = createSignal(false);

  return (
    <nav class="fixed left-0 top-0 z-50 hidden h-screen w-10 flex-col items-center justify-end md:flex md:w-20">
      <div class="absolute left-1/2 top-[5%] -translate-x-1/2 -translate-y-1/2">
        <Logo class="h-9 w-9" />
      </div>
      <div class="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rotate-90">
        <div class="flex items-center gap-4 text-3xl">
          <span>
            <span class="opacity-9 text-foreground">Only</span>
            <span class="opacity-9 text-accent/80">Ref</span>
          </span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-6 py-12 text-white">
        <Toggle
          pressed={colorMode() === 'light'}
          onChange={() => toggleColorMode()}
          class={
            gridPressed() === true ? 'pointer-events-none opacity-0' : 'block'
          }
        >
          {(state) => (
            <Show
              when={state.pressed()}
              fallback={<FiMoon class="h-5 w-5 text-foreground" />}
            >
              <FiSun class="h-5 w-5 text-foreground" />
            </Show>
          )}
        </Toggle>
        <Toggle
          pressed={gridPressed()}
          onChange={() => setGridPressed(!gridPressed())}
        >
          {(state) => (
            <Show
              when={state.pressed()}
              fallback={<FiGrid class="h-5 w-5 text-foreground" />}
            >
              <SizePicker />
            </Show>
          )}
        </Toggle>
        <a
          href="/settings"
          class={
            gridPressed() === true ? 'pointer-events-none opacity-0' : 'block'
          }
        >
          <span>
            <FiSettings class="h-5 w-5 text-foreground" />
          </span>
        </a>
      </div>
    </nav>
  );
};

const SizePicker = () => {
  const [gridSize, updateGridSize] = gridSizeHook;

  return (
    <div class="flex flex-col space-y-6 rounded-full bg-foreground  p-3 transition-all ease-in">
      <div
        class={gridSize() === 4 ? '' : 'opacity-50'}
        onclick={() => updateGridSize(4)}
      >
        <FiGrid class="h-5 w-5 text-background" />
      </div>
      <div
        class={gridSize() === 5 ? '' : 'opacity-50'}
        onClick={() => updateGridSize(5)}
      >
        <BsGrid3x3Gap class="h-5 w-5 text-background" />
      </div>
      <div
        class={gridSize() === 6 ? '' : 'opacity-50'}
        onclick={() => updateGridSize(6)}
      >
        <TbGridDots class="h-5 w-5 text-background" />
      </div>
    </div>
  );
};
