import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styling
import '@fontsource-variable/nunito';
import '@fontsource/prociono';
import './index.css';

// Pages
import App from './App';
import Home from './pages/Home';
import Boards from './pages/Boards';
import Canvases from './pages/Canvases';
import CanvasEditor from './pages/CanvasEditor';
import Tags from './pages/Tags';
import Viewer from './pages/Viewer';

// Providers
import { RefProvider } from './state/refstore';
import { ViewerProvider } from './components/Viewer/ViewerContext';
import { ViewerOverlay } from './components/Viewer/ViewerOverlay';
import { DetailsPanelProvider } from './components/Layout/DetailsPanelContext';
import { SettingsDialogProvider } from './components/Settings/SettingsDialogContext';
import { SettingsDialog } from './components/Settings/SettingsDialog';

// Apply saved color scheme on startup
const applyColorScheme = () => {
  const saved = localStorage.getItem('colorScheme') as
    | 'light'
    | 'dark'
    | 'system'
    | null;
  const scheme = saved || 'system';
  const root = document.documentElement;

  if (scheme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', scheme === 'dark');
  }
};

// Prevent browser context menu globally (app uses custom context menus)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

applyColorScheme();

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RefProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ViewerProvider>
          <DetailsPanelProvider>
            <SettingsDialogProvider>
              <App>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/boards" element={<Boards />} />
                  <Route path="/boards/:id" element={<Boards />} />
                  <Route path="/canvases" element={<Canvases />} />
                  <Route path="/canvas/:id" element={<CanvasEditor />} />
                  <Route path="/viewer/:id" element={<Viewer />} />
                </Routes>
              </App>
              <SettingsDialog />
              <ViewerOverlay />
            </SettingsDialogProvider>
          </DetailsPanelProvider>
        </ViewerProvider>
      </BrowserRouter>
      <ToastContainer position="bottom-right" />
    </RefProvider>
  </React.StrictMode>,
);
