
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

    // Mercado Pago envia notificações em dois formatos:
    // Formato novo: { type: "payment", data: { id: "123" } }
    // Formato antigo: { topic: "payment", resource: "123" }
    
    const isNewFormat = body.type === 'payment';
    const isOldFormat = body.topic === 'payment';
    
    if (!isNewFormat && !isOldFormat) {
      console.log('⏭️ Webhook ignored - not payment type, type:', body.type, 'topic:', body.topic);
      return new Response('OK - Not payment type', { status: 200, headers: corsHeaders });
    }

    // Extrair payment ID baseado no formato
    let paymentId = body.data?.id;
    
    // Se for formato antigo, extrair do resource
    if (!paymentId && isOldFormat && body.resource) {
      // resource pode ser só o ID ou uma URL completa
      const resourceStr = body.resource.toString();
      paymentId = resourceStr.includes('/') 
        ? resourceStr.split('/').pop() 
        : resourceStr;
      console.log('📋 Extracted payment ID from old format:', paymentId);
    }
    
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
    const isPendriveSubscription = externalReference.startsWith('pendrive_');

    if (isSubscription || isPendriveSubscription) {
      const planType = isPendriveSubscription ? 'pendrive' : 'pro';
      console.log(`🎯 Processing ${planType} subscription payment`);
      
      // Buscar subscription pendente pelo preference_id ou payment_id
      let subscription = null;
      
      // Primeiro tentar buscar pelo payment_id
      const { data: subByPayment } = await supabaseService
        .from('subscriptions')
        .select('*')
        .eq('payment_provider_subscription_id', paymentId.toString())
        .eq('status', 'pending')
        .maybeSingle();
      
      subscription = subByPayment;
      
      // Se não encontrou, tentar extrair user_id do external_reference
      if (!subscription) {
        // external_reference format: pendrive_{userId}_{timestamp} ou subscription_{userId}_{timestamp}
        const parts = externalReference.split('_');
        if (parts.length >= 2) {
          const userId = parts[1];
          console.log('🔍 Searching subscription by user_id:', userId);
          
          const { data: subByUser } = await supabaseService
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('plan_type', planType)
            .eq('status', 'pending')
            .maybeSingle();
          
          subscription = subByUser;
        }
      }

      if (!subscription) {
        console.error('❌ Subscription not found for payment:', paymentId);
        return new Response('Subscription not found', { status: 200, headers: corsHeaders });
      }

      console.log('📋 Found subscription:', subscription.id, 'Plan:', subscription.plan_type);

      // Ativar subscription por 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: updateError } = await supabaseService
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_provider_subscription_id: paymentId.toString(),
          last_credit_grant_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('❌ Error activating subscription:', updateError);
        return new Response('Error activating subscription', { status: 500, headers: corsHeaders });
      }

      // 🎁 Conceder créditos mensais para assinatura Pro
      if (planType === 'pro') {
        console.log('💰 Granting monthly credits for Pro subscription...');
        try {
          const { data: creditsResult, error: creditsError } = await supabaseService.rpc(
            'grant_monthly_subscription_credits',
            { p_user_id: subscription.user_id }
          );
          
          if (creditsError) {
            console.error('❌ Error granting monthly credits:', creditsError);
          } else {
            console.log('✅ Monthly credits granted:', creditsResult);
          }
        } catch (creditsErr) {
          console.error('⚠️ Error granting credits (non-critical):', creditsErr);
        }
      }

      console.log(`🎉 ${planType.toUpperCase()} subscription activated successfully!`, {
        userId: subscription.user_id,
        subscriptionId: subscription.id,
        planType: subscription.plan_type,
        expiresAt: expiresAt.toISOString()
      });

      return new Response(`OK - ${planType} subscription activated`, { status: 200, headers: corsHeaders });
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

    // ⭐ PROCESSAR COMISSÃO DE AFILIADO (se aplicável)
    console.log('🎯 Verificando comissão de afiliado...');
    try {
      const { data: commissionResult, error: commissionError } = await supabaseService.rpc(
        'process_affiliate_first_purchase',
        {
          p_user_id: transaction.user_id,
          p_payment_amount: transaction.total_amount,
          p_payment_id: transaction.id
        }
      );
      
      if (commissionError) {
        console.error('❌ Erro ao processar comissão:', commissionError);
      } else if (commissionResult) {
        console.log('✅ Comissão processada com sucesso!');
      } else {
        console.log('ℹ️ Comissão não aplicável (usuário não indicado ou já processado)');
      }
    } catch (error) {
      console.error('⚠️ Erro ao processar comissão (não crítico):', error);
    }

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
