import { WindowDecoration } from './components/WindowDecoration';
import { LeftNav } from './components/Navigation/Navigation';
import { RouteSectionProps } from '@solidjs/router';
import './App.css';

const App = (props: RouteSectionProps) => {
  return (
    <>
      <WindowDecoration />
      <LeftNav />
      <div class="mb-2 mt-4 h-screen w-full overflow-y-scroll">
        <div class="mx-24 h-full py-8 pr-8 ">{props.children}</div>
      </div>
    </>
  );
};

export default App;
