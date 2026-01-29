import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Garantir atualização mais agressiva do PWA (especialmente no iOS)
// Isso reduz casos onde o app instalado fica preso em uma versão antiga.
import { registerSW } from 'virtual:pwa-register';

// IMPORTANT:
// In preview/dev, a registered Service Worker can serve mixed cached bundles (old/new vendor chunks),
// which can manifest as React hooks dispatcher being null (e.g. "Cannot read properties of null (reading 'useEffect')").
// So we only register the SW in production, and explicitly unregister in dev.
if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Aplica a atualização imediatamente (skipWaiting) sem precisar mostrar aviso
      void updateSW(true);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });
} else if ('serviceWorker' in navigator) {
  // Best-effort cleanup for dev/preview to avoid cache poisoning.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  }).catch(() => {
    // ignore
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
