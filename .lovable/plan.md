
Objetivo
- Corrigir o problema na landing page (rota “/”) em que a página não responde ao scroll da rodinha do mouse no desktop (parece “travada” e não desce).

O que já observei no código
- Não há handlers de `wheel` / `onWheel` no projeto que estejam bloqueando scroll (busca por `onWheel`, `addEventListener('wheel')`, etc. não encontrou nada).
- A landing usa elementos `absolute` cobrindo o hero (`ShaderBackground` e overlay escuro) que podem ficar “por cima” em áreas vazias e receber eventos do mouse. Normalmente isso não deveria impedir scroll, mas em alguns navegadores/combinações pode causar comportamento ruim quando há iframes/elementos complexos.
- Há uma regra global em `src/index.css`:
  - `html, body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; }`
  - Essa regra é útil para iOS (evitar “bounce”/áreas cinzas), mas pode atrapalhar “scroll chaining” no desktop (por exemplo: quando o cursor está sobre alguma área que vira um “scroll container” mesmo sem você perceber, a rolagem pode não “passar” para o documento).

Hipótese mais provável (sem mexer em outras funcionalidades)
- A landing está ficando com algum elemento “cobrindo” a tela e recebendo o foco/ponteiro (especialmente por cima do hero/vídeo), e combinado com `overscroll-behavior: none` o scroll do mouse não “propaga” como esperado.
- Em vez de refatorar, vamos aplicar correções pontuais apenas na landing e em CSS global estritamente relacionadas a scroll.

Plano de implementação (mudanças mínimas e localizadas)
1) Tornar os layers de background do hero “transparentes para eventos”
   - Arquivos: 
     - `src/components/landing/ShaderBackground.tsx`
     - `src/components/landing/HeroSection.tsx`
   - Ajuste:
     - Adicionar `pointer-events-none` no wrapper do `ShaderBackground` (e nos layers internos, se necessário).
     - Adicionar `pointer-events-none` no overlay escuro do hero.
   - Resultado:
     - Garantimos que nenhuma camada visual do fundo possa “capturar” o mouse/scroll, deixando o documento receber o scroll normalmente.
   - Impacto:
     - Não altera layout/visual; só remove interação de elementos que não precisam ser clicáveis.

2) Ajustar `overscroll-behavior` para não quebrar scroll no desktop
   - Arquivo: `src/index.css`
   - Ajuste:
     - Manter o comportamento atual (overscroll-behavior: none) apenas para contextos mobile/iOS, e liberar o padrão no desktop.
     - Exemplo de abordagem:
       - Remover `overscroll-behavior: none` do bloco global `html, body`.
       - Reaplicar `overscroll-behavior: none` em um bloco condicionado (por exemplo, via `@supports (-webkit-touch-callout: none)` para iOS/WebKit touch, ou `@media (hover: none)` para dispositivos touch).
   - Resultado:
     - Desktop volta a ter scroll chaining e comportamento padrão do wheel.
     - iOS continua com mitigação de “bounce”/áreas cinza.

3) “Cinto de segurança” apenas na landing: forçar overflow vertical como auto enquanto estiver em “/”
   - Arquivo: `src/pages/Index.tsx`
   - Ajuste:
     - No mount da landing, setar:
       - `document.documentElement.style.overflowY = 'auto'`
       - `document.body.style.overflowY = 'auto'`
     - E no unmount, limpar (restaurar para string vazia).
   - Por quê:
     - Se algum CSS externo/estado anterior estiver deixando `overflow` incorreto, isso garante que a landing sempre possa rolar.
   - Impacto:
     - Restrito à landing; não muda comportamento do app logado/dashboards.

4) Validação (checklist rápido)
   - Desktop (Chrome/Edge):
     - Rodinha funciona com o cursor em cima do hero (área vazia), em cima do vídeo (iframe), e em cima do carrossel.
   - Mobile:
     - iPhone (PWA instalado) mantém suavidade e continua sem áreas cinza de overscroll.
   - Regressões:
     - Botões “Começar agora” e “Saiba mais” continuam clicáveis (o conteúdo está em z-index maior; pointer-events-none só no background/overlay).

Arquivos que serão alterados (somente os necessários para esse bug)
- `src/components/landing/ShaderBackground.tsx` (pointer-events-none)
- `src/components/landing/HeroSection.tsx` (pointer-events-none no overlay)
- `src/index.css` (escopo do overscroll-behavior para mobile/iOS; desktop volta ao padrão)
- `src/pages/Index.tsx` (overflowY auto apenas na landing, com cleanup)

Notas técnicas (para referência)
- `overscroll-behavior: none` pode impedir que a rolagem “escape” de um elemento sob o cursor para o documento. Em páginas com iframes/carrosséis, isso pode se manifestar como “rodinha não funciona”, mesmo com scrollbar visível.
- `pointer-events-none` em backgrounds absolutos evita qualquer interferência do layer visual sobre eventos do mouse, sem mexer no design.

Critério de sucesso
- No desktop, na rota “/”, o scroll com a rodinha funciona imediatamente sem precisar “arrastar a barra”, independentemente da área onde o cursor esteja (hero/vídeo/carrossel).
