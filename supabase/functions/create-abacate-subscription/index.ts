import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { user_data, plan } = await req.json();
    if (!user_data?.name || !user_data?.email || !user_data?.cpf) {
      throw new Error("Missing user data");
    }
    if (!plan?.name || !plan?.price) {
      throw new Error("Missing plan data");
    }

    logStep("Processing subscription", { user_data, plan });

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
        description: `Assinatura ${plan.name} - Compuse Pro`,
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
    logStep("Abacate PIX QR Code created", abacateData);

    if (abacateData.error) {
      throw new Error(`Erro na criação do PIX: ${abacateData.error}`);
    }

    // Criar subscription no banco
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: 'pending', // Começa como pending até confirmação do pagamento
        plan_type: 'pro',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        payment_provider: 'abacate',
        payment_provider_subscription_id: abacateData.data?.id || abacateData.id,
        amount: plan.price,
        currency: plan.currency || 'BRL'
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (subError) throw subError;
    logStep("Subscription saved to database", subscription);

    return new Response(JSON.stringify({
      success: true,
      subscription_id: subscription.id,
      pix_data: {
        id: abacateData.data.id,
        amount: abacateData.data.amount,
        brCode: abacateData.data.brCode,
        brCodeBase64: abacateData.data.brCodeBase64,
        expiresAt: abacateData.data.expiresAt
      },
      status: abacateData.data?.status || 'pending'
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