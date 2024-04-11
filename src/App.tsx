import { WindowDecoration } from './components/WindowDecoration';
import { SideNavigation } from './components/Navigation/Navigation';
import { RouteSectionProps } from '@solidjs/router';
import { Toaster } from 'solid-toast';
import './App.css';

const App = (props: RouteSectionProps) => {
  return (
    <>
      <WindowDecoration />
      <SideNavigation />
      <div class="mb-4 h-screen w-full overflow-y-scroll font-sans">
        <div class="mx-10 h-full py-8 pr-8 md:mx-20">{props.children}</div>
      </div>
      <Toaster position="top-right" gutter={8} />
    </>
  );
};

export default App;
