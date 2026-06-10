## Landing Page de Portfólio de Produção Musical

Página pública e clean em `/portfolio` para exibir os trabalhos de produção musical com comparativos antes/depois e depoimentos em áudio. Tudo gerenciável pelo admin.

### Identidade visual
- Paleta: preto (#0a0a0a), branco (#ffffff) e verde do site como acento (segue token `--primary` existente).
- Tipografia: **Syne** nos títulos, **Plus Jakarta Sans** no corpo.
- Estilo: muito clean, generoso em espaço, micro-animações ao scroll (fade/slide suaves), foto redonda do compositor com anel verde sutil, players minimalistas com waveform estilizada.

### Estrutura da página `/portfolio`
1. **Hero** — título curto e impactante + subtítulo de uma linha + CTA WhatsApp.
   - Ex.: *"Sua música, do esboço ao mestre."* / *"Produção musical profissional com resultado audível."*
2. **Faixa de números** (3 stats configuráveis: ex. "+120 músicas produzidas", "9 anos de estúdio", "4.9★ avaliação").
3. **Grid de trabalhos** — cards com:
   - Foto redonda do compositor
   - Nome + estilo musical
   - Dois players lado a lado: **Antes** (cinza) e **Depois** (verde)
   - Tag opcional ("Sertanejo", "Gospel", etc.)
4. **Depoimentos em áudio** — carrossel com foto redonda + player do depoimento + nome.
5. **CTA final** — bloco verde com botão grande "Quero produzir minha música" abrindo WhatsApp (número configurável no admin).
6. **Footer** simples.

### Painel Admin (nova aba "Portfólio")
- **Trabalhos** (CRUD): nome do compositor, foto, estilo, áudio antes, áudio depois, ordem, ativo/inativo.
- **Depoimentos** (CRUD): nome, foto, áudio, ordem, ativo/inativo.
- **Configurações da página**: headline, subheadline, número WhatsApp, mensagem pré-preenchida, 3 stats do hero.
- Uploads vão para um bucket Storage público de áudios/fotos do portfólio.

### Detalhes técnicos
- Rota nova `/portfolio` no router (público, sem auth).
- 3 tabelas novas: `portfolio_works`, `portfolio_testimonials`, `portfolio_settings` (key/value singleton).
- Bucket `portfolio-media` público para imagens e áudios.
- RLS: SELECT público nas 3 tabelas; INSERT/UPDATE/DELETE só admin (`has_role(auth.uid(),'admin')`).
- Componente novo `AdminPortfolio.tsx` adicionado ao `AdminDashboard`.
- Player customizado leve (HTML5 audio + barra de progresso animada), sem libs novas.
- Animações com Tailwind + IntersectionObserver simples (sem novas dependências).

### Copys (curtas e diretas)
- Hero: *"Sua música merece soar profissional."* / *"Ouça o antes e o depois. Decida com os ouvidos."*
- Trabalhos: *"Resultados reais. Sem retoque."*
- Depoimentos: *"Quem produziu com a gente."*
- CTA: *"Vamos produzir a sua agora?"* → botão **Falar no WhatsApp**.

### Fora do escopo
- Não altera nenhuma funcionalidade existente.
- Sem sistema de avaliações/comentários públicos nesta etapa.
