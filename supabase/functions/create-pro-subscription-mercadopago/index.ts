import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  user_id: string;
  user_email: string;
  user_name: string;
}

serve(async (req) => {
  console.log('🚀 create-pro-subscription-mercadopago: Iniciando processo');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { user_id, user_email, user_name }: RequestBody = await req.json();
    
    console.log('📝 Dados recebidos:', { user_id, user_email, user_name });

    // Verificar se usuário foi criado por um moderador
    const { data: moderatorUser } = await supabaseService
      .from('moderator_users')
      .select('moderator_id')
      .eq('user_id', user_id)
      .maybeSingle();

    let mercadoPagoAccessToken: string | undefined;
    let isModeratorPayment = false;
    let moderatorId: string | null = null;

    if (moderatorUser) {
      console.log('👥 Usuário foi criado pelo moderador:', moderatorUser.moderator_id);
      moderatorId = moderatorUser.moderator_id;
      
      // Buscar configurações de pagamento do moderador
      const { data: paymentSettings } = await supabaseService
        .from('moderator_payment_settings')
        .select('mercadopago_access_token, is_active')
        .eq('moderator_id', moderatorUser.moderator_id)
        .eq('is_active', true)
        .maybeSingle();

      if (paymentSettings && paymentSettings.mercadopago_access_token) {
        console.log('💰 Usando token do Mercado Pago do moderador');
        mercadoPagoAccessToken = paymentSettings.mercadopago_access_token;
        isModeratorPayment = true;
      } else {
        // Verificar se é o moderador específico que tem token no secrets
        const { data: moderatorProfile } = await supabaseService
          .from('profiles')
          .select('email')
          .eq('id', moderatorUser.moderator_id)
          .maybeSingle();

        if (moderatorProfile?.email === 'acordeondeourobrasil@gmail.com') {
          const moderatorToken = Deno.env.get("MODERATOR_ACORDEON_MP_TOKEN");
          if (moderatorToken) {
            console.log('💰 Usando token do Mercado Pago do moderador (via secret)');
            mercadoPagoAccessToken = moderatorToken;
            isModeratorPayment = true;
          }
        }
      }
    }

    // Se não é pagamento de moderador, usar token da plataforma
    if (!mercadoPagoAccessToken) {
      mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mercadoPagoAccessToken) {
        mercadoPagoAccessToken = Deno.env.get("Access Token mercado pago");
      }
      console.log('💰 Usando token do Mercado Pago da plataforma');
    }
    
    if (!mercadoPagoAccessToken) {
      console.error('❌ Token do Mercado Pago não configurado');
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503
        }
      );
    }

    // Verificar se usuário já tem alguma assinatura (ativa ou não)
    const { data: existingSubscription } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    // Se já tem assinatura ativa E NÃO vencida, retornar erro
    const isReallyActive =
      existingSubscription?.status === 'active' &&
      existingSubscription?.expires_at &&
      new Date(existingSubscription.expires_at).getTime() > Date.now();

    if (isReallyActive) {
      console.log('⚠️ Usuário já tem assinatura ativa e válida');
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura ativa' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Criar external_reference único (incluindo info do moderador se aplicável)
    const externalReference = isModeratorPayment 
      ? `subscription_${user_id}_mod_${moderatorId}_${Date.now()}`
      : `subscription_${user_id}_${Date.now()}`;
    
    // Gerar idempotency key único
    const idempotencyKey = crypto.randomUUID();
    
    // Criar pagamento no Mercado Pago
    const paymentPayload = {
      transaction_amount: 29.99,
      description: 'Assinatura Plano Pro - 30 dias',
      payment_method_id: 'pix',
      payer: {
        email: user_email,
        first_name: user_name || 'Usuário',
      },
      external_reference: externalReference,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`
    };

    console.log('💳 Criando pagamento PIX no Mercado Pago:', {
      ...paymentPayload,
      isModeratorPayment,
      moderatorId
    });

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('❌ Erro do Mercado Pago:', errorText);
      throw new Error(`Erro ao criar pagamento: ${mpResponse.status}`);
    }

    const paymentData = await mpResponse.json();
    console.log('✅ Pagamento criado no Mercado Pago:', {
      id: paymentData.id,
      status: paymentData.status,
      qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code ? 'present' : 'missing',
      isModeratorPayment
    });

    let subscriptionData;

    // Se já existe subscription (expirada, trial, etc), fazer UPDATE
    if (existingSubscription) {
      console.log('📝 Atualizando subscription existente:', existingSubscription.id);
      
      const { data: updatedData, error: updateError } = await supabaseService
        .from('subscriptions')
        .update({
          status: 'pending',
          plan_type: 'pro',
          amount: 29.99,
          currency: 'BRL',
          payment_provider: 'mercadopago',
          payment_provider_subscription_id: paymentData.id.toString(),
          auto_renew: false,
          started_at: null,
          expires_at: null
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar subscription:', updateError);
        throw new Error('Erro ao atualizar assinatura');
      }

      subscriptionData = updatedData;
      console.log('✅ Subscription atualizada como pending:', subscriptionData.id);
    } else {
      // Se não existe subscription, fazer INSERT
      console.log('📝 Criando nova subscription');
      
      const { data: insertedData, error: insertError } = await supabaseService
        .from('subscriptions')
        .insert({
          user_id: user_id,
          status: 'pending',
          plan_type: 'pro',
          amount: 29.99,
          currency: 'BRL',
          payment_provider: 'mercadopago',
          payment_provider_subscription_id: paymentData.id.toString(),
          auto_renew: false,
          started_at: null,
          expires_at: null
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar subscription:', insertError);
        throw new Error('Erro ao criar assinatura');
      }

      subscriptionData = insertedData;
      console.log('✅ Subscription criada como pending:', subscriptionData.id);
    }

    // Log de atividade para rastreamento
    if (isModeratorPayment) {
      await supabaseService
        .from('user_activity_logs')
        .insert({
          user_id: user_id,
          action: 'subscription_payment_to_moderator',
          metadata: {
            moderator_id: moderatorId,
            payment_id: paymentData.id,
            amount: 29.99
          }
        });
    }

    // Retornar dados do PIX
    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        subscription_id: subscriptionData.id,
        amount: 29.99,
        currency: 'BRL',
        is_moderator_payment: isModeratorPayment
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
