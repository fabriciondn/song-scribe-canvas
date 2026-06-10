## Objetivo
Substituir o hero atual da página `/portfolio` por uma versão inspirada no snippet enviado, mantendo:
- Título dinâmico (`settings.hero_title`)
- Subtítulo dinâmico (`settings.hero_subtitle`)
- Badge "Portfólio"
- Botão CTA "Falar no WhatsApp"
- As duas fileiras animadas com as fotos dos compositores (no lugar dos ícones do flaticon)

E adotar a estrutura visual do snippet: grid radial sutil de fundo, badge centralizado, título grande com tracking apertado, subtítulo, botão, e as duas linhas horizontais animadas (uma para esquerda, outra para direita) com fade nas laterais.

## Tema
Dark — mesmo fundo preto/escuro do resto da página. O grid radial vai usar `rgba(255,255,255,0.05)` em vez do preto do snippet.

## Alteração
- Arquivo: `src/pages/Portfolio.tsx`
- Substituir apenas o bloco `<section>` do hero (linhas ~190-288 aproximadamente — da abertura do hero até o fechamento que vem antes da seção de Stats).
- Aproveitar/manter as animações `animate-scroll-left` / `animate-scroll-right` que já existem.
- Manter `Reveal` para entrada animada.
- Avatares dos compositores (h-16 w-16 md:h-20 md:w-20, ring primary, fundo white/5) — sem mudanças nos players, stats, works, depoimentos, CTA ou footer.

## Fora do escopo
- Nenhuma mudança em Stats, Works, Testimonials, CTA, Footer
- Nenhuma mudança no AudioPlayer
- Nenhuma mudança em rotas ou no admin do Portfolio
- Sem `<style jsx>` (não é suportado em Vite/React puro) — as animações já existem no CSS global do projeto

## Resultado
O hero ganha o visual do snippet (grid de fundo, badge pill, título grande centralizado, botão arredondado, dois trilhos horizontais animados com fade lateral) preservando todos os dados dinâmicos da página.