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
  console.log('🚀 create-credits-payment function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Create Supabase client with service role for database operations
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Get authenticated user
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

    // Parse request body
    const body: CreditPaymentRequest = await req.json();
    const { credits, bonusCredits, unitPrice, totalAmount, customerData } = body;

    console.log('💳 Payment details:', {
      userId: user.id,
      credits,
      bonusCredits,
      unitPrice,
      totalAmount
    });

    // Validate input
    if (!credits || credits < 1 || !totalAmount || totalAmount < 0) {
      throw new Error("Invalid payment details");
    }

    // Get Abacate API key
    const abacateApiKey = Deno.env.get("ABACATE_API_KEY");
    if (!abacateApiKey) {
      console.error('❌ Missing ABACATE_API_KEY');
      throw new Error("Payment service configuration error");
    }

    // Create PIX payment with Abacate
    console.log('🔄 Criando QRCode Pix na Abacate Pay...');
    // Validação dos dados do cliente
    if (!customerData || !customerData.cpf || !customerData.name || !customerData.email || !customerData.phone) {
      throw new Error("Nome, email, telefone e CPF são obrigatórios para gerar o pagamento.");
    }
    const abacateCustomer = {
      name: customerData.name,
      cellphone: customerData.phone,
      email: customerData.email,
      taxId: customerData.cpf.replace(/\D/g, '')
    };
    const abacateBody = {
      amount: Math.round(totalAmount * 100),
      expiresIn: 3600,
      description: `${credits} Crédito${credits > 1 ? 's' : ''}`,
      customer: abacateCustomer
    };
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(abacateBody)
    });
    const abacateData = await abacateResponse.json();
    if (!abacateResponse.ok) {
      console.error('❌ Erro ao criar QRCode Pix:', abacateData.error || abacateResponse.statusText);
      return new Response(
        JSON.stringify({ error: abacateData.error || abacateResponse.statusText }),
        { status: abacateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!abacateData.data?.id) {
      throw new Error('Resposta inválida da Abacate Pay: id ausente');
    }
    // Salva a transação no banco
    const { data: transaction, error: insertError } = await supabaseService
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        credits_purchased: credits,
        bonus_credits: bonusCredits,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_id: abacateData.data.id,
        status: 'pending'
      })
      .select()
      .single();
      
    if (insertError) {
      throw new Error('Erro ao salvar transação no banco');
    }
    
    // Verificar se usuário tem código de parceiro e processar comissão
    try {
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('moderator_notes')
        .eq('id', user.id)
        .single();
      
      const hasAffiliateCode = profile?.moderator_notes?.includes('Indicado por:');
      
      if (hasAffiliateCode) {
        console.log('🎯 Usuário tem código de parceiro, processando comissão...');
        
        // Chamar função para processar comissão
        const { data: commissionResult, error: commissionError } = await supabaseService.rpc(
          'process_affiliate_first_purchase',
          {
            p_user_id: user.id,
            p_payment_amount: totalAmount,
            p_payment_id: transaction?.id || abacateData.data.id
          }
        );
        
        if (commissionError) {
          console.error('❌ Erro ao processar comissão:', commissionError);
        } else if (commissionResult) {
          console.log('✅ Comissão processada com sucesso!');
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao verificar/processar comissão (não crítico):', error);
    }
    
    // Retorna os dados para o frontend
    return new Response(
      JSON.stringify({
        payment_id: abacateData.data.id,
        qr_code: abacateData.data.brCode,
        qr_code_url: abacateData.data.brCodeBase64,
        amount: totalAmount,
        credits,
        bonusCredits,
        finalCredits: credits + bonusCredits
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
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