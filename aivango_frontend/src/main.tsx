import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './theme-overrides.css';
import './tailwind-patch.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SponsorDemoProvider } from './sponsor/SponsorDemoContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SponsorDemoProvider>
          <App />
        </SponsorDemoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
