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

    // Aqui você integraria com a API da Abacate Pay
    // Por enquanto, simularemos a criação da subscription
    
    // Exemplo de como seria a integração real com Abacate Pay:
    /*
    const abacateApiKey = Deno.env.get("ABACATE_API_KEY");
    if (!abacateApiKey) throw new Error("Abacate API key not configured");

    const abacateResponse = await fetch('https://api.abacatepay.com/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name: user_data.name,
          email: user_data.email,
          document: user_data.cpf
        },
        plan: {
          name: plan.name,
          amount: plan.price * 100, // Valor em centavos
          currency: plan.currency || 'BRL',
          interval: 'month'
        },
        return_url: `${req.headers.get("origin")}/dashboard`,
        cancel_url: `${req.headers.get("origin")}/checkout`
      })
    });

    if (!abacateResponse.ok) {
      throw new Error(`Abacate API error: ${abacateResponse.statusText}`);
    }

    const abacateData = await abacateResponse.json();
    */

    // SIMULAÇÃO - Em produção, usar dados reais da Abacate Pay
    const mockAbacateData = {
      id: `abacate_${Date.now()}`,
      payment_url: `https://checkout.abacatepay.com/mock-payment?amount=${plan.price * 100}&customer=${encodeURIComponent(user_data.name)}`,
      status: 'pending'
    };

    logStep("Abacate subscription created", mockAbacateData);

    // Criar subscription no banco
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: 'active', // Em produção, começaria como 'pending'
        plan_type: 'pro',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        payment_provider: 'abacate',
        payment_provider_subscription_id: mockAbacateData.id,
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
      payment_url: mockAbacateData.payment_url,
      status: mockAbacateData.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});