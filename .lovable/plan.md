
# Correção do Layout do Header Mobile

## Problema Identificado
O header sticky do `MobileDashboardHome` está sobrepondo o conteúdo porque:
1. O header usa `sticky top-0` com padding-top dinâmico para safe-area
2. O conteúdo `<main>` não tem margin-top correspondente para compensar a altura do header
3. O conteúdo rola "por baixo" do header ao invés de começar abaixo dele

## Solução

Remover o `sticky` do header e deixá-lo como elemento estático no fluxo normal do documento. Isso garante que o conteúdo sempre comece abaixo do header sem sobreposição.

### Arquivo a Modificar

**`src/components/mobile/MobileDashboardHome.tsx`**

Linha 55 - Remover o sticky do header:

```typescript
// ANTES
className="pb-6 px-6 flex items-center justify-between sticky top-0 z-10 bg-background/[0.97]"

// DEPOIS  
className="pb-6 px-6 flex items-center justify-between"
```

### Por que esta solução?

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Remover sticky (escolhida)** | Simples, sem sobreposição, comportamento nativo de scroll | Header desaparece ao rolar |
| Manter sticky + adicionar padding-top no main | Header sempre visível | Cálculo complexo da altura dinâmica |
| Converter para fixed | Header sempre visível | Requer refatoração do layout inteiro |

A abordagem mais simples e estável é remover o `sticky` - isso é comum em muitos apps mobile onde o header não precisa ficar fixo.

---

## Mudança Técnica

```text
Arquivo: src/components/mobile/MobileDashboardHome.tsx
Linha: 55

Remover: sticky top-0 z-10 bg-background/[0.97]
```

O header permanecerá no topo do conteúdo, mas rolará junto com a página, evitando qualquer sobreposição de elementos.
