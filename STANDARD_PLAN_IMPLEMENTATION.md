# Plano Padrão — implementation and verification

## Delivered
- Existing plans and subscription checkout now advertise Plano Padrão — Oferta de Lançamento: R$127,00/month crossed out, R$97,00/month, up to 50 author registrations per paid 30-day cycle. Existing visual classes, colors and layout are preserved.
- `plan_type='pro'` remains the permission identifier. No production subscribers or old payments were backfilled, converted, reset or deleted.
- New payment intents live in `subscription_launch_orders`, not in the existing subscription row. Starting or abandoning checkout does not overwrite an active subscription or pending legacy payment.
- `subscription_registration_allowances` holds only the new monthly allowance. `profiles.credits` remains standalone/legacy credits. No expiry or renewal operation clears those credits.
- `activate_launch_subscription` is service-role-only and locks the user/payment rows. It validates R$97 and the payment date, rejects legacy active accounts and pending legacy payments, grants 50 exactly once per payment, and replaces rather than adds the allowance on subsequent paid cycles.
- Renewals are manual PIX purchases after the previous cycle ends; no unpaid scheduled grant exists. Early renewal, overlapping paid cycles and out-of-order callbacks are rejected for reconciliation rather than silently resetting allowance.
- Registration consumption uses monthly allowance first, then standalone credits, then unfrozen legacy bonus. Expired allowance is excluded. New launch registration inserts debit inside the same database transaction, so failed inserts roll back consumption. Legacy registration behavior is left unchanged.
- OpenPix creation verifies the caller, derives ownership from authentication and computes the subscription amount server-side, ignoring client `totalAmount`. OpenPix webhook/polling verify provider identity, R$9700 cents, paid status/date, then call the same atomic activation RPC. Signature checks apply to new launch webhook orders when configured; legacy callback behavior is retained.
- Mercado Pago and Abacate subscription entrypoints also use R$97 and separate launch orders. Mercado Pago verifies approved payment amount/date through its API. Abacate checks payment status through its authenticated API, binds it to the server-created R$9700 order, and uses first verified confirmation time as cycle start because its PIX status endpoint does not document paid timestamp or amount. Older Abacate billing verification fails closed unless its returned amount is 9700.
- Shared payment polling has a subscription mode: unrelated increases of standalone credits cannot falsely confirm a subscription.

## Applied/deployed
Three migrations were applied through the integrated Supabase migration tool:
- `20261028214626_9ff139ba-8514-4f38-aef4-aeac00147d4e.sql`
- `20261028214653_0f64fd1a-ec4c-4687-b897-ced5cfebe781.sql`
- `20261028215400_ed3c58e2-e2ac-4e16-8598-ae6d206b3983.sql`

Eight updated Edge Functions were successfully deployed: create-openpix-payment, openpix-webhook, check-payment-status, create-abacate-subscription, create-pro-subscription, create-pro-subscription-mercadopago, abacate-webhook and mercadopago-webhook. No manual migration/deployment remains for this connected Supabase project. Deploy the same migrations before functions when installing elsewhere. Website publication was not requested or performed.

## Verification
- `bun test tests/standard-plan.test.ts`: 15 passed, 0 failed, 39 assertions. Tests run the actual migrations and PostgreSQL functions in isolated PGlite, including access policies, exact amount/cycle/limit, duplicate callbacks, failed registration rollback, renewal without rollover, expired allowance and preservation of legacy payments/credits.
- `deno check --no-lock --node-modules-dir=auto` on the eight changed functions passed.
- Automatic frontend build diagnostics reported `build OK`; no manual Vite build or frontend typecheck was run because Lovable runs those checks automatically.
- Signed-out browser navigation had no JavaScript page errors, but redirected to login/public content. Authenticated checkout/payment/registration UI was NOT verified: this is an external Supabase project with no managed browser session. No real charge, registration or account data was created for testing.
- New order table remained empty during verification.

## Remaining release checks / limitations
- Complete one authenticated sandbox or deliberately authorized real payment and verify 50 remaining registrations through the UI before website publication. Verify OpenPix live signature format/configuration. Do not publish automatically.
- This project has no stored external Supabase service-role secret reported in connection metadata; function deployment succeeded, but authenticated execution of privileged provider/database calls remains unverified. Confirm runtime credentials without putting any private key in frontend/source.
- OPENPIX_APP_ID and OPENPIX_WEBHOOK_SECRET are currently present in existing system settings, not Project Settings secrets. Existing lookup is retained for compatibility; no secrets were moved or written. Future credential changes should use Project Settings → Secrets.
- Supabase reported 155 pre-existing security findings; none were introduced by the final migrations. Existing profile write policies, legacy privileged functions and legacy webhook security were intentionally not broadly refactored. This is not a project-wide security clearance.
- Integrated Lovable/GitHub change tracking manages saving/commits; no manual Git commit or push was executed, and a GitHub commit hash was not verified.
- Official design.md, components.md and animations.md files were absent from the checkout; existing styling was preserved rather than inventing replacements.