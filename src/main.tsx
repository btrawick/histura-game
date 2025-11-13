import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/base.css';

/* INIT THEME EARLY (no store): set html[data-theme] before first paint */
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme');
    const mode =
      saved === 'light' || saved === 'dark'
        ? saved
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', mode);
  } catch {
    // default to dark if anything goes wrong
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
