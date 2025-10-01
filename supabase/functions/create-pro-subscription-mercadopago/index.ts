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

  // Buscar token do Mercado Pago
  let mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mercadoPagoAccessToken) {
    mercadoPagoAccessToken = Deno.env.get("Access Token mercado pago");
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

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { user_id, user_email, user_name }: RequestBody = await req.json();
    
    console.log('📝 Dados recebidos:', { user_id, user_email, user_name });

    // Verificar se usuário já tem assinatura ativa
    const { data: existingSubscription } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      console.log('⚠️ Usuário já tem assinatura ativa');
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura ativa' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Criar external_reference único
    const externalReference = `subscription_${user_id}_${Date.now()}`;
    
    // Gerar idempotency key único
    const idempotencyKey = crypto.randomUUID();
    
    // Criar pagamento no Mercado Pago
    const paymentPayload = {
      transaction_amount: 14.99,
      description: 'Assinatura Plano Pro - 30 dias',
      payment_method_id: 'pix',
      payer: {
        email: user_email,
        first_name: user_name || 'Usuário',
      },
      external_reference: externalReference,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`
    };

    console.log('💳 Criando pagamento PIX no Mercado Pago:', paymentPayload);

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
      qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code ? 'present' : 'missing'
    });

    // Salvar subscription como pending no Supabase
    const { data: subscriptionData, error: subscriptionError } = await supabaseService
      .from('subscriptions')
      .insert({
        user_id: user_id,
        status: 'pending',
        plan_type: 'pro',
        amount: 14.99,
        currency: 'BRL',
        payment_provider: 'mercadopago',
        payment_id: paymentData.id.toString(),
        external_reference: externalReference,
        auto_renew: false,
        started_at: null,
        expires_at: null
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('❌ Erro ao salvar subscription:', subscriptionError);
      throw new Error('Erro ao salvar assinatura');
    }

    console.log('✅ Subscription salva como pending:', subscriptionData.id);

    // Retornar dados do PIX
    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        subscription_id: subscriptionData.id,
        amount: 14.99,
        currency: 'BRL'
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
