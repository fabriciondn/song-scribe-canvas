import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { activateLaunchPayment, paymentIdSchema } from '../_shared/launch-subscription.ts';

// OpenPix uses HMAC SHA256 with the secret on the raw request body.
// The signature is usually provided in the 'x-webhook-signature' header.
async function verifySignature(payload: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  // OpenPix signature is typically Base64 encoded
  const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload)
  );
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
    const { data: settings } = await supabaseService
      .from('system_settings')
      .select('key, value')
      .in('key', ['OPENPIX_WEBHOOK_SECRET', 'OPENPIX_APP_ID']);

    const webhookSecret = Deno.env.get('OPENPIX_WEBHOOK_SECRET') || settings?.find(s => s.key === 'OPENPIX_WEBHOOK_SECRET')?.value;
    
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    console.log('🔔 Webhook OpenPix recebido');

    if (webhookSecret) {
      if (!signature) return new Response('Invalid signature', {status:401,headers:corsHeaders});
      try {
        const isValid = await verifySignature(rawBody, signature, webhookSecret);
        if (!isValid) return new Response('Invalid signature', {status:401,headers:corsHeaders});
      } catch (err) {
        return new Response('Invalid signature', {status:401,headers:corsHeaders});
      }
    }

    let body: any = {};
    try { body = JSON.parse(rawBody || '{}'); } catch { body = {}; }
    

    if (body.event !== 'OPENPIX:CHARGE_COMPLETED' || !body.charge) {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const correlationID = paymentIdSchema.parse(body.charge.correlationID);

    if (!correlationID) {
      console.error('❌ correlationID ausente no payload');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Segurança: confirma o pagamento direto na API da OpenPix antes de liberar qualquer coisa
    const openPixAppId = settings?.find(s => s.key === 'OPENPIX_APP_ID')?.value || Deno.env.get('OPENPIX_APP_ID');
    if (!openPixAppId) {
      console.error('❌ OPENPIX_APP_ID não configurado');
      return new Response('Not configured', { status: 500, headers:corsHeaders });
    }
    const verifyResp = await fetch(`https://api.openpix.com.br/api/v1/charge/${encodeURIComponent(correlationID)}`, {
      headers: { 'Authorization': openPixAppId }
    });
    const verifyData = verifyResp.ok ? await verifyResp.json() : null;
    if (verifyData?.charge?.status !== 'COMPLETED') {
      console.error('❌ Cobrança não confirmada na API OpenPix:', correlationID, verifyData?.charge?.status);
      return new Response('Charge not completed', { status: 200, headers: corsHeaders });
    }

    const {data: launchOrder, error: launchError} = await supabaseService.from('subscription_launch_orders').select('id').eq('provider','openpix').eq('payment_id',correlationID).maybeSingle();
    if (launchError) throw launchError;
    if (launchOrder) {
      if (verifyData.charge.correlationID !== correlationID) throw new Error('Payment identity mismatch');
      await activateLaunchPayment(supabaseService, 'openpix', correlationID, verifyData.charge.value / 100, verifyData.charge.paidAt);
      return new Response('OK', {status:200,headers:corsHeaders});
    }

    console.log('🔍 Processando pagamento aprovado:', correlationID);

    if (correlationID.startsWith('credits_')) {
      const { data: transaction } = await supabaseService
        .from('credit_transactions')
        .select('*')
        .eq('payment_id', correlationID)
        .eq('status', 'pending')
        .maybeSingle();

      if (transaction) {
        const { data: profile } = await supabaseService
          .from('profiles')
          .select('credits')
          .eq('id', transaction.user_id)
          .single();

        const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
        
        await supabaseService
          .from('profiles')
          .update({ credits: (profile.credits || 0) + totalCredits })
          .eq('id', transaction.user_id);

        await supabaseService
          .from('credit_transactions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', transaction.id);
          
        console.log('✅ Créditos adicionados via OpenPix:', totalCredits);
      }
    } else if (correlationID.startsWith('subscription_')) {
      const { data: subscription } = await supabaseService
        .from('subscriptions')
        .select('*')
        .eq('payment_provider_subscription_id', correlationID)
        .eq('status', 'pending')
        .maybeSingle();

      if (subscription) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabaseService
          .from('subscriptions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            last_credit_grant_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        await supabaseService.rpc('grant_monthly_subscription_credits', { p_user_id: subscription.user_id });

        console.log('✅ Assinatura ativada via OpenPix');
      }
    } else if (correlationID.startsWith('preview_')) {
      const orderId = correlationID.replace('preview_', '');
      await supabaseService
        .from('music_preview_orders')
        .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending');
      console.log('✅ Pedido de prévia pago:', orderId);
    }

    return new Response('OK', { status: 200, headers:corsHeaders });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response('Payment processing failed', { status: 500, headers:corsHeaders });
  }
});