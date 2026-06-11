## Diagnóstico

**Cliente:** Marcos Ribeiro Antonio (`4d684d02-6177-436f-a1d7-47da2b30a8a6`)
**Moderador:** Edinaldo Nedino (`acordeondeourobrasil@gmail.com`) — token MP configurado via secret, OK.

A assinatura dele está assim no banco:
- `status = 'active'`
- `expires_at = 2026-06-09` (já venceu há 2 dias — hoje é 11/06/2026)

A edge function `create-pro-subscription-mercadopago` faz esta verificação:

```ts
if (existingSubscription && existingSubscription.status === 'active') {
  return error 400 "Você já possui uma assinatura ativa"
}
```

Ela só olha o `status`, **não** olha `expires_at`. Como nenhum job marcou a assinatura como `expired`, o sistema entende que ele ainda tem plano ativo e **bloqueia a renovação** — daí o erro.

Confirmado: há **3 assinaturas no banco** com `status='active'` e `expires_at < now()` na mesma situação.

## Correção proposta

### 1. Corrigir a verificação na edge function `create-pro-subscription-mercadopago`
Considerar uma assinatura como ativa **somente** se `status='active'` **E** `expires_at > now()`. Assim, planos vencidos passam para o fluxo de UPDATE (reaproveitar a linha existente como `pending` e gerar novo PIX), exatamente como já acontece com `expired`/`trial`.

```ts
const isReallyActive =
  existingSubscription?.status === 'active' &&
  existingSubscription?.expires_at &&
  new Date(existingSubscription.expires_at) > new Date();

if (isReallyActive) {
  return error 400 "Você já possui uma assinatura ativa";
}
```

Nenhuma outra parte da function muda — o bloco de UPDATE já existe e funciona.

### 2. Corrigir os dados dos 3 usuários afetados
Migração única marcando como `expired` todas as assinaturas com `status='active' AND expires_at < now()`, liberando renovação imediata para Marcos e os outros 2 clientes na mesma situação.

```sql
UPDATE subscriptions
SET status = 'expired', updated_at = now()
WHERE status = 'active' AND expires_at < now();
```

## Fora do escopo (não vou mexer)
- Não vou criar cron/trigger automático para expirar assinaturas (não foi pedido e o fix da function já resolve o bloqueio na prática).
- Não vou alterar webhook do Mercado Pago nem fluxo de pagamento.
- Não vou tocar em nada relacionado ao Portfolio/carrossel.

## Resultado esperado
Após aplicar: Marcos consegue gerar o PIX de renovação normalmente, e o pagamento continua indo para a conta MP do moderador Edinaldo (lógica de token do moderador permanece intacta).