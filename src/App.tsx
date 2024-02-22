import { Navigation, LeftNav } from "./components/Navigation";
import { Component, JSXElement } from "solid-js";
import "./App.css";

type MyComponentProps = {
  children: JSXElement | JSXElement[];
};

const App: Component<MyComponentProps> = (props) => {
  return (
    <div class="h-screen w-full">
      <LeftNav />
      <div class="mx-24 pt-8 h-full">
        <Navigation />
        {props.children}
      </div>
    </div>
  );
};

export default App;
