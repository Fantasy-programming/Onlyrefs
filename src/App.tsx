import { WindowDecoration } from './components/WindowDecoration';
import { SideNavigation } from './components/Navigation/Navigation';
import { RouteSectionProps } from '@solidjs/router';
import { Toaster } from 'solid-toast';

import './App.css';

import { setupListeners } from './lib/utils';
import { useRefSelector } from './state/refstore';
import { Show, createSignal, onCleanup } from 'solid-js';
import { createShortcut } from '@solid-primitives/keyboard';
import { emit } from '@tauri-apps/api/event';

const App = (props: RouteSectionProps) => {
  const root = useRefSelector();
  const unlisteners = setupListeners(root);

  const [sideNavOpen, setSideNavOpen] = createSignal(true);

  createShortcut(['Control', '['], () => {
    setSideNavOpen(!sideNavOpen());
    emit('sidebar_toggled');
  });

  onCleanup(async () => {
    const unlistener = await unlisteners;
    unlistener.forEach((unlistener) => unlistener());
  });

  return (
    <>
      <div class="h-screen">
        <WindowDecoration />
        <Show when={sideNavOpen()}>
          <SideNavigation />
        </Show>
        <section
          classList={{
            'h-full pe-4 ps-4 pt-10 font-sans ': true,
            'md:ps-20': sideNavOpen(),
          }}
        >
          <div class="border-3 onlyrefNoise h-full overflow-x-hidden overflow-y-scroll rounded-t-[20px] border-gray-900/50 shadow-cardShadowLight dark:border-gray-100/50 dark:shadow-cardShadow">
            {props.children}
          </div>
        </section>
        <Toaster position="bottom-right" gutter={8} />
      </div>
    </>
  );
};

export default App;
