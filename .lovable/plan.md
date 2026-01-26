
# Plano de Correção do PWA Mobile

## Problema Principal
O PWA está incompleto - faltam componentes essenciais para funcionar como um aplicativo instalável no celular.

## O que será feito

### 1. Criar o Web App Manifest
**Arquivo novo:** `public/manifest.json`

Este arquivo informa ao navegador como exibir o app quando instalado:
- Nome do aplicativo: "Compuse"
- Cores do tema (preto e verde)
- Ícones em múltiplos tamanhos
- Orientação e modo de exibição (tela cheia)

### 2. Configurar o Plugin PWA no Vite
**Arquivo:** `vite.config.ts` e `package.json`

- Instalar `vite-plugin-pwa`
- Configurar geração automática de Service Worker
- Habilitar cache offline de recursos estáticos
- Configurar estratégia de atualização

### 3. Adicionar Link do Manifest no HTML
**Arquivo:** `index.html`

- Adicionar `<link rel="manifest" href="/manifest.json">`
- Corrigir referências de ícones para usar os da pasta `/icons/`

### 4. Otimizar Splash Screen Mobile
**Arquivo:** `src/components/mobile/MobileSplashScreen.tsx`

- Reduzir blur de 120px → 60px
- Remover animação pulse do fundo
- Simplificar efeitos visuais para melhor performance

### 5. Atualizar Ícones no HTML
**Arquivo:** `index.html`

- Usar ícones com tamanhos específicos da pasta `/public/icons/`
- Adicionar ícones para diferentes dispositivos Apple

---

## Arquivos que serão modificados

| Arquivo | Ação |
|---------|------|
| `public/manifest.json` | Criar (novo) |
| `vite.config.ts` | Adicionar plugin PWA |
| `package.json` | Adicionar dependência |
| `index.html` | Adicionar link manifest e corrigir ícones |
| `src/components/mobile/MobileSplashScreen.tsx` | Otimizar performance |

---

## Resultado Esperado

Após as correções:
- O app poderá ser instalado na tela inicial do celular
- Funcionará offline (com cache de recursos)
- Terá ícone e splash screen adequados
- Performance melhorada no iPhone

---

## Detalhes Técnicos

### Novo arquivo: manifest.json
```json
{
  "name": "Compuse - Registro Autoral",
  "short_name": "Compuse",
  "description": "Registro autoral com validade jurídica",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Configuração vite-plugin-pwa
```typescript
import { VitePWA } from 'vite-plugin-pwa'

// No array de plugins:
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts-cache' }
      }
    ]
  }
})
```

### Otimização do Splash Screen
```typescript
// Reduzir blur de 120px para 60px
// Remover animação pulse-subtle do fundo
// Usar transform ao invés de filter para animações
```
