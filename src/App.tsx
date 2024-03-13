import { WindowDecoration } from './components/WindowDecoration';
import { Navigation, LeftNav } from './components/Navigation/Navigation';
import { RouteSectionProps } from '@solidjs/router';
import './App.css';

const App = (props: RouteSectionProps) => {
  return (
    <>
      <WindowDecoration />
      <div class="mt-10 h-screen w-full overflow-y-scroll">
        <LeftNav />
        <div class="mx-24 h-full pt-8 ">
          <Navigation />
          {props.children}
        </div>
      </div>
    </>
  );
};

export default App;
