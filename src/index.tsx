/* @refresh reload */
import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import "./index.css";

import App from "./App";

import Home from "./pages/Home";
import Boards from "./pages/Boards";

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/boards" component={Boards} />
      <Route path="/boards/:id" component={Boards} />
    </Router>
  ),
  document.getElementById("root") as HTMLElement,
);
