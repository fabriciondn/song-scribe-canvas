
# Plano de Otimização de Performance do PWA Mobile

## Problema Principal
O aplicativo está travando em dispositivos móveis (especialmente Android), com dificuldades no scroll e responsividade geral. Isso afeta toda a experiência desde a landing page até o app.

## Causas Identificadas

### 1. Efeitos de Blur Pesados (GPU-intensivo)
Encontrados em múltiplos componentes mobile com `blur-3xl`, `blur-[100px]`, e `blur-[60px]`:

| Arquivo | Problema |
|---------|----------|
| `MobileDashboardHome.tsx` | `blur-3xl` nos elementos decorativos (linha 92-93) |
| `MobileComposerEditor.tsx` | `blur-[100px]` no background (linha 832-833) |
| `MobileComposerPanel.tsx` | `blur-[100px]` no background (linha 238-239) |
| `MobileSplashScreen.tsx` | `blur-[60px]` e `blur-[50px]` (linha 44-46) |

### 2. Backdrop-blur em Headers (afeta scroll)
Headers com `backdrop-blur-md` forçam recálculo de GPU a cada frame de scroll:

| Arquivo | Problema |
|---------|----------|
| `MobileDashboardHome.tsx` | Header sticky com `backdrop-blur-md` (linha 55) |
| `MobileFoldersPage.tsx` | Header sticky com `backdrop-blur-md` (linha 205, 235) |
| `MobileDraftsPage.tsx` | Header sticky com `backdrop-blur-sm` (linha 211, 248) |
| `MobileComposerEditor.tsx` | Header com `backdrop-blur-md` (linha 380) |
| `MobileComposerPanel.tsx` | Header com `backdrop-blur-md` (linha 243) |

### 3. Animações Contínuas
Animações `animate-pulse` que rodam continuamente consomem CPU:

| Arquivo | Problema |
|---------|----------|
| `MobileNotificationCenter.tsx` | Badge de notificação com `animate-pulse` (linha 62) |
| `MobileNewDraftSetup.tsx` | Ícone de base com `animate-pulse` (linha 323) |
| `MobileComposerEditor.tsx` | Botão de gravação com `animate-pulse` (linha 449) |

### 4. Overflow e Touch Events
Problemas com scroll em alguns componentes:
- `MobileLayout.tsx` linha 34: `overflow-hidden` no container principal pode bloquear scroll
- Falta de `touch-action: manipulation` em áreas interativas

### 5. Efeitos Decorativos com Posição Fixed
- `MobileComposerEditor.tsx` e `MobileComposerPanel.tsx` têm elementos `fixed` com blur que são renderizados constantemente

---

## Solução Proposta

### Etapa 1: Remover/Reduzir Blur em Elementos Decorativos
**Impacto: ALTO** | **Arquivos: 4**

```text
MobileDashboardHome.tsx:
- blur-3xl → blur-xl (redução de 48px para 24px)

MobileComposerEditor.tsx + MobileComposerPanel.tsx:
- Remover elementos decorativos com blur-[100px]
- Usar gradiente CSS puro (sem blur) ou remover completamente

MobileSplashScreen.tsx:
- blur-[60px] → blur-[40px]
- blur-[50px] → blur-[30px]
```

### Etapa 2: Substituir backdrop-blur por Cores Sólidas
**Impacto: ALTO** | **Arquivos: 5**

O `backdrop-blur` força a GPU a recalcular a cada frame de scroll. Substituir por backgrounds semi-transparentes sem blur:

```text
Antes:  bg-background/80 backdrop-blur-md
Depois: bg-background/95 (sem backdrop-blur)

OU (se precisar manter visual):
bg-background (cor sólida)
```

Arquivos afetados:
- `MobileDashboardHome.tsx` (header)
- `MobileFoldersPage.tsx` (header)
- `MobileDraftsPage.tsx` (header)
- `MobileComposerEditor.tsx` (header)
- `MobileComposerPanel.tsx` (header)

### Etapa 3: Otimizar Animações
**Impacto: MÉDIO** | **Arquivos: 3**

Substituir `animate-pulse` por indicadores estáticos ou usar apenas quando necessário:

```text
MobileNotificationCenter.tsx:
- Remover animate-pulse do badge (usar cor sólida)

MobileNewDraftSetup.tsx:
- animate-pulse → animação apenas quando tocando

MobileComposerEditor.tsx:
- animate-pulse no botão de gravação: OK (só aparece quando gravando)
```

### Etapa 4: Corrigir Container de Scroll
**Impacto: MÉDIO** | **Arquivo: 1**

```text
MobileLayout.tsx linha 34:
Antes:  overflow-hidden
Depois: overflow-x-hidden (permite scroll vertical)

Adicionar: touch-action: manipulation no container principal
```

### Etapa 5: Remover Elementos Decorativos Fixed com Blur
**Impacto: ALTO** | **Arquivos: 2**

Remover ou simplificar os backgrounds decorativos que usam `fixed` + `blur`:

```text
MobileComposerEditor.tsx (linha 830-834):
- Remover div com blur-[100px] ou substituir por gradiente CSS simples

MobileComposerPanel.tsx (linha 236-239):
- Mesmo tratamento
```

---

## Ordem de Implementação

| Prioridade | Etapa | Impacto na Performance |
|------------|-------|------------------------|
| 🔴 1 | Substituir backdrop-blur por cores sólidas | +40% melhoria no scroll |
| 🔴 2 | Remover elementos fixed com blur pesado | +30% melhoria geral |
| 🟡 3 | Reduzir blur em elementos decorativos | +15% melhoria geral |
| 🟢 4 | Corrigir overflow no MobileLayout | Corrige travamento de scroll |
| 🟢 5 | Otimizar animate-pulse | +5% melhoria CPU |

---

## Arquivos a Modificar

1. **`src/components/mobile/MobileDashboardHome.tsx`**
   - Reduzir blur-3xl → blur-xl
   - Remover backdrop-blur-md do header

2. **`src/components/mobile/MobileComposerEditor.tsx`**
   - Remover background decorativo com blur-[100px]
   - Remover backdrop-blur-md do header

3. **`src/components/mobile/MobileComposerPanel.tsx`**
   - Remover background decorativo com blur-[100px]
   - Remover backdrop-blur-md do header

4. **`src/components/mobile/MobileFoldersPage.tsx`**
   - Remover backdrop-blur-md do header

5. **`src/components/mobile/MobileDraftsPage.tsx`**
   - Remover backdrop-blur-sm do header

6. **`src/components/mobile/MobileSplashScreen.tsx`**
   - Reduzir intensidade do blur nos elementos decorativos

7. **`src/components/mobile/MobileNotificationCenter.tsx`**
   - Remover animate-pulse do badge de notificação

8. **`src/components/layout/MobileLayout.tsx`**
   - Corrigir overflow-hidden para permitir scroll vertical

---

## Resultado Esperado

- Scroll suave em dispositivos Android
- Menos travamentos durante interações
- Redução do consumo de GPU e CPU
- Mantém aparência visual similar (apenas efeitos pesados removidos)
- Compatibilidade melhorada com PWA no Android

---

## Detalhes Técnicos das Mudanças

### Header sem backdrop-blur (exemplo)
```typescript
// Antes
className="bg-background/80 backdrop-blur-md"

// Depois
className="bg-background/[0.97]"
```

### Remoção de blur decorativo (exemplo)
```typescript
// Antes
<div className="absolute ... blur-[100px]" />

// Depois (remover completamente ou usar gradiente leve)
<div className="absolute ... bg-gradient-to-br from-primary/5 to-transparent" />
```

### Correção do MobileLayout
```typescript
// Antes
<div className="... overflow-hidden touch-manipulation">

// Depois
<div className="... overflow-x-hidden touch-manipulation overscroll-contain">
```
