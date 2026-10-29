import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { authenticatedUser, ensureLaunchPurchaseAllowed, saveLaunchOrder, LAUNCH_AMOUNT, LAUNCH_DESCRIPTION } from '../_shared/launch-subscription.ts';

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
    const user = await authenticatedUser(req);
    await req.json();
    const user_id = user.id;
    const { data: customerProfile, error: customerProfileError } = await supabaseService
      .from('profiles').select('name, cpf, cellphone, email').eq('id', user_id).single();
    if (customerProfileError) throw customerProfileError;
    const user_name = customerProfile?.name?.trim() || '';
    const user_email = user.email || customerProfile?.email || '';
    const cleanCpf = (customerProfile?.cpf || '').replace(/\D/g, '');
    const nameParts = user_name.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2 || cleanCpf.length !== 11 || !user_email) {
      return new Response(JSON.stringify({ error: 'Complete nome e sobrenome, CPF válido e e-mail no seu perfil antes de assinar.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    await ensureLaunchPurchaseAllowed(supabaseService,user.id);
    
    console.log('📝 Dados recebidos:', { user_id, user_email, user_name });

    // Verificar se usuário foi criado por um moderador
    const { data: moderatorUser, error: moderatorLookupError } = await supabaseService
      .from('moderator_users')
      .select('moderator_id')
      .eq('user_id', user_id)
      .maybeSingle();
    if (moderatorLookupError) throw moderatorLookupError;
    if (!moderatorUser) {
      return new Response(JSON.stringify({ error: 'Usuário sem parceiro vinculado: utilize o checkout OpenPix.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Não redirecionar silenciosamente o pagamento do parceiro para a plataforma.
    if (!mercadoPagoAccessToken) {
      return new Response(JSON.stringify({ error: 'Mercado Pago do parceiro não configurado. Contate o suporte.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      transaction_amount: LAUNCH_AMOUNT,
      description: LAUNCH_DESCRIPTION,
      payment_method_id: 'pix',
      payer: {
        email: user_email,
        first_name: firstName.substring(0, 30),
        last_name: lastName.substring(0, 30),
        identification: { type: 'CPF', number: cleanCpf },
      },
      external_reference: externalReference,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`
    };

    console.log('💳 Criando pagamento PIX no Mercado Pago:', {
      amount: paymentPayload.transaction_amount,
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
      let detail = `HTTP ${mpResponse.status}`;
      try {
        const parsed = JSON.parse(errorText);
        const causes = Array.isArray(parsed.cause)
          ? parsed.cause.map((cause: { description?: string; code?: string }) => cause.description || cause.code).filter(Boolean).join('; ')
          : '';
        detail = [parsed.message, causes].filter(Boolean).join(' — ') || detail;
      } catch {
        // Resposta não JSON: não expor detalhes internos.
      }
      return new Response(JSON.stringify({ error: `Mercado Pago: ${detail}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentData = await mpResponse.json();
    console.log('✅ Pagamento criado no Mercado Pago:', {
      id: paymentData.id,
      status: paymentData.status,
      qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code ? 'present' : 'missing',
      isModeratorPayment
    });

    const orderId = await saveLaunchOrder(supabaseService,user_id,'mercadopago',paymentData.id.toString());

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
            amount: LAUNCH_AMOUNT
          }
        });
    }

    // Retornar dados do PIX
    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        subscription_id: orderId,
        amount: LAUNCH_AMOUNT,
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
