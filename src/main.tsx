import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Garantir atualização mais agressiva do PWA (especialmente no iOS)
// Isso reduz casos onde o app instalado fica preso em uma versão antiga.
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Aplica a atualização imediatamente (skipWaiting) sem precisar mostrar aviso
    updateSW(true);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
