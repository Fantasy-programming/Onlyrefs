import { WindowDecoration } from './components/WindowDecoration';
import { SideNavigation } from './components/Navigation/Navigation';
import { RouteSectionProps } from '@solidjs/router';
import { Toaster } from 'solid-toast';

import './App.css';

import { setupListeners } from './lib/utils';
import { useRefSelector } from './state/refstore';

const App = (props: RouteSectionProps) => {
  const root = useRefSelector();
  setupListeners(root);

  return (
    <>
      <div class="h-screen">
        <WindowDecoration />
        <SideNavigation />
        <section class="h-full pe-4 ps-4 pt-10 font-sans md:ps-20">
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
