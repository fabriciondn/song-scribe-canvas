
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    console.log('🔔 Webhook OpenPix recebido:', JSON.stringify(body, null, 2));

    // A OpenPix envia o status no campo event
    // No caso de pagamento concluído, o evento é OPENPIX:CHARGE_COMPLETED
    if (body.event !== 'OPENPIX:CHARGE_COMPLETED') {
      return new Response('Evento ignorado', { status: 200 });
    }

    const charge = body.charge;
    const correlationID = charge.correlationID;

    console.log('🔍 Processando pagamento aprovado:', correlationID);

    // Verificar se é crédito ou assinatura baseado no correlationID
    if (correlationID.startsWith('credits_')) {
      const { data: transaction } = await supabaseService
        .from('credit_transactions')
        .select('*')
        .eq('payment_id', correlationID)
        .eq('status', 'pending')
        .maybeSingle();

      if (transaction) {
        // Atualizar créditos do usuário
        const { data: profile } = await supabaseService
          .from('profiles')
          .select('credits')
          .eq('id', transaction.user_id)
          .single();

        const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
        
        await supabaseService
          .from('profiles')
          .update({ credits: (profile.credits || 0) + totalCredits })
          .eq('id', transaction.user_id);

        await supabaseService
          .from('credit_transactions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', transaction.id);
          
        console.log('✅ Créditos adicionados via OpenPix:', totalCredits);
      }
    } else if (correlationID.startsWith('subscription_')) {
      const { data: subscription } = await supabaseService
        .from('subscriptions')
        .select('*')
        .eq('payment_provider_subscription_id', correlationID)
        .eq('status', 'pending')
        .maybeSingle();

      if (subscription) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabaseService
          .from('subscriptions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            last_credit_grant_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Conceder créditos da assinatura
        await supabaseService.rpc('grant_monthly_subscription_credits', { p_user_id: subscription.user_id });
        
        console.log('✅ Assinatura ativada via OpenPix');
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(error.message, { status: 500 });
  }
});
