
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔔 Mercado Pago webhook called');
  
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
    console.log('📨 Webhook payload:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações de diferentes tipos
    if (body.type !== 'payment') {
      console.log('⏭️ Webhook ignored - not payment type, type:', body.type);
      return new Response('OK - Not payment type', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('⚠️ Payment ID not found in webhook');
      return new Response('Payment ID missing', { status: 400, headers: corsHeaders });
    }

    console.log('🔍 Processing payment:', paymentId);

    // Buscar token do Mercado Pago
    let mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      mercadoPagoAccessToken = Deno.env.get("Access Token mercado pago");
    }
    
    if (!mercadoPagoAccessToken) {
      console.error('❌ Mercado Pago token not configured');
      return new Response('Token not configured', { status: 503, headers: corsHeaders });
    }

    // Consultar detalhes do pagamento no Mercado Pago
    console.log('📡 Consulting Mercado Pago API for payment:', paymentId);
    
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      console.error('❌ Error consulting payment:', paymentResponse.status, paymentResponse.statusText);
      const errorText = await paymentResponse.text();
      console.error('❌ Error details:', errorText);
      return new Response(`Payment query failed: ${paymentResponse.status}`, { status: 500, headers: corsHeaders });
    }

    const paymentData = await paymentResponse.json();
    console.log('💳 Payment data:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference
    });

    // Verificar se o pagamento foi aprovado
    if (paymentData.status !== 'approved') {
      console.log(`⏳ Payment not approved yet. Status: ${paymentData.status}`);
      return new Response('Payment not approved yet', { status: 200, headers: corsHeaders });
    }

    console.log('✅ Payment approved! Processing...');

    // Verificar se é pagamento de assinatura ou créditos
    const externalReference = paymentData.external_reference || '';
    const isSubscription = externalReference.startsWith('subscription_');

    if (isSubscription) {
      console.log('🎯 Processing subscription payment');
      
      // Buscar subscription pendente
      const { data: subscription, error: subscriptionError } = await supabaseService
        .from('subscriptions')
        .select('*')
        .eq('payment_provider_subscription_id', paymentId.toString())
        .eq('status', 'pending')
        .single();

      if (subscriptionError || !subscription) {
        console.error('❌ Error finding subscription:', subscriptionError);
        return new Response('Subscription not found', { status: 200, headers: corsHeaders });
      }

      console.log('📋 Found subscription:', subscription.id);

      // Ativar subscription por 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: updateError } = await supabaseService
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('❌ Error activating subscription:', updateError);
        return new Response('Error activating subscription', { status: 500, headers: corsHeaders });
      }

      console.log('🎉 Subscription activated successfully!', {
        userId: subscription.user_id,
        subscriptionId: subscription.id,
        expiresAt: expiresAt.toISOString()
      });

      return new Response('OK - Subscription activated', { status: 200, headers: corsHeaders });
    }

    // Processar créditos (fluxo existente)
    console.log('💰 Processing credits payment');
    
    const { data: transaction, error: transactionError } = await supabaseService
      .from('credit_transactions')
      .select('*')
      .eq('payment_id', paymentId.toString())
      .eq('status', 'pending')
      .single();

    if (transactionError) {
      console.error('❌ Error finding transaction:', transactionError);
      return new Response('Transaction not found', { status: 200, headers: corsHeaders });
    }

    if (!transaction) {
      console.log('⚠️ Transaction not found or already processed:', paymentId);
      return new Response('Transaction not found or already processed', { status: 200, headers: corsHeaders });
    }

    console.log('📋 Found transaction:', {
      id: transaction.id,
      user_id: transaction.user_id,
      credits_purchased: transaction.credits_purchased,
      bonus_credits: transaction.bonus_credits
    });

    const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);

    // Buscar perfil do usuário
    const { data: currentProfile, error: profileError } = await supabaseService
      .from('profiles')
      .select('credits')
      .eq('id', transaction.user_id)
      .single();

    if (profileError) {
      console.error('❌ Error finding user profile:', profileError);
      return new Response('User profile not found', { status: 500, headers: corsHeaders });
    }

    const newCreditsTotal = (currentProfile.credits || 0) + totalCredits;

    console.log('💰 Updating credits:', {
      userId: transaction.user_id,
      currentCredits: currentProfile.credits || 0,
      creditsToAdd: totalCredits,
      newTotal: newCreditsTotal
    });

    // Atualizar créditos do usuário
    const { error: creditsError } = await supabaseService
      .from('profiles')
      .update({ credits: newCreditsTotal })
      .eq('id', transaction.user_id);

    if (creditsError) {
      console.error('❌ Error updating credits:', creditsError);
      return new Response('Error updating credits', { status: 500, headers: corsHeaders });
    }

    // Atualizar status da transação
    const { error: transactionUpdateError } = await supabaseService
      .from('credit_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (transactionUpdateError) {
      console.error('❌ Error updating transaction:', transactionUpdateError);
      return new Response('Error updating transaction', { status: 500, headers: corsHeaders });
    }

    console.log('🎉 Credits successfully added!', {
      userId: transaction.user_id,
      creditsAdded: totalCredits,
      newTotal: newCreditsTotal,
      transactionId: transaction.id
    });

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
