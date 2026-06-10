## Objetivo
Destravar publish corrigindo **todos** os findings cr\u00edticos do scanner sem deixar nada quebrado em produ\u00e7\u00e3o.

## Escopo dos 4 findings cr\u00edticos
1. **`raffle_reservations` RLS permissiva** \u2014 fix r\u00e1pido em SQL.
2. **`author-registrations` bucket p\u00fablico** \u2014 trocar p/ privado + refatorar 8 arquivos.
3. **`backups` bucket p\u00fablico** \u2014 trocar p/ privado (sem refactor necess\u00e1rio: nenhum c\u00f3digo usa `getPublicUrl` nele).
4. **`temp-pdfs` bucket p\u00fablico** \u2014 trocar p/ privado + ajustar 1 edge function.

\u26a0\ufe0f **Aviso de risco:** alterar `author-registrations` para privado quebra qualquer URL p\u00fablica antiga salva em campos como `audio_url`, `pdf_provisorio` etc. Vou trocar todos os `getPublicUrl()` por `createSignedUrl()` com TTL de 1h, mas **URLs antigas armazenadas em banco e em e-mails j\u00e1 enviados pararam de funcionar** (n\u00e3o tem como evitar). Cada t\u00edtulo continuar\u00e1 funcionando porque o c\u00f3digo gera URL fresca a cada renderiza\u00e7\u00e3o.

## Etapa 1 \u2014 Migration SQL (1 arquivo)
```sql
-- a) raffle_reservations: trocar RLS USING(true) por auth.uid()=user_id + admin
DROP POLICY "Authenticated users can view reservations" ON public.raffle_reservations;
CREATE POLICY "Users see own reservations" ON public.raffle_reservations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all reservations" ON public.raffle_reservations
  FOR SELECT TO authenticated USING (public.is_admin_user());

-- b) Tornar 3 buckets privados
UPDATE storage.buckets SET public = false 
WHERE id IN ('author-registrations','backups','temp-pdfs');
```
(Se a migration n\u00e3o conseguir alterar `storage.buckets`, instruo voc\u00ea a desmarcar "Public" no painel \u2014 30s por bucket.)

## Etapa 2 \u2014 Refatorar 8 arquivos frontend (author-registrations)
Trocar `supabase.storage.from('author-registrations').getPublicUrl(path)` por uma fun\u00e7\u00e3o helper `getSignedAuthorUrl(path)` que chama `createSignedUrl(path, 3600)` e cacheia o resultado por 50min.

Arquivos:
- `src/components/author-registration/MobileRegistrationStep3.tsx`
- `src/components/author-registration/AuthorRegistrationReview.tsx`
- `src/components/registered-works/WorkDetailsModal.tsx`
- `src/pages/PublicRegistrationForm.tsx`
- `src/pages/Pendrive.tsx`
- `src/components/admin/AdminForms.tsx`
- `src/components/admin/MobileAdminForms.tsx`
- `src/components/moderator/ModeratorForms.tsx`
- `src/components/mobile/MobileCertificateDetails.tsx`

Componentes que renderizam `<audio src={getPublicUrl(...)}>` direto no JSX (Admin/Moderator/Mobile Admin) precisar\u00e3o virar pequenos componentes async que carregam o signed URL via `useEffect` antes de renderizar.

## Etapa 3 \u2014 Edge function `generate-temp-certificate`
Trocar 2 chamadas `getPublicUrl` por `createSignedUrl` (TTL 7 dias para o link enviado por e-mail).

## Etapa 4 \u2014 Aceitar findings *warn* restantes
Marcar os 7 findings n\u00edvel `warn` (linter Supabase: search_path, leaked password, postgres version, etc.) como aceitos com justificativa, j\u00e1 que n\u00e3o bloqueiam publish.

## Fora do escopo
- N\u00e3o vou mexer em nada al\u00e9m do necess\u00e1rio para fechar os 4 findings.
- N\u00e3o vou tocar nos outros buckets (`music-previews`, `banners`, etc.) que est\u00e3o OK como p\u00fablicos.
- N\u00e3o vou alterar o hero do Portfolio (j\u00e1 est\u00e1 pronto).

## Resultado esperado
Depois disso o scanner libera o Publish. **Voc\u00ea ainda precisa clicar em Publish \u2192 Update** para o hero novo (e essas corre\u00e7\u00f5es) irem ao ar em `compuse.com.br`.

## Tempo estimado
~15-20 minutos de edi\u00e7\u00f5es minhas. Recomendo testar em preview antes de publicar:
- Tocar \u00e1udio de uma obra em "Obras Registradas"
- Abrir um certificado PDF
- Renderizar lista de obras no painel admin

Pronto para come\u00e7ar?