

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
      console.error('❌ Authorization header missing');
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = data.user;
    console.log('✅ User authenticated:', user.id);

    let body: CreditPaymentRequest;
    try {
      body = await req.json();
      console.log('📥 Request body received:', {
        credits: body.credits,
        totalAmount: body.totalAmount,
        hasCustomerData: !!body.customerData
      });
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { credits, bonusCredits, unitPrice, totalAmount, customerData } = body;

    // Validações básicas
    if (!credits || credits < 1) {
      console.error('❌ Invalid credits:', credits);
      return new Response(
        JSON.stringify({ error: "Quantidade de créditos inválida" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      console.error('❌ Invalid total amount:', totalAmount);
      return new Response(
        JSON.stringify({ error: "Valor total inválido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customerData) {
      console.error('❌ Customer data missing');
      return new Response(
        JSON.stringify({ error: "Dados do cliente são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validações mais específicas dos dados do cliente
    if (!customerData.name?.trim()) {
      console.error('❌ Customer name missing or empty');
      return new Response(
        JSON.stringify({ error: "Nome é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customerData.email?.trim()) {
      console.error('❌ Customer email missing or empty');
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customerData.cpf?.trim()) {
      console.error('❌ Customer CPF missing or empty');
      return new Response(
        JSON.stringify({ error: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar token do Mercado Pago com logging detalhado
    console.log('🔍 Verificando configuração do Mercado Pago...');
    
    // Listar todas as variáveis de ambiente disponíveis (sem mostrar valores)
    const envVars = Object.keys(Deno.env.toObject());
    console.log('📊 Variáveis de ambiente disponíveis:', envVars);
    
    // CORREÇÃO: Usar let ao invés de const para permitir reatribuição
    let mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    if (!mercadoPagoAccessToken) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não encontrado');
      console.log('🔍 Tentando outras variações de nome...');
      
      // Tentar outras possíveis variações do nome
      const possibleNames = [
        "MERCADOPAGO_ACCESS_TOKEN", 
        "MP_ACCESS_TOKEN",
        "Access Token mercado pago"
      ];
      
      for (const name of possibleNames) {
        const token = Deno.env.get(name);
        if (token) {
          console.log(`✅ Token encontrado com nome: ${name}`);
          mercadoPagoAccessToken = token;
          break;
        }
      }
      
      if (!mercadoPagoAccessToken) {
        console.error('❌ Nenhum token do Mercado Pago encontrado em nenhuma variação');
        return new Response(
          JSON.stringify({ 
            error: "Token do Mercado Pago não configurado. Configure o secret 'MERCADO_PAGO_ACCESS_TOKEN' no Supabase.",
            availableVars: envVars.filter(v => v.includes('MERCADO') || v.includes('MP_'))
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('✅ Token do Mercado Pago encontrado');
    console.log('🔄 Processando dados do cliente...');
    
    // Limpar e validar CPF
    const cleanCpf = customerData.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      console.error('❌ Invalid CPF length:', cleanCpf.length);
      return new Response(
        JSON.stringify({ error: "CPF deve ter 11 dígitos" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Função para validar CPF (dígitos verificadores)
    function isValidCpf(cpf: string): boolean {
      // Verificar se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cpf)) return false;
      
      // Calcular primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.charAt(9))) return false;
      
      // Calcular segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.charAt(10))) return false;
      
      return true;
    }
    
    if (!isValidCpf(cleanCpf)) {
      console.error('❌ CPF inválido (falha na validação):', cleanCpf);
      return new Response(
        JSON.stringify({ error: "CPF inválido. Por favor, verifique o número informado." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ CPF validado com sucesso');

    // Preparar dados para o Mercado Pago
    const [firstName, ...lastNameParts] = customerData.name.trim().split(' ');
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : firstName;
    
    // Telefone: usar o fornecido ou um padrão se não houver
    let phone = '11999999999'; // padrão
    if (customerData.phone && customerData.phone.trim() !== '') {
      const cleanPhone = customerData.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        phone = cleanPhone;
      }
    }

    console.log('📱 Dados processados:', { 
      firstName: firstName.substring(0, 30),
      lastName: lastName.substring(0, 30),
      cpf: cleanCpf,
      phone: phone 
    });

    const mercadoPagoPayload = {
      transaction_amount: Number(totalAmount.toFixed(2)),
      description: `${credits} Crédito${credits > 1 ? 's' : ''} - Sistema Compuse`,
      payment_method_id: "pix",
      payer: {
        email: customerData.email.trim(),
        first_name: firstName.substring(0, 30),
        last_name: lastName.substring(0, 30),
        identification: {
          type: "CPF",
          number: cleanCpf
        }
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      external_reference: `compuse_${user.id}_${Date.now()}`
    };

    console.log('📡 Enviando pagamento para Mercado Pago:', {
      transaction_amount: mercadoPagoPayload.transaction_amount,
      description: mercadoPagoPayload.description,
      payer_email: mercadoPagoPayload.payer.email,
      external_reference: mercadoPagoPayload.external_reference
    });

    let mercadoPagoResponse;
    let mercadoPagoData;
    
    try {
      mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `compuse_${user.id}_${Date.now()}`
        },
        body: JSON.stringify(mercadoPagoPayload)
      });

      mercadoPagoData = await mercadoPagoResponse.json();
      
      console.log('📡 Resposta do Mercado Pago:', {
        status: mercadoPagoResponse.status,
        ok: mercadoPagoResponse.ok,
        id: mercadoPagoData.id,
        status_detail: mercadoPagoData.status_detail,
        has_qr_code: !!mercadoPagoData.point_of_interaction?.transaction_data?.qr_code
      });
    } catch (fetchError) {
      console.error('❌ Erro na comunicação com Mercado Pago:', fetchError);
      return new Response(
        JSON.stringify({ error: "Erro na comunicação com o serviço de pagamento" }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mercadoPagoResponse.ok) {
      console.error('❌ Erro no Mercado Pago:', {
        status: mercadoPagoResponse.status,
        statusText: mercadoPagoResponse.statusText,
        data: mercadoPagoData
      });
      
      let errorMessage = 'Erro ao processar pagamento';
      if (mercadoPagoData?.message) {
        errorMessage = mercadoPagoData.message;
      } else if (mercadoPagoData?.cause && Array.isArray(mercadoPagoData.cause) && mercadoPagoData.cause.length > 0) {
        errorMessage = mercadoPagoData.cause[0].description || errorMessage;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: mercadoPagoData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mercadoPagoData?.id) {
      console.error('❌ Resposta inválida do Mercado Pago - ID ausente:', mercadoPagoData);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do Mercado Pago: ID ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar transação no banco
    console.log('💾 Salvando transação no banco...');
    let transaction;
    try {
      const { data, error: insertError } = await supabaseService
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          credits_purchased: credits,
          bonus_credits: bonusCredits || 0,
          unit_price: unitPrice,
          total_amount: totalAmount,
          payment_id: mercadoPagoData.id.toString(),
          payment_provider: 'mercadopago',
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao salvar transação:', insertError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar transação no banco' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      transaction = data;
    } catch (dbError) {
      console.error('❌ Erro de banco de dados:', dbError);
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ⚠️ REMOVIDO: Comissão agora é processada APENAS no webhook após pagamento aprovado
    console.log('💡 Comissão será processada pelo webhook após confirmação do pagamento');

    // Extrair QR Code do response
    const qrCodeData = mercadoPagoData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mercadoPagoData.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCodeData) {
      console.error('❌ QR Code não encontrado na resposta:', {
        has_point_of_interaction: !!mercadoPagoData.point_of_interaction,
        has_transaction_data: !!mercadoPagoData.point_of_interaction?.transaction_data
      });
      return new Response(
        JSON.stringify({ error: 'QR Code não gerado pelo Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Pagamento criado com sucesso:', {
      payment_id: mercadoPagoData.id,
      status: mercadoPagoData.status,
      has_qr_code: !!qrCodeData
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mercadoPagoData.id.toString(),
        transaction_id: transaction.id,
        qr_code: qrCodeData,
        qr_code_url: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
        amount: totalAmount,
        credits,
        bonusCredits: bonusCredits || 0,
        finalCredits: credits + (bonusCredits || 0),
        provider: 'mercadopago',
        status: mercadoPagoData.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor. Tente novamente em alguns minutos.',
        type: error instanceof Error ? error.name : 'UnknownError'
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

