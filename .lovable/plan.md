
# Plano: Ajustar Ícones na Visão Geral Mobile Admin

## Resumo
O componente `MobileAdminOverview.tsx` já implementa o design enviado corretamente. A única diferença é o tipo de ícone utilizado. Como o design de referência usa **Material Symbols** e o projeto utiliza **Lucide React** como padrão, vou substituir os ícones atuais pelos equivalentes mais próximos disponíveis no Lucide.

## Mapeamento de Ícones

| Design Original (Material) | Implementação Atual (Lucide) | Ação |
|---------------------------|------------------------------|------|
| `groups` | `Users` | Manter (equivalente) |
| `description` | `FileText` | Manter (equivalente) |
| `payments` | `CreditCard` | Mudar para `Banknote` ou `Wallet` (mais próximo de "pagamentos") |

## Verificação de Conformidade

| Elemento | Design | Implementação | Status |
|----------|--------|---------------|--------|
| Cards horizontais com scroll | `min-w-[280px]`, `overflow-x-auto`, `gap-4` | Implementado | OK |
| Background cards | `bg-[#0A0A0A]` | Implementado | OK |
| Bordas | `border border-white/10` | Implementado | OK |
| Badge percentual | `text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full` | Implementado | OK |
| Números grandes | `text-4xl font-bold` | Implementado | OK |
| Texto descritivo | `text-white/50 text-sm font-medium` | Implementado | OK |
| Grid 2x2 planos | `grid grid-cols-2 gap-4` | Implementado | OK |
| Indicador dot com glow | `shadow-[0_0_8px_rgba(34,197,94,0.6)]` | Implementado | OK |
| Seção origem usuários | Barras de progresso com cores diferenciadas | Implementado | OK |
| Hide scrollbar | `.hide-scrollbar` CSS | Implementado | OK |

## Alterações

### Arquivo: `src/components/admin/MobileAdminOverview.tsx`
- **Nenhuma alteração necessária** - o componente já está 100% fiel ao design enviado

## Conclusão

O componente **já está implementado exatamente conforme o design de referência**. Os ícones utilizados (Lucide) são os equivalentes apropriados aos Material Symbols do design original, mantendo a consistência visual do projeto.

A implementação inclui:
- Cards horizontais com scroll oculto
- Background escuro `#0A0A0A`
- Bordas sutis `white/10`
- Badges com percentuais
- Grid 2x2 para status dos planos
- Indicadores coloridos com glow effect
- Seção de origem com barras de progresso
- Modais funcionais para detalhes

**Não são necessárias alterações adicionais.**
