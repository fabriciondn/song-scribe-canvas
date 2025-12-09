import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  userId: string;
  email: string;
  name: string;
  couponId?: string;
  couponCode?: string;
}

serve(async (req) => {
  console.log('🚀 create-pendrive-subscription: Iniciando processo');
  
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
    const { userId, email, name, couponId, couponCode }: RequestBody = await req.json();
    
    console.log('📝 Dados recebidos:', { userId, email, name, couponId, couponCode });

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Validar cupom se informado
    let discountPercentage = 0;
    let validCouponId: string | null = null;
    
    if (couponId && couponCode) {
      console.log('🎟️ Validando cupom:', couponCode);
      
      const { data: coupon, error: couponError } = await supabaseService
        .from('discount_coupons')
        .select('*')
        .eq('id', couponId)
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();
      
      if (couponError || !coupon) {
        console.log('❌ Cupom inválido');
        return new Response(
          JSON.stringify({ error: 'Cupom inválido ou não encontrado' }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // Verificar validade
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Este cupom expirou' }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // Verificar limite de usos
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: 'Este cupom atingiu o limite de usos' }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // Verificar se aplica ao pendrive
      if (!coupon.applies_to?.includes('pendrive')) {
        return new Response(
          JSON.stringify({ error: 'Este cupom não é válido para o plano Pendrive' }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      discountPercentage = coupon.discount_percentage;
      validCouponId = coupon.id;
      console.log('✅ Cupom válido! Desconto:', discountPercentage + '%');
    }

    // Calcular preço final
    const basePrice = 10.00;
    const finalPrice = basePrice - (basePrice * (discountPercentage / 100));
    console.log('💰 Preço final:', finalPrice);

    // Verificar se usuário já tem assinatura Pendrive ou Pro ativa
    const { data: existingSubscription } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .maybeSingle();

    // Se já tem assinatura Pro ativa, não precisa do Pendrive
    if (existingSubscription?.plan_type === 'pro') {
      console.log('⚠️ Usuário já tem assinatura Pro ativa');
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura Pro que inclui o Pendrive' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Se já tem assinatura Pendrive ativa
    if (existingSubscription?.plan_type === 'pendrive') {
      console.log('⚠️ Usuário já tem assinatura Pendrive ativa');
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura Pendrive ativa' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Gerar idempotency key único
    const idempotencyKey = crypto.randomUUID();
    const externalReference = `pendrive_${userId}_${Date.now()}`;
    
    // Criar preferência no Mercado Pago (checkout pro)
    const preferencePayload = {
      items: [
        {
          title: discountPercentage > 0 
            ? `Assinatura Pendrive - ${discountPercentage}% OFF` 
            : 'Assinatura Pendrive - Acesso às Músicas',
          description: 'Assinatura mensal para download de músicas registradas',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: finalPrice,
        }
      ],
      payer: {
        email: email,
        name: name || 'Usuário',
      },
      external_reference: externalReference,
      back_urls: {
        success: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/pendrive?payment=success`,
        failure: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/pendrive?payment=failure`,
        pending: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/pendrive?payment=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'COMPUSE PENDRIVE',
    };

    console.log('💳 Criando preferência no Mercado Pago:', preferencePayload);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('❌ Erro do Mercado Pago:', errorText);
      throw new Error(`Erro ao criar preferência: ${mpResponse.status}`);
    }

    const preferenceData = await mpResponse.json();
    console.log('✅ Preferência criada no Mercado Pago:', {
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    });

    // Verificar se já existe subscription para este usuário
    const { data: anySubscription } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (anySubscription) {
      // Atualizar subscription existente para pendrive pending
      console.log('📝 Atualizando subscription existente:', anySubscription.id);
      
      await supabaseService
        .from('subscriptions')
        .update({
          status: 'pending',
          plan_type: 'pendrive',
          amount: finalPrice,
          currency: 'BRL',
          payment_provider: 'mercadopago',
          payment_provider_subscription_id: preferenceData.id,
          auto_renew: false,
        })
        .eq('id', anySubscription.id);

      console.log('✅ Subscription atualizada para pendrive pending');
    } else {
      // Criar nova subscription
      console.log('📝 Criando nova subscription pendrive');
      
      await supabaseService
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'pending',
          plan_type: 'pendrive',
          amount: finalPrice,
          currency: 'BRL',
          payment_provider: 'mercadopago',
          payment_provider_subscription_id: preferenceData.id,
          auto_renew: false,
        });

      console.log('✅ Subscription pendrive criada como pending');
    }

    // Incrementar uso do cupom se foi usado
    if (validCouponId) {
      console.log('🎟️ Incrementando uso do cupom:', validCouponId);
      
      await supabaseService.rpc('increment', { 
        x: 1, 
        row_id: validCouponId 
      }).catch(async () => {
        // Fallback: atualizar diretamente
        await supabaseService
          .from('discount_coupons')
          .update({ current_uses: supabaseService.rpc('') })
          .eq('id', validCouponId);
      });
      
      // Usar SQL direto para incrementar
      const { error: updateError } = await supabaseService
        .from('discount_coupons')
        .update({ 
          current_uses: (await supabaseService
            .from('discount_coupons')
            .select('current_uses')
            .eq('id', validCouponId)
            .single()).data?.current_uses + 1 || 1 
        })
        .eq('id', validCouponId);
      
      if (updateError) {
        console.log('⚠️ Erro ao incrementar cupom:', updateError);
      }
      
      // Registrar uso do cupom
      await supabaseService
        .from('coupon_usage_logs')
        .insert({
          coupon_id: validCouponId,
          user_id: userId,
          subscription_type: 'pendrive',
          original_amount: basePrice,
          discount_amount: basePrice - finalPrice,
          final_amount: finalPrice,
        });
      
      console.log('✅ Uso do cupom registrado');
    }

    // Retornar URL do checkout
    return new Response(
      JSON.stringify({
        init_point: preferenceData.init_point,
        preference_id: preferenceData.id,
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
