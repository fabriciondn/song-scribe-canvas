
# Plano de Otimização de Performance da Landing Page para Mobile

## Problema
A landing page está lenta e "travando" em dispositivos móveis (especialmente iPhone), causando uma experiência ruim para os usuários.

## Causas Identificadas
1. **ComposersCarousel carrega todos os usuários do banco de dados** sem limite
2. **Efeitos visuais pesados** (blur, gradientes, animações contínuas)
3. **YouTube iframe carrega imediatamente** consumindo recursos
4. **Detecção de mobile pode falhar** em alguns dispositivos
5. **Todas as seções renderizam de uma vez** sem lazy loading

---

## Solução Proposta

### Etapa 1: Otimizar o ComposersCarousel
**Arquivo:** `src/components/landing/ComposersCarousel.tsx`

- Limitar a query do Supabase para buscar apenas os **50 últimos compositores** em vez de todos
- Reduzir a duplicação de 3x para 2x no mobile
- Desativar o carrossel em mobile muito lento e mostrar versão estática

```text
Antes: .select('id, name, artistic_name, avatar_url').not('name', 'is', null)
Depois: .select('id, name, artistic_name, avatar_url').not('name', 'is', null).limit(50)
```

### Etapa 2: Melhorar Detecção de Mobile no ShaderBackground
**Arquivo:** `src/components/landing/ShaderBackground.tsx`

- Melhorar a detecção para incluir mais dispositivos móveis
- Remover a animação CSS do fallback mobile (tornar estático)
- Usar `matchMedia` para detecção mais confiável

```text
Antes: window.innerWidth < 1024
Depois: window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches
```

### Etapa 3: Lazy Load do YouTube iframe
**Arquivo:** `src/components/landing/HeroSection.tsx`

- Usar atributo `loading="lazy"` no iframe
- Adicionar `srcdoc` para mostrar placeholder antes do carregamento
- O vídeo só é mostrado em desktop (já está assim), então não é crítico

### Etapa 4: Reduzir Animações em Mobile
**Arquivos:** Múltiplas seções da landing

- Desativar `animate-pulse` em mobile
- Substituir `blur-3xl` por cores sólidas em mobile
- Simplificar gradientes

### Etapa 5: Implementar Lazy Loading das Seções (Opcional)
**Arquivo:** `src/pages/Index.tsx`

- Usar `React.lazy()` + `Suspense` para carregar seções conforme scroll
- Alternativa: usar IntersectionObserver para renderização condicional

---

## Prioridade de Implementação

| Prioridade | Etapa | Impacto |
|------------|-------|---------|
| 🔴 Alta | Etapa 1 (ComposersCarousel) | Reduz query pesada |
| 🔴 Alta | Etapa 2 (ShaderBackground) | Garante fallback leve |
| 🟡 Média | Etapa 4 (Animações) | Menos CPU/GPU |
| 🟢 Baixa | Etapa 3 (YouTube) | Só afeta desktop |
| 🟢 Baixa | Etapa 5 (Lazy sections) | Melhoria incremental |

---

## Resultado Esperado

- Carregamento inicial mais rápido (menos dados do banco)
- Scroll mais suave (menos animações contínuas)
- Menos travamentos em iPhones e Android antigos
- Mesma aparência visual mantida

---

## Detalhes Técnicos

### Mudanças no ComposersCarousel
```typescript
// Limitar busca a 50 compositores
const { data: allProfiles } = await supabase
  .from('profiles')
  .select('id, name, artistic_name, avatar_url')
  .not('name', 'is', null)
  .order('created_at', { ascending: false })
  .limit(50); // ← NOVO

// Reduzir duplicação em mobile
const isMobile = window.innerWidth < 768;
const infiniteComposers = isMobile 
  ? [...composers, ...composers] // 2x em mobile
  : [...composers, ...composers, ...composers]; // 3x em desktop
```

### Mudanças no ShaderBackground
```typescript
// Detecção mais robusta
const checkMobile = () => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth < 1024;
  const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  setIsMobile(isSmallScreen || isTouchDevice || isMobileUA);
};

// Fallback estático (sem animação)
<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-green-950/30" />
```

### Mudanças nas Animações
```tsx
// Condicional baseado em preferência do sistema
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ou classe CSS condicional
className={`${isMobile ? '' : 'animate-pulse'}`}
```
