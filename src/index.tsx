import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { cleanState } from './lib/utils.ts';
import { App } from './App';

// Global Styling
import '@fontsource-variable/nunito';
import '@fontsource/prociono';
import './index.css';

// Context menu fixes
cleanState();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
