import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/theme.css'; // keep theme import here so it’s always applied

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found. Check index.html');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
