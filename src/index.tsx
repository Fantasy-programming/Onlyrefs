/* @refresh reload */
import { Router, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import { ColorModeProvider, localStorageManager } from '@kobalte/core';
import { RefProvider, RefService } from './state/store';

import '@fontsource-variable/nunito';
import '@fontsource/prociono';
import './index.css';

// Pages
import App from './App';
import Home from './pages/Home';
import Boards from './pages/Boards';
import Settings from './pages/Settings';

// Initialize all services
const refService = RefService(); /* once */

render(
  () => (
    <RefProvider refService={refService}>
      <ColorModeProvider storageManager={localStorageManager}>
        <Router root={App}>
          <Route path="/" component={Home} />
          <Route path="/boards" component={Boards} />
          <Route path="/boards/:id" component={Boards} />
          <Route path="/settings" component={Settings} />
        </Router>
      </ColorModeProvider>
    </RefProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
