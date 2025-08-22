import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// chrome typings may not be available in some environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any;

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Establish a port to the background service worker
const port = chrome.runtime.connect({ name: 'popup' });
port.postMessage({ type: 'popupInit' });

port.onMessage.addListener((msg: any) => {
  // eslint-disable-next-line no-console
  console.log('Background message:', msg);
});

