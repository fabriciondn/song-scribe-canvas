
# Plano: Implementar Layout Mobile Completo para Admin Dashboard

## Objetivo
Substituir completamente o layout mobile do painel administrativo pelo design enviado, incluindo header próprio, navegação inferior glass-effect e conteúdo 100% fiel ao HTML/CSS fornecido.

## Arquivos a Criar/Modificar

### 1. Criar `src/components/admin/MobileAdminDashboard.tsx` (NOVO)
Layout shell completo para mobile com:

**Header (sticky top)**
- Fundo: `bg-black/80 backdrop-blur-md border-b border-white/5`
- Ícone escudo verde: `size-10 bg-primary rounded-lg` com ícone shield
- Título: "Compuse" (bold) + "ADMIN CONSOLE" (verde, uppercase, tracking)
- Notificação com badge verde
- Avatar com borda verde

**Navegação Inferior (fixed bottom)**
- Classe: `glass-nav` (rgba(10,10,10,0.85) + blur 20px)
- 4 botões: Formulários, Registros, Usuários, Menu
- Ícones Material Symbols (simulados com Lucide)
- Linha indicadora na parte inferior

**Roteamento interno**
- Estado para controlar a aba ativa
- Renderização condicional do conteúdo

### 2. Atualizar `src/components/admin/MobileAdminOverview.tsx`
Remover qualquer estrutura de layout e manter apenas o conteúdo:

**Cards Horizontais**
- `min-w-[280px]`, scroll horizontal com `hide-scrollbar`
- 3 cards: Compositores, Obras, Faturado
- Ícones, badges percentuais, números grandes

**Grid Status dos Planos**
- 2x2 grid
- Indicadores coloridos com glow
- Clicáveis para abrir modais

**Seção Origem dos Usuários**
- Progress bars
- Percentuais calculados

### 3. Atualizar `src/pages/AdminDashboard.tsx`
Adicionar detecção mobile e renderizar `MobileAdminDashboard` quando em celular:

```typescript
const isMobile = useIsMobile();

if (isMobile) {
  return <MobileAdminDashboard />;
}

// ... layout desktop existente
```

## Design Exato (do HTML fornecido)

### Header
```html
<header class="sticky top-0 z-50 flex items-center justify-between px-6 py-5 bg-black/80 backdrop-blur-md border-b border-white/5">
  <div class="flex items-center gap-3">
    <div class="size-10 bg-primary rounded-lg flex items-center justify-center">
      <span class="material-symbols-outlined text-black font-bold">shield_person</span>
    </div>
    <div>
      <h1 class="text-lg font-bold leading-none">Compuse</h1>
      <p class="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Admin Console</p>
    </div>
  </div>
  <!-- Notificação + Avatar -->
</header>
```

### Navegação Inferior
```html
<nav class="fixed bottom-0 left-0 right-0 glass-nav h-20 px-4 flex items-center justify-around pb-6">
  <button class="flex flex-col items-center gap-1.5 text-primary">
    <span>description</span>
    <span class="text-[10px] font-bold">Formulários</span>
  </button>
  <!-- Registros, Usuários, Menu -->
</nav>
<div class="fixed bottom-1 left-1/2 -translate-x-1/2 w-36 h-1 bg-white/20 rounded-full z-[60]"></div>
```

### Estilos Glass-Nav
```css
.glass-nav {
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Fluxo de Navegação Mobile

| Botão | Componente Renderizado |
|-------|------------------------|
| Formulários (default) | `AdminForms` ou Overview |
| Registros | `AdminRegistrations` |
| Usuários | `AdminUsers` |
| Menu | Sheet lateral com todas opções |

## Detalhes Técnicos

### Ícones (Lucide equivalentes)
- `description` → `FileText`
- `inventory` → `Package`
- `person` → `User`
- `menu` → `Menu`
- `groups` → `Users`
- `payments` → `Wallet`
- `notifications` → `Bell`
- `shield_person` → `ShieldCheck`

### Cores Exatas
- Background: `#000000`
- Cards: `#0A0A0A`
- Primary: `#22C55E`
- Bordas: `rgba(255, 255, 255, 0.1)`

### Safe Areas
- Top: `calc(env(safe-area-inset-top, 0px) + 20px)`
- Bottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)`

## Resultado Esperado

Um painel admin mobile que funciona como app nativo com:
- Header fixo com branding
- Conteúdo scrollável
- Navegação inferior fixa com blur glass
- Linha indicadora de home
- Transições suaves entre abas
- Modais funcionais para detalhes
