
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔔 mercadopago-webhook function called');
  
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
    console.log('📨 Webhook recebido:', body);

    // Mercado Pago envia notificações de diferentes tipos
    if (body.type !== 'payment') {
      console.log('⏭️ Webhook ignorado - não é do tipo payment');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('⚠️ Payment ID não encontrado no webhook');
      return new Response('Payment ID missing', { status: 400, headers: corsHeaders });
    }

    console.log('🔍 Consultando pagamento no Mercado Pago:', paymentId);

    // Consultar detalhes do pagamento no Mercado Pago
    const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      console.error('❌ Token do Mercado Pago não configurado');
      throw new Error("Token do Mercado Pago não configurado");
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await paymentResponse.json();
    console.log('💳 Dados do pagamento:', paymentData);

    if (!paymentResponse.ok) {
      console.error('❌ Erro ao consultar pagamento:', paymentData);
      throw new Error('Erro ao consultar pagamento no Mercado Pago');
    }

    // Verificar se o pagamento foi aprovado
    if (paymentData.status !== 'approved') {
      console.log(`⏳ Pagamento ainda não aprovado. Status: ${paymentData.status}`);
      return new Response('Payment not approved yet', { status: 200, headers: corsHeaders });
    }

    console.log('✅ Pagamento aprovado! Processando créditos...');

    // Buscar transação no banco
    const { data: transaction, error: transactionError } = await supabaseService
      .from('credit_transactions')
      .select('*')
      .eq('payment_id', paymentId.toString())
      .eq('status', 'pending')
      .maybeSingle();

    if (transactionError) {
      console.error('❌ Erro ao buscar transação:', transactionError);
      throw new Error('Erro ao buscar transação');
    }

    if (!transaction) {
      console.log('⚠️ Transação não encontrada ou já processada:', paymentId);
      return new Response('Transaction not found or already processed', { status: 200, headers: corsHeaders });
    }

    const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);

    // Buscar perfil do usuário
    const { data: currentProfile, error: profileError } = await supabaseService
      .from('profiles')
      .select('credits')
      .eq('id', transaction.user_id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao buscar perfil do usuário');
    }

    const newCreditsTotal = (currentProfile.credits || 0) + totalCredits;

    // Atualizar créditos do usuário
    const { error: creditsError } = await supabaseService
      .from('profiles')
      .update({ credits: newCreditsTotal })
      .eq('id', transaction.user_id);

    if (creditsError) {
      console.error('❌ Erro ao atualizar créditos:', creditsError);
      throw new Error('Erro ao atualizar créditos');
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
      console.error('❌ Erro ao atualizar transação:', transactionUpdateError);
      throw new Error('Erro ao atualizar status da transação');
    }

    console.log('🎉 Créditos adicionados com sucesso!', {
      userId: transaction.user_id,
      creditsAdded: totalCredits,
      newTotal: newCreditsTotal
    });

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
