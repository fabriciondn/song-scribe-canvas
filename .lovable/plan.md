
# Correção do Menu Lateral Mobile (Safe Area)

## Problema
O menu lateral no iOS está com a parte superior "estourando" para cima, ficando atrás da barra de status do sistema (horário, bateria, etc.). Isso acontece porque o componente não está respeitando a **safe-area-inset-top** do iOS.

## Causa Técnica
O `MobileSidebar` usa apenas `p-6` (24px fixo) como padding, sem considerar a área segura do iOS para dispositivos com notch ou Dynamic Island.

## Solução
Adicionar um padding-top dinâmico que soma a safe-area do iOS ao espaçamento desejado.

## Alteração

**Arquivo:** `src/components/layout/MobileSidebar.tsx`

**Antes (linha 159):**
```tsx
<div className="p-6 flex-shrink-0">
```

**Depois:**
```tsx
<div 
  className="px-6 pb-6 flex-shrink-0"
  style={{ paddingTop: 'max(24px, calc(env(safe-area-inset-top, 0px) + 16px))' }}
>
```

## Impacto
- Nenhuma outra funcionalidade será alterada
- O menu funcionará corretamente em dispositivos com e sem notch
- O design permanece idêntico, apenas com o espaçamento correto no topo

## Após a Implementação
Será necessário publicar novamente (Publish -> Update) e reinstalar o PWA no iPhone para ver a mudança.
