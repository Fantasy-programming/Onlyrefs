import { useColorMode } from "@kobalte/core";
import { FiSettings, FiSun, FiMoon, FiGrid } from "solid-icons/fi";
import { Toggle } from "./ui/toggle";
import { Show } from "solid-js";

export const Navigation = () => {
  return (
    <nav class="">
      <div class="flex justify-end  items-center">
        <div class="menu">
          <ul class="flex text-foreground font-sans font-semibold gap-6 text-xl">
            <li>
              <a href="/" class="">
                Home
              </a>
            </li>
            <li>
              <a href="/boards">Boards</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export const LeftNav = () => {
  const { toggleColorMode, colorMode } = useColorMode();

  return (
    <nav class="fixed w-24 h-screen bg-transparent left-0 top-0 opacity-100 z-50 flex items-center justify-end flex-col  ">
      <div class="logo absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
        <div class="text-4xl">
          <span class="text-foreground opacity-9 ">Only</span>
          <span class="text-accent opacity-9">Ref</span>
        </div>
      </div>
      <div class="text-white flex flex-col gap-6 py-12 items-center">
        <Toggle
          pressed={colorMode() === "light"}
          onChange={() => toggleColorMode()}
        >
          {(state) => (
            <Show
              when={state.pressed()}
              fallback={<FiMoon class="w-6 h-6 text-foreground" />}
            >
              <FiSun class="w-6 h-6 text-foreground" />
            </Show>
          )}
        </Toggle>
        <Toggle pressed={true}>
          {(state) => (
            <Show when={state.pressed()}>
              <FiGrid class="w-6 h-6 text-foreground" />
            </Show>
          )}
        </Toggle>
        <a href="/settings">
          <span>
            <FiSettings class="w-6 h-6 text-foreground" />
          </span>
        </a>
      </div>
    </nav>
  );
};
