import { FiSettings, FiSun, FiMoon, FiGrid } from "solid-icons/fi";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Toggle } from "./ui/toggle";
import { Show } from "solid-js";

export const Navigation = () => {
  return (
    <nav class="">
      <div class="flex justify-between items-center">
        <div class="text-4xl">
          <span class="text-slate-100">Only</span>
          <span class="text-slate-600">Ref</span>
        </div>
        <div class="menu">
          <ul class="flex text-slate-300 gap-6 text-xl">
            <li>
              <a href="/">Home</a>
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
  return (
    <nav class="fixed w-24 h-screen left-0 top-0 opacity-100 z-50 flex items-center justify-end flex-col pointer-events-none bg-primary">
      <div class="text-white flex flex-col gap-5 py-12 items-center">
        <Avatar>
          <AvatarImage src="https://github.com/sek-consulting.png" />
          <AvatarFallback>EK</AvatarFallback>
        </Avatar>
        <Toggle>
          {(state) => (
            <Show when={state.pressed()} fallback={<FiMoon class="w-6 h-6" />}>
              <FiSun class="w-6 h-6" />
            </Show>
          )}
        </Toggle>
        <span>
          <FiGrid class="w-6 h-6" />
        </span>
        <span>
          <FiSettings class="w-6 h-6" />
        </span>
      </div>
    </nav>
  );
};
