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
import Settings from './pages/Settings';


const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/boards/:id" element={<Boards />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </App>
    </BrowserRouter>
    <ToastContainer position="bottom-right" />
  </React.StrictMode>,
);
