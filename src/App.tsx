import { PropsWithChildren, useEffect, useState } from 'react';
import { WindowDecoration } from './components/WindowDecoration';
import { SideNavigation } from './components/Navigation/Navigation';
import { emit } from '@tauri-apps/api/event';

const App = (props: PropsWithChildren) => {
  // const unlisteners = setupListeners(root);

  const [sideNavOpen, setSideNavOpen] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '[') {
        setSideNavOpen((s) => !s);
        emit('sidebar_toggled');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // onCleanup(async () => {
  //   const unlistener = await unlisteners;
  //   unlistener.forEach((unlistener) => unlistener());
  // });

  return (
    <div className="h-screen">
      <WindowDecoration />
      {sideNavOpen && <SideNavigation />}
      <section className={`h-full pe-4 ps-4 pt-10 font-sans ${sideNavOpen ? 'md:ps-20' : ''}`}>
        <div className="border-3 onlyrefNoise h-full overflow-x-hidden overflow-y-scroll rounded-t-[20px] border-gray-900/50 shadow-cardShadowLight dark:border-gray-100/50 dark:shadow-cardShadow">
          {props.children}
        </div>
      </section>
    </div>
  );
};

export default App;
