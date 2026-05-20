
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  type: 'credits' | 'subscription';
  credits?: number;
  bonusCredits?: number;
  unitPrice?: number;
  totalAmount: number;
  user_id: string;
  user_email: string;
  user_name: string;
  customerData?: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
}

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
    const body: PaymentRequest = await req.json();
    const { type, totalAmount, user_id, user_email, user_name, customerData } = body;

    const openPixAppId = Deno.env.get("OPENPIX_APP_ID");
    if (!openPixAppId) {
      return new Response(
        JSON.stringify({ error: "OpenPix App ID not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correlationID = `${type}_${user_id}_${Date.now()}`;
    
    // Preparar payload para OpenPix
    const openPixPayload = {
      correlationID,
      value: Math.round(totalAmount * 100), // Valor em centavos
      comment: type === 'subscription' ? 'Assinatura Plano Pro - Compuse' : `${body.credits} Créditos - Compuse`,
      customer: {
        name: customerData?.name || user_name,
        email: customerData?.email || user_email,
        taxID: customerData?.cpf?.replace(/\D/g, '') || '',
        phone: customerData?.phone || ''
      }
    };

    console.log('📡 Criando cobrança na OpenPix:', openPixPayload);

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': openPixAppId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openPixPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na OpenPix:', data);
      throw new Error(data.error || 'Erro ao criar cobrança na OpenPix');
    }

    const charge = data.charge;

    // Registrar no banco de dados
    if (type === 'credits') {
      await supabaseService
        .from('credit_transactions')
        .insert({
          user_id,
          credits_purchased: body.credits,
          bonus_credits: body.bonusCredits || 0,
          unit_price: body.unitPrice,
          total_amount: totalAmount,
          payment_id: charge.correlationID,
          payment_provider: 'openpix',
          status: 'pending'
        });
    } else if (type === 'subscription') {
      const { data: existingSub } = await supabaseService
        .from('subscriptions')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existingSub) {
        await supabaseService
          .from('subscriptions')
          .update({
            status: 'pending',
            plan_type: 'pro',
            amount: totalAmount,
            payment_provider: 'openpix',
            payment_provider_subscription_id: charge.correlationID,
          })
          .eq('id', existingSub.id);
      } else {
        await supabaseService
          .from('subscriptions')
          .insert({
            user_id,
            status: 'pending',
            plan_type: 'pro',
            amount: totalAmount,
            payment_provider: 'openpix',
            payment_provider_subscription_id: charge.correlationID,
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: charge.correlationID,
        qr_code: charge.brCode,
        qr_code_url: charge.qrCodeImage,
        correlationID: charge.correlationID
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
