Com base na documentação da OpenPix e na estrutura atual do seu projeto (que utiliza Mercado Pago), o plano de migração consiste em:

1. **Substituição das Edge Functions**:
   - Criar `create-openpix-payment` para lidar com a geração de cobranças (Pix) para créditos e assinaturas.
   - Criar `openpix-webhook` para processar as notificações de pagamento da OpenPix.
   - Atualizar `check-payment-status` para também consultar a API da OpenPix quando necessário.

2. **Atualização do Frontend**:
   - Modificar os componentes de Checkout (`CreditsCheckout`, `SubscriptionCheckout`, `ModeratorRecharge`) para chamar as novas funções da OpenPix em vez das do Mercado Pago.
   - Atualizar as mensagens de interface de "Mercado Pago" para "OpenPix" ou simplesmente "Pix".

3. **Configuração de Segredos**:
   - Será necessário configurar a `OPENPIX_APP_ID` (App ID da OpenPix) nos segredos do Supabase.

### Detalhes Técnicos

- **Criação de Cobrança**: Utilizaremos o endpoint `POST /v1/charge` da OpenPix.
- **Webhook**: O webhook da OpenPix envia um JSON com o status do pagamento. Precisaremos validar a assinatura (opcional mas recomendado) e atualizar o banco de dados (tabelas `credit_transactions` e `subscriptions`).
- **Segurança**: As novas Edge Functions seguirão o padrão de segurança atual, validando o usuário via token JWT do Supabase.

Vou começar criando as novas Edge Functions e depois atualizarei o frontend.
