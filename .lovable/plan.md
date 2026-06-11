## Objetivo

Permitir edição completa das prévias já criadas e mudar o formato do link público de código numérico (`previa0001`) para `previa-{musica}-{cliente}`.

## 1. Edição das Prévias (AdminMusicPreviews.tsx)

Adicionar na coluna direita (quando uma prévia está selecionada):

**Editar dados da prévia:**
- Botão "Editar" abre modal com campos:
  - Nome do cliente
  - Título do projeto/música
  - Status (Aguardando / Aprovada / Recusada) — permitir "dar baixa" manualmente
  - Comentário do cliente (opcional)
- Salva via `update` em `music_previews`.

**Editar faixas existentes** (hoje só permite excluir):
- Cada faixa ganha botão "Editar" ao lado do "Excluir" → modal com:
  - Nome da faixa
  - Tempo de prévia (segundos)
  - Posição (ordem)
- Salva via `update` em `music_preview_tracks`.

**Dar baixa rápida:**
- Botões de ação rápida no header da prévia: "Marcar como Aprovada", "Marcar como Recusada", "Reabrir (Aguardando)" — atualiza `status` e `reviewed_at`.

Os botões de copiar link, abrir, excluir prévia inteira (já existentes) permanecem intactos.

## 2. Novo formato de URL pública

**Formato novo:** `/previa-{slug-musica}-{slug-cliente}`
Exemplo: `Assis Melo` + `Casa velha` → `/previa-casa-velha-assis-melo`

**Geração do slug** (helper novo `src/lib/previewSlug.ts`):
- Normaliza removendo acentos, lowercase, troca espaços/símbolos por `-`.
- Se já existir slug igual, sufixa `-2`, `-3` etc.
- Fallback: se não houver `project_title`, usa só `previa-{cliente}`.

**Onde aplicar:**
- Ao **criar** nova prévia: gerar slug no formato novo e salvar em `music_previews.slug`.
- Ao **editar** nome do cliente ou título do projeto: regenerar slug automaticamente (com confirmação para o admin, já que o link antigo deixa de funcionar).
- **Migration de dados:** atualizar prévias já existentes para o novo padrão de slug (mantendo `share_token` intacto como fallback de acesso).

**Roteamento** (`SlugDispatcher.tsx`):
- Ampliar regex para reconhecer também `^previa-[a-z0-9-]+$` além dos padrões antigos `previa\d+` / `p\d+`, mantendo retrocompatibilidade com links já enviados a clientes.

## 3. O que NÃO será mexido

- Bucket `music-previews` e edge function `get-preview-audio-url` (recém-criada).
- Página pública `PreviaPublica.tsx` (continua resolvendo por slug OU share_token).
- Fluxo de PIX/pedidos, listens, upload de áudio.
- Outras rotas do app.

## Arquivos afetados

- `src/components/admin/AdminMusicPreviews.tsx` — modais de edição, ações de status, edição de faixa.
- `src/lib/previewSlug.ts` (novo) — geração e deduplicação de slug.
- `src/pages/SlugDispatcher.tsx` — regex aceitando `previa-...`.
- Migration SQL — backfill de `slug` nas prévias existentes no novo formato.

## Perguntas rápidas

1. Ao editar nome do cliente/música de uma prévia já enviada, devo **regenerar o slug** (link antigo quebra) ou **manter o slug original** para não invalidar o link que o cliente recebeu? Sugiro manter original por padrão e oferecer botão "Gerar novo link".
2. "Dar baixa" significa marcar como Aprovada manualmente, certo? Ou seria um status novo tipo "Finalizada/Entregue"?
