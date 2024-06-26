/* @refresh reload */
import { Router, Route } from '@solidjs/router';
import { render, ErrorBoundary } from 'solid-js/web';
import { ColorModeProvider, localStorageManager } from '@kobalte/core';
import { RefProvider } from './state/refstore.tsx';
import { disableMenu } from './lib/utils.ts';

import '@fontsource-variable/nunito';
import '@fontsource/prociono';
import './index.css';

// Pages
import App from './App';
import Home from './pages/Home';
import Boards from './pages/Boards';
import Settings from './pages/Settings';
import { SettingsProvider } from './state/settingsStore.tsx';

disableMenu();

render(
  () => (
    <ErrorBoundary fallback={(err) => err}>
      <SettingsProvider>
        <RefProvider>
          <ColorModeProvider storageManager={localStorageManager}>
            <Router root={App}>
              <Route path="/" component={Home} />
              <Route path="/boards" component={Boards} />
              <Route path="/boards/:id" component={Boards} />
              <Route path="/settings" component={Settings} />
            </Router>
          </ColorModeProvider>
        </RefProvider>
      </SettingsProvider>
    </ErrorBoundary>
  ),
  document.getElementById('root') as HTMLElement,
);
