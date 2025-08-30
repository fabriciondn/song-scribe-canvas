
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
      throw new Error("Erro de configuração do serviço de pagamento. Contate o administrador.");
    }

    if (!customerData || !customerData.cpf || !customerData.name || !customerData.email) {
      throw new Error("Nome, email e CPF são obrigatórios para gerar o pagamento.");
    }

    console.log('🔄 Criando pagamento PIX no Mercado Pago...');
    
    // Limpar e validar CPF
    const cleanCpf = customerData.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error("CPF deve ter 11 dígitos");
    }

    // Preparar dados para o Mercado Pago
    const [firstName, ...lastNameParts] = customerData.name.trim().split(' ');
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : firstName;
    
    const mercadoPagoPayload = {
      transaction_amount: Number(totalAmount),
      description: `${credits} Crédito${credits > 1 ? 's' : ''} - Sistema Compuse`,
      payment_method_id: "pix",
      payer: {
        email: customerData.email.trim(),
        first_name: firstName.substring(0, 30), // Limite do MP
        last_name: lastName.substring(0, 30), // Limite do MP
        identification: {
          type: "CPF",
          number: cleanCpf
        }
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      external_reference: `compuse_${user.id}_${Date.now()}`
    };

    console.log('📡 Enviando para Mercado Pago:', {
      ...mercadoPagoPayload,
      payer: {
        ...mercadoPagoPayload.payer,
        identification: { type: "CPF", number: "***masked***" }
      }
    });

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `compuse_${user.id}_${Date.now()}`
      },
      body: JSON.stringify(mercadoPagoPayload)
    });

    const mercadoPagoData = await mercadoPagoResponse.json();
    console.log('📡 Resposta do Mercado Pago:', {
      status: mercadoPagoResponse.status,
      id: mercadoPagoData.id,
      status_detail: mercadoPagoData.status_detail,
      point_of_interaction: !!mercadoPagoData.point_of_interaction
    });

    if (!mercadoPagoResponse.ok) {
      console.error('❌ Erro no Mercado Pago:', mercadoPagoData);
      
      // Mapear erros específicos do Mercado Pago
      let errorMessage = 'Erro ao processar pagamento';
      if (mercadoPagoData.message) {
        errorMessage = mercadoPagoData.message;
      } else if (mercadoPagoData.cause && mercadoPagoData.cause.length > 0) {
        errorMessage = mercadoPagoData.cause[0].description || errorMessage;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: mercadoPagoData
        }),
        { 
          status: 400, 
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
      console.error('❌ QR Code não encontrado na resposta:', mercadoPagoData);
      throw new Error('QR Code não gerado pelo Mercado Pago');
    }

    console.log('✅ Pagamento criado com sucesso:', mercadoPagoData.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mercadoPagoData.id.toString(),
        qr_code: qrCodeData,
        qr_code_url: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
        amount: totalAmount,
        credits,
        bonusCredits,
        finalCredits: credits + bonusCredits,
        provider: 'mercadopago',
        status: mercadoPagoData.status
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
        error: error.message || 'Internal server error',
        details: error
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
