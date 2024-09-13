/* @refresh reload */
import { Router, Route } from '@solidjs/router';
import { render, ErrorBoundary } from 'solid-js/web';
import { cleanState } from './lib/utils.ts';

// Styling
import '@fontsource-variable/nunito';
import '@fontsource/prociono';
import './index.css';

// Providers
import { ColorModeProvider, localStorageManager } from '@kobalte/core';

// Pages
import App from './App';
import Home from './pages/Home';
import Boards from './pages/Boards';
import Settings from './pages/Settings';

cleanState();

render(
  () => (
    <ErrorBoundary fallback={(err) => <div>{err}</div>}>
      <ColorModeProvider storageManager={localStorageManager}>
        <Router root={App}>
          <Route path="/" component={Home} />
          <Route path="/boards" component={Boards} />
          <Route path="/boards/:id" component={Boards} />
          <Route path="/settings" component={Settings} />
        </Router>
      </ColorModeProvider>
    </ErrorBoundary>
  ),
  document.getElementById('root') as HTMLElement,
);
