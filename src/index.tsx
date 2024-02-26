/* @refresh reload */
import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";

import "@fontsource-variable/nunito";
import "@fontsource-variable/hahmlet";
import "./index.css";

import App from "./App";
import Home from "./pages/Home";
import Boards from "./pages/Boards";
import Settings from "./pages/Settings";

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/boards" component={Boards} />
      <Route path="/boards/:id" component={Boards} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  document.getElementById("root") as HTMLElement,
);
