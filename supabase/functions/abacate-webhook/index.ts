import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ABACATE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar se é POST
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Pegar dados do webhook
    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    const { event_type, subscription, customer } = webhookData;

    // Processar diferentes tipos de eventos
    switch (event_type) {
      case 'subscription.payment_succeeded':
      case 'subscription.activated':
        await handleSubscriptionActivated(supabaseClient, subscription, customer);
        break;
        
      case 'subscription.payment_failed':
      case 'subscription.expired':
      case 'subscription.cancelled':
        await handleSubscriptionDeactivated(supabaseClient, subscription);
        break;
        
      default:
        logStep("Unhandled event type", { event_type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      received: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionActivated(supabaseClient: any, subscription: any, customer: any) {
  logStep("Activating subscription", { subscription_id: subscription?.id, customer_email: customer?.email });

  if (!subscription?.id || !customer?.email) {
    throw new Error("Missing subscription or customer data");
  }

  // Buscar usuário pelo email
  const { data: profiles, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('email', customer.email)
    .limit(1);

  if (profileError || !profiles?.length) {
    logStep("User not found", { email: customer.email });
    throw new Error(`User not found for email: ${customer.email}`);
  }

  const userId = profiles[0].id;

  // Calcular data de expiração (1 mês)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  // Atualizar subscription no banco
  const { error: updateError } = await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status: 'active',
      plan_type: 'pro',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew: true,
      payment_provider: 'abacate',
      payment_provider_subscription_id: subscription.id,
      amount: subscription.amount ? subscription.amount / 100 : 14.99, // Converter de centavos
      currency: 'BRL'
    }, { 
      onConflict: 'user_id'
    });

  if (updateError) {
    logStep("Error updating subscription", updateError);
    throw updateError;
  }

  logStep("Subscription activated successfully", { userId, subscription_id: subscription.id });
}

async function handleSubscriptionDeactivated(supabaseClient: any, subscription: any) {
  logStep("Deactivating subscription", { subscription_id: subscription?.id });

  if (!subscription?.id) {
    throw new Error("Missing subscription ID");
  }

  // Atualizar status no banco
  const { error: updateError } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('payment_provider_subscription_id', subscription.id);

  if (updateError) {
    logStep("Error deactivating subscription", updateError);
    throw updateError;
  }

  logStep("Subscription deactivated successfully", { subscription_id: subscription.id });
}