# Corrigir "Erro ao carregar áudio" na prévia pública

## Causa raiz

O bucket `music-previews` é **privado** e não possui policy de `SELECT` em `storage.objects` para o role `anon`. A página `PreviaPublica.tsx` é acessada por usuários **não autenticados** (link público com token) e chama `supabase.storage.from('music-previews').createSignedUrl(...)` direto do navegador. Sem policy de leitura para `anon`, o Supabase recusa gerar a URL assinada e o frontend mostra "Erro ao carregar áudio".

As outras prévias antigas que funcionaram provavelmente foram acessadas enquanto o usuário estava logado como admin, mascarando o bug.

## Solução (mínima, sem mexer em nada que funciona)

Criar uma edge function pública que valide o token e devolva uma signed URL usando service role — mesmo padrão já usado por `create-preview-pix` e `log_music_preview_listen`. Nenhuma policy de storage precisa ser afrouxada.

### 1. Nova edge function `get-preview-audio-url`

- Recebe `{ token, track_id }` no body.
- Com service role:
  - Busca `music_previews` por `public_token = token` (mesma lógica do RPC `get_music_preview_by_token`).
  - Confirma que `track_id` pertence àquela prévia em `music_preview_tracks`.
  - Pega o `storage_path` da faixa.
  - Gera signed URL no bucket `music-previews` (TTL 10 min).
- Retorna `{ url }` ou erro.
- Sem JWT obrigatório (configurar `verify_jwt = false` em `supabase/config.toml`).
- Headers CORS liberados.

### 2. Ajuste em `src/pages/PreviaPublica.tsx` (apenas dentro de `TrackPlayer`)

Substituir o bloco em `ensureUrl()`:

```ts
const { data, error } = await supabase.storage
  .from('music-previews')
  .createSignedUrl(track.storage_path, 60 * 10);
```

Por uma chamada à nova edge function:

```ts
const { data, error } = await supabase.functions.invoke('get-preview-audio-url', {
  body: { token, track_id: track.id },
});
// usar data.url
```

Nenhuma outra parte do componente é alterada. Lógica de play/pause, progresso, logging e fluxo de compra ficam intactos.

## O que NÃO será mexido

- Policies do bucket `music-previews` (continuam privadas, sem leitura para `anon`).
- Fluxo de compra / PIX / download.
- Componente admin de prévias.
- Demais páginas e RPCs.
