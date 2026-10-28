import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { activateLaunchPayment, paymentIdSchema } from '../_shared/launch-subscription.ts';
import { verifyAbacatePix } from '../_shared/verify-abacate.ts';

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


    const { status, metadata } = webhookData;

    // Processar pagamento concluído
    if (status === 'SUCCEEDED' || status === 'paid' || webhookData.event === 'billing.paid') {
      await handlePaymentSucceeded(supabaseClient, webhookData);
    } else {
      logStep("Payment not succeeded", { status });
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

async function handlePaymentSucceeded(supabaseClient: any, webhookData: any) {
  logStep("Processing payment succeeded", { id: webhookData.id });

  const paymentId = paymentIdSchema.parse(webhookData.id || webhookData.data?.pixQrCode?.id);
  const {data: launchOrder, error: launchError} = await supabaseClient.from('subscription_launch_orders').select('id').eq('provider','abacate').eq('payment_id',paymentId).maybeSingle();
  if (launchError) throw launchError;
  if (launchOrder) {
    if (!await verifyAbacatePix(paymentId)) throw new Error('Payment not confirmed');
    await activateLaunchPayment(supabaseClient,'abacate',paymentId,97,new Date().toISOString());
    return;
  }

  // Buscar subscription pendente com este payment_id
  const { data: subscriptions, error: subError } = await supabaseClient
    .from('subscriptions')
    .select('*')
    .eq('payment_provider_subscription_id', paymentId)
    .eq('status', 'pending')
    .limit(1);

  if (subError) {
    logStep("Error finding subscription", subError);
    throw subError;
  }

  if (!subscriptions || subscriptions.length === 0) {
    logStep("No pending subscription found", { paymentId });
    return;
  }

  const subscription = subscriptions[0];
  const userId = subscription.user_id;

  // Calcular data de expiração (30 dias a partir de agora)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Ativar subscription por 30 dias
  const { error: updateError } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);

  if (updateError) {
    logStep("Error activating subscription", updateError);
    throw updateError;
  }

  logStep("Subscription activated for 30 days", { 
    userId, 
    subscription_id: subscription.id,
    expires_at: expiresAt.toISOString()
  });
}