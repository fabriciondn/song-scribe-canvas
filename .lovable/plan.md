## Objetivo
Resolver os 7 findings críticos do scanner sem quebrar funcionalidades em produção, e publicar a página `/portfolio`.

## Estratégia central
Centralizar todas as URLs de buckets privados em **uma única função helper** (`getStorageUrl`) que devolve **signed URL** para buckets privados e `getPublicUrl` para os demais. Assim, basta substituir cada `supabase.storage.from(...).getPublicUrl(...).data.publicUrl` por `await getStorageUrl(bucket, path)`, mantendo o mesmo comportamento de UI.

---

## Mudanças

### 1) Migration única (DB) — `supabase/migrations/<ts>_security_hardening.sql`
- `update storage.buckets set public = false where id in ('author-registrations','backups','temp-pdfs')`
- `alter publication supabase_realtime drop table public.profiles`
- `alter publication supabase_realtime drop table public.author_registrations`
- `alter publication supabase_realtime drop table public.affiliate_withdrawal_requests`
- `alter table public.public_registration_forms drop column if exists password`

> Tudo idempotente / com `if exists` onde possível.

### 2) Novo helper — `src/services/storage/getStorageUrl.ts`
```ts
const PRIVATE_BUCKETS = new Set(['author-registrations', 'backups', 'temp-pdfs']);
export async function getStorageUrl(bucket: string, path: string, expiresIn = 60*60*24*7) {
  if (PRIVATE_BUCKETS.has(bucket)) {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    return data?.signedUrl ?? '';
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
```

### 3) Substituições no front (todos os pontos mapeados pelo grep)
Trocar `supabase.storage.from('author-registrations').getPublicUrl(path).data.publicUrl` por `await getStorageUrl('author-registrations', path)` em:
- `src/components/registered-works/WorkDetailsModal.tsx` (2 ocorrências)
- `src/components/author-registration/MobileRegistrationStep3.tsx`
- `src/components/author-registration/AuthorRegistrationReview.tsx` (2)
- `src/pages/AuthorRegistration.tsx`
- `src/pages/Pendrive.tsx` (2)
- `src/pages/PublicRegistrationForm.tsx`
- `src/components/mobile/MobileCertificateDetails.tsx`
- `src/components/moderator/ModeratorForms.tsx` (2)
- `src/components/admin/AdminForms.tsx` (2)
- `src/components/admin/MobileAdminForms.tsx` (2)

Pequenas funções auxiliares síncronas que retornam URL viram async (`useEffect` para popular state quando necessário, ou `useState<string>('')` com efeito de signing).

### 4) Edge function `generate-temp-certificate` — já usa `createSignedUrl` (1800s). **Sem mudanças**.
A função também usa URLs públicas de `certificate-assets` para gerar PDF — esse bucket **não está flagged** (continua público).

### 5) Coluna `password` em `public_registration_forms`
Adaptar fluxo admin/moderador para gerar senha **temporária aleatória** na hora de criar a conta (já existe edge function `create-user-from-form`?). Caso contrário:
- Em `AdminForms.tsx`, `MobileAdminForms.tsx`, `ModeratorForms.tsx`: remover leitura/uso de `selectedForm.password`.
- Substituir botão "Criar Conta" para usar senha aleatória gerada na hora (`crypto.randomUUID().slice(0,12)`), exibir num modal "Senha gerada — entregue ao usuário" + sugerir reset.
- Em `PublicRegistrationForm.tsx`: remover campo "senha" do form público e do schema Zod. O usuário definirá senha depois via fluxo de "definir senha" (link enviado por e-mail pelo admin ao criar conta) — ou pode pular se admin já gera.

> ⚠️ Isso é uma mudança de UX: a senha não será mais coletada no formulário público. O usuário receberá uma senha do admin ou e-mail de reset. É a única forma de eliminar o finding sem manter texto puro no banco.

### 6) Hooks Realtime — passar para refetch/polling sem perder comportamento
- `useUserCredits.tsx` — remove subscription em `profiles`; faz refetch on `window.focus` + intervalo de 60s.
- `useRealtimeUpdates.tsx` / `useRegistrationStatus.tsx` / `useGlobalRegistrationNotifications.tsx` — polling de 15s em `author_registrations` apenas enquanto status = `em análise`.
- `useAffiliateWithdrawals.tsx` — remove subscription, refetch ao montar e após cada ação.
- `useSystemNotifications.tsx`, `realtimePresenceService.ts`, `useCollaborativeSession.tsx`, `useMenuFunctions.tsx`, `useAffiliate.tsx` — **não tocar** (escutam outras tabelas, não afetadas).

### 7) Verificação
- Após aplicar migration: `security--run_security_scan` → confirmar 0 erros críticos.
- Smoke test manual mental: registro de obra (upload + áudio toca), painel admin abre form e cria conta, lixeira/pendrive baixa áudio, créditos atualizam após pagamento.
- Publicar via `preview_ui--publish`.

## Não muda
- UI da página `/portfolio`.
- Nenhum bucket público intencional (`certificate-assets`, `avatars`, `music_bases`, etc.).
- Nenhuma policy RLS existente.
- Fluxos de pagamento, créditos, assinatura.

## Critério de pronto
- Scanner: 0 findings nível `error`.
- Áudios continuam tocando, PDFs continuam baixando.
- `compuse.com.br/portfolio` no ar.
