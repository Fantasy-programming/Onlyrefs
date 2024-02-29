import WindowDecoration from "./components/WindowDecoration";
import { Navigation, LeftNav } from "./components/Navigation/Navigation";
import { RouteSectionProps } from "@solidjs/router";
import "./App.css";

const App = (props: RouteSectionProps) => {
  return (
    <>
      <WindowDecoration />
      <div class="h-screen mt-10 w-full overflow-y-scroll">
        <LeftNav />
        <div class="mx-24 pt-8 h-full ">
          <Navigation />
          {props.children}
        </div>
      </div>
    </>
  );
};

export default App;
