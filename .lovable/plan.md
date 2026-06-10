## Nova Hero do /portfolio com carrossel de fotos dos compositores

Substituir a hero atual da página `/portfolio` por uma hero inspirada no componente `IntegrationHero` enviado, mantendo exatamente o mesmo layout/estrutura (badge, título grande, subtítulo, botão CTA e duas fileiras de carrossel infinito com fade nas laterais), porém:

- No lugar dos ícones do exemplo, exibir as **fotos redondas dos compositores** cadastrados em `portfolio_works` (campo `composer_photo_url`).
- Paleta mantida: preto/branco/verde (token `--primary`), Syne + Plus Jakarta.
- CTA do botão continua abrindo o WhatsApp configurado.

### O que muda
- **`src/pages/Portfolio.tsx`** — apenas a seção `<section>` da Hero é reescrita. Tudo o resto (Stats, Works, Testimonials, CTA, Footer) permanece intacto.

### Detalhes da nova Hero
- Fundo preto com um grid sutil (linhas brancas com baixa opacidade) como no exemplo.
- Badge `⚡ Portfólio` (pill com borda).
- Título (vem de `settings.hero_title`).
- Subtítulo (vem de `settings.hero_subtitle`).
- Botão "Falar no WhatsApp" (link `wa.me` já existente).
- Carrossel:
  - Duas fileiras de avatares circulares (`h-16 w-16`, ring verde sutil) usando as fotos de `portfolio_works`.
  - Fileira 1 rola para a esquerda, fileira 2 para a direita (animações `scroll-left` / `scroll-right`, 30s linear infinite).
  - Lista de fotos repetida 4x para loop contínuo; segunda fileira usa a mesma lista invertida para variar.
  - Compositores sem `composer_photo_url` ganham fallback com inicial do nome dentro do círculo.
  - Se não houver nenhum compositor cadastrado ainda, esconder o carrossel (sem quebrar layout).
  - Overlays de fade (gradiente preto) nas bordas esquerda/direita.
- Animações CSS adicionadas via bloco `<style>` já existente no arquivo (apenas acrescentar os keyframes `scroll-left` / `scroll-right` e classes correspondentes).

### Fora do escopo
- Nenhuma alteração no admin, no schema, nas demais seções da página ou em qualquer outra parte do projeto.
