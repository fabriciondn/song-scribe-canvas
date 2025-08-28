
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditPaymentRequest {
  credits: number;
  bonusCredits: number;
  unitPrice: number;
  totalAmount: number;
  customerData?: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
}

serve(async (req) => {
  console.log('🚀 create-mercadopago-payment function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('❌ Authentication error:', authError);
      throw new Error("User not authenticated");
    }

    const user = data.user;
    console.log('✅ User authenticated:', user.id);

    const body: CreditPaymentRequest = await req.json();
    const { credits, bonusCredits, unitPrice, totalAmount, customerData } = body;

    console.log('💳 Payment details:', {
      userId: user.id,
      credits,
      bonusCredits,
      unitPrice,
      totalAmount
    });

    if (!credits || credits < 1 || !totalAmount || totalAmount < 0) {
      throw new Error("Invalid payment details");
    }

    const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      console.error('❌ Missing MERCADO_PAGO_ACCESS_TOKEN');
      throw new Error("Payment service configuration error");
    }

    if (!customerData || !customerData.cpf || !customerData.name || !customerData.email) {
      throw new Error("Nome, email e CPF são obrigatórios para gerar o pagamento.");
    }

    console.log('🔄 Criando pagamento PIX no Mercado Pago...');
    
    // Preparar dados para o Mercado Pago
    const [firstName, ...lastNameParts] = customerData.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    
    const mercadoPagoPayload = {
      transaction_amount: totalAmount,
      description: `${credits} Crédito${credits > 1 ? 's' : ''} - Sistema Compuse`,
      payment_method_id: "pix",
      payer: {
        email: customerData.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: "CPF",
          number: customerData.cpf.replace(/\D/g, '')
        }
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`
    };

    console.log('📡 Enviando para Mercado Pago:', mercadoPagoPayload);

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mercadoPagoPayload)
    });

    const mercadoPagoData = await mercadoPagoResponse.json();
    console.log('📡 Resposta do Mercado Pago:', mercadoPagoData);

    if (!mercadoPagoResponse.ok) {
      console.error('❌ Erro no Mercado Pago:', mercadoPagoData);
      return new Response(
        JSON.stringify({ 
          error: mercadoPagoData.message || mercadoPagoData.error || 'Erro ao processar pagamento' 
        }),
        { 
          status: mercadoPagoResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!mercadoPagoData.id) {
      throw new Error('Resposta inválida do Mercado Pago: ID ausente');
    }

    // Salvar transação no banco
    const { error: insertError } = await supabaseService
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        credits_purchased: credits,
        bonus_credits: bonusCredits,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_id: mercadoPagoData.id.toString(),
        payment_provider: 'mercadopago',
        status: 'pending'
      });

    if (insertError) {
      console.error('❌ Erro ao salvar transação:', insertError);
      throw new Error('Erro ao salvar transação no banco');
    }

    // Extrair QR Code do response
    const qrCodeData = mercadoPagoData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mercadoPagoData.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCodeData) {
      throw new Error('QR Code não gerado pelo Mercado Pago');
    }

    return new Response(
      JSON.stringify({
        payment_id: mercadoPagoData.id.toString(),
        qr_code: qrCodeData,
        qr_code_url: `data:image/png;base64,${qrCodeBase64}`,
        amount: totalAmount,
        credits,
        bonusCredits,
        finalCredits: credits + bonusCredits,
        provider: 'mercadopago'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});
