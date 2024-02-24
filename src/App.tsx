import { Navigation, LeftNav } from "./components/Navigation";
import { RouteSectionProps } from "@solidjs/router";
import "./App.css";

const App = (props: RouteSectionProps) => {
  return (
    <div class="h-screen w-full overflow-y-scroll">
      <LeftNav />
      <div class="mx-24 pt-8 h-full ">
        <Navigation />
        {props.children}
      </div>
    </div>
  );
};

export default App;
