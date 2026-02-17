
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}


import { AuthProvider } from './contexts/AuthContext';

// Global error listener to debug white screen
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const root = document.getElementById('root');
    if (root && root.innerHTML === '') {
      root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1 style="margin: 0;">Runtime Error</h1>
        <p style="word-break: break-all;">${event.message}</p>
        <pre style="white-space: pre-wrap; font-size: 12px;">${event.error?.stack || 'No stack trace available'}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Application</button>
      </div>`;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const root = document.getElementById('root');
    if (root && root.innerHTML === '') {
      root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1 style="margin: 0;">Unhandled Promise Rejection</h1>
        <p style="word-break: break-all;">${event.reason?.message || event.reason}</p>
        <pre style="white-space: pre-wrap; font-size: 12px;">${event.reason?.stack || 'No stack trace available'}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Application</button>
      </div>`;
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

