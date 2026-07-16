import './polyfill.ts';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker automatically
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    }
  });
}

let hasOpener = false;
try {
  hasOpener = window.opener != null;
} catch (e) {
  hasOpener = false;
}
let hasHashMatch = false;
let hashVal = '';
try {
  if (window.location.hash.includes('access_token=') && hasOpener) {
    hasHashMatch = true;
    hashVal = window.location.hash.substring(1);
  }
} catch (e) {
  hasHashMatch = false;
}
if (hasHashMatch) {
  const params = new URLSearchParams(hashVal);
  const token = params.get('access_token');
  if (token) {
    try {
      window.opener.postMessage({ type: 'ONEDRIVE_TOKEN', token }, '*');
    } catch(e) {}
    try {
      window.close();
    } catch(e) {}
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
