import { Show, createSignal } from 'solid-js';
import { emit } from '@tauri-apps/api/event';
// import { createShortcut } from '@solid-primitives/keyboard';
import { useEventListeners } from '@/hooks/useTauriListeners';

import { WindowDecoration } from '@/components/WindowDecoration';
import { SideNavigation } from '@/components/Navigation/Navigation';
import { Toaster } from 'solid-toast';

import { Outlet } from 'react-router-dom';

export const AppLayout = () => {
  // const [sideNavOpen, setSideNavOpen] = createSignal(true);

  useEventListeners();

  // createShortcut(['Control', '['], () => {
  //   setSideNavOpen(!sideNavOpen());
  //   emit('sidebar_toggled');
  // });

  return (
    <div className="h-screen">
      <WindowDecoration />
      <SideNavigation />
      <section
      // className={`h-full pe-4 ps-4 pt-10 font-sans ${sideNavOpen() ? 'md:ps-20' : ''}`}
      >
        <div className="border-3 onlyrefNoise h-full overflow-x-hidden overflow-y-scroll rounded-t-[20px] border-gray-900/50 shadow-cardShadowLight dark:border-gray-100/50 dark:shadow-cardShadow">
          <Outlet />
        </div>
      </section>
      <Toaster position="bottom-right" gutter={8} />
    </div>
  );
};
