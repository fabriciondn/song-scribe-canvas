import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { ensureLaunchPurchaseAllowed, saveLaunchOrder, LAUNCH_AMOUNT, LAUNCH_DESCRIPTION } from '../_shared/launch-subscription.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ABACATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Pegar dados do body
    await req.json();
    await ensureLaunchPurchaseAllowed(supabaseClient, user.id);
    const {data: storedProfile, error: profileError} = await supabaseClient.from('profiles').select('name,email,cpf,cellphone').eq('id',user.id).single();
    if (profileError) throw profileError;
    const user_data = storedProfile;
    const plan = {name:'Plano Padrão',price:LAUNCH_AMOUNT,currency:'BRL'};
    if (!user_data?.name || !user_data?.email || !user_data?.cpf) {
      throw new Error("Missing user data");
    }
    if (!plan?.name || !plan?.price) {
      throw new Error("Missing plan data");
    }

    

    // Integração com Abacate Pay para criar QR Code PIX
    const abacateApiKey = Deno.env.get("ABACATE_API_KEY");
    if (!abacateApiKey) throw new Error("ABACATE_API_KEY não configurada");

    // Validar se temos todos os campos obrigatórios do usuário
    if (!user_data.cellphone) {
      throw new Error("Campo telefone é obrigatório para o PIX");
    }

    const abacateResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(plan.price * 100), // Valor em centavos
        expiresIn: 3600, // 1 hora para expirar
        description: LAUNCH_DESCRIPTION,
        customer: {
          name: user_data.name,
          cellphone: user_data.cellphone,
          email: user_data.email,
          taxId: user_data.cpf.replace(/\D/g, '') // Remove formatação do CPF
        },
        metadata: {
          externalId: `user-${user.id}-pro-${Date.now()}`
        }
      })
    });

    if (!abacateResponse.ok) {
      const errorData = await abacateResponse.text();
      logStep("Abacate API error", { status: abacateResponse.status, error: errorData });
      throw new Error(`Erro na API Abacate: ${abacateResponse.status} - ${errorData}`);
    }

    const abacateData = await abacateResponse.json();
    

    // Verificar se há erro na resposta da Abacate Pay
    if (abacateData.error) {
      throw new Error(`Erro na criação do PIX: ${abacateData.error}`);
    }

    // Verificar se os dados estão presentes
    if (!abacateData.data) {
      throw new Error('Resposta inválida da Abacate Pay - dados não encontrados');
    }

    const orderId = await saveLaunchOrder(supabaseClient,user.id,'abacate',abacateData.data.id);

    // Retornar dados no formato esperado pelo frontend
    return new Response(JSON.stringify({
      success: true,
      subscription_id: orderId,
      pix_data: {
        id: abacateData.data.id,
        amount: abacateData.data.amount,
        brCode: abacateData.data.brCode,
        brCodeBase64: abacateData.data.brCodeBase64,
        expiresAt: abacateData.data.expiresAt,
        status: abacateData.data.status
      },
      status: 'pending'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Melhor tratamento de erro para debugging
    let errorMessage: string;
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { 
        name: error.name, 
        stack: error.stack,
        message: error.message
      };
    } else {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    }
    
    logStep("ERROR", errorDetails);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});