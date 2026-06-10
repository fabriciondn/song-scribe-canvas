## Objetivo

Resolver as 7 vulnerabilidades críticas que estão bloqueando a publicação, sem quebrar nenhuma funcionalidade existente. Depois disso, publicar a rota `/portfolio` em produção.

## Riscos & princípio guia

Vários itens (buckets públicos, tabelas no Realtime) são usados por funcionalidades **em produção**. A regra é: **manter tudo funcionando** — onde hoje se usa URL pública direta, vamos passar a usar **signed URLs** (URLs assinadas) com validade longa; onde hoje se usa Realtime em tabela sensível, vamos **filtrar do lado do servidor** ou trocar por polling pontual quando necessário.

Nada de remover features. Cada mudança será validada lendo os arquivos que tocam o recurso afetado.

---

## Correções

### 1. Bucket `author-registrations` → privado
- Migration: `UPDATE storage.buckets SET public = false WHERE id = 'author-registrations'`.
- Auditar todos os pontos que hoje montam URL pública (`getPublicUrl`) para esse bucket e trocar por `createSignedUrl(path, 60 * 60 * 24 * 7)` (7 dias) — arquivos afetados conforme grep:
  - `src/services/storage/storageBuckets.ts`
  - `src/components/author-registration/MobileRegistrationStep3.tsx`
  - `src/components/author-registration/AuthorRegistrationReview.tsx`
  - `src/components/registered-works/WorkDetailsModal.tsx`
  - `src/pages/AuthorRegistration.tsx`, `src/pages/PublicRegistrationForm.tsx`, `src/pages/Pendrive.tsx`
  - `src/components/admin/AdminForms.tsx`, `MobileAdminForms.tsx`, `src/components/moderator/ModeratorForms.tsx`
  - `src/components/mobile/MobileCertificateDetails.tsx`
- Confirmar que as policies de `storage.objects` para esse bucket continuam permitindo SELECT pelos donos / admins (já estão corretas no scanner).

### 2. Bucket `backups` → privado
- Migration: `UPDATE storage.buckets SET public = false WHERE id = 'backups'`.
- RLS atual (`auth.uid()::text = (storage.foldername(name))[1]`) continua válida.
- Onde for usado, trocar por signed URL (varredura adicional após migration).

### 3. Bucket `temp-pdfs` → privado
- Migration: `UPDATE storage.buckets SET public = false WHERE id = 'temp-pdfs'`.
- Edge function `generate-temp-certificate` já roda como service_role — ajustar para retornar **signed URL** em vez de `publicUrl`.
- Front-end (telas de certificado) consome a URL retornada pela function, então a troca é transparente.

### 4. Coluna `password` em `public_registration_forms` → remover
- Auditar `PublicRegistrationForm.tsx`, `AdminForms.tsx`, `MobileAdminForms.tsx`, `ModeratorForms.tsx`, `LoadFromFormButton.tsx` para remover qualquer leitura/escrita da coluna.
- Fluxo de criação de senha já passa por `supabase.auth.signUp` (via `secure_public_registration` ou no admin). Apenas tirar referências mortas.
- Migration: `ALTER TABLE public.public_registration_forms DROP COLUMN IF EXISTS password`.

### 5. `profiles` fora do Realtime
- Migration: `ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles`.
- Front-end: hooks que escutam `profiles` (créditos, presença) — `useUserCredits.tsx`, `useRealtimeUpdates.tsx`, etc. — passam a usar **refetch on focus/interval** (já existe pattern). Onde o realtime era essencial, manter o canal mas restringir à própria linha via filter `id=eq.${auth.uid()}` se Supabase permitir; caso não, polling de 30s.

### 6. `author_registrations` fora do Realtime
- Migration: `ALTER PUBLICATION supabase_realtime DROP TABLE public.author_registrations`.
- Hooks `useRegistrationStatus.tsx`, `useGlobalRegistrationNotifications.tsx`, `useRealtimeUpdates.tsx`: trocar Realtime por **polling** de 10–15s enquanto status = `em análise` (transição já é curta, conforme regra de timing existente). Quando status final, parar polling.

### 7. `affiliate_withdrawal_requests` fora do Realtime
- Migration: `ALTER PUBLICATION supabase_realtime DROP TABLE public.affiliate_withdrawal_requests`.
- `useAffiliateWithdrawals.tsx` / `AffiliateWithdrawals.tsx`: trocar subscription por refetch após ação (já há mutate).

---

## Ordem de execução

1. Ler em paralelo todos os arquivos das seções 1–7 que ainda não conheço, para mapear cada referência.
2. Para cada bucket privado: criar helper `getSignedUrl(bucket, path)` em `src/services/storage/storageBuckets.ts` e substituir os `getPublicUrl` por `await getSignedUrl(...)` nos componentes que renderizam áudio/PDF/imagem.
3. Ajustar a edge function `generate-temp-certificate` para devolver signed URL.
4. Remover usos da coluna `password` no front e no fluxo público.
5. Aplicar a migration única com:
   - 3× `UPDATE storage.buckets SET public = false` (buckets)
   - 3× `ALTER PUBLICATION supabase_realtime DROP TABLE` (realtime)
   - `ALTER TABLE ... DROP COLUMN password`
6. Substituir Realtime por polling/filter nos hooks listados.
7. Rodar `security--run_security_scan` para confirmar que os 7 itens foram resolvidos.
8. Publicar via `preview_ui--publish`.

## O que **não** será alterado

- Nenhuma policy RLS existente.
- Nenhum fluxo de pagamento / créditos / assinatura.
- Nenhuma UI da página de Portfólio (que motivou a publicação).
- Buckets que já são privados ou de imagem pública intencional (ex.: avatars).

## Critério de pronto

- Scanner retorna 0 findings de nível `error`.
- Áudios/PDFs/certificados continuam abrindo (signed URL).
- Notificações de status de registro continuam aparecendo (polling).
- Publicação bem-sucedida em `compuse.com.br/portfolio`.
