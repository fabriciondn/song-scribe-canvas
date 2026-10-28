import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { authenticatedUser, activateLaunchPayment, paymentIdSchema } from '../_shared/launch-subscription.ts';
import { verifyAbacatePix } from '../_shared/verify-abacate.ts';

async function processSuccessfulPayment(supabase: any, paymentId: string) {
  console.log(`[CHECK-PAYMENT-STATUS] 🔄 Redundant processing for payment: ${paymentId}`);
  
  const { data: transaction } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('status', 'pending')
    .maybeSingle();

  if (transaction) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', transaction.user_id)
      .single();

    const totalCredits = (transaction.credits_purchased || 0) + (transaction.bonus_credits || 0);
    
    // Atualizar créditos
    await supabase
      .from('profiles')
      .update({ credits: (profile?.credits || 0) + totalCredits })
      .eq('id', transaction.user_id);

    // Marcar como completo
    await supabase
      .from('credit_transactions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);
      
    console.log(`[CHECK-PAYMENT-STATUS] ✅ Redundant processing complete. Added ${totalCredits} credits.`);
    return totalCredits;
  }
  return 0;
}

serve(async (req) => {
  console.log('[CHECK-PAYMENT-STATUS] 🚀 Function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const user = await authenticatedUser(req);
    const body = await req.json();
    const paymentId = paymentIdSchema.parse(String(body.paymentId ?? ''));
    const simulate = false;
    const {data: launchOrder, error: launchError} = await supabaseService.from('subscription_launch_orders').select('user_id,provider,status').eq('payment_id',paymentId).maybeSingle();
    if (launchError) throw launchError;
    if (launchOrder && launchOrder.user_id !== user.id) return new Response(JSON.stringify({error:'Access denied'}),{status:403,headers:corsHeaders});
    if (launchOrder?.status === 'paid') return new Response(JSON.stringify({isPaid:true,paid:true,status:'completed'}),{status:200,headers:corsHeaders});
    if (!launchOrder) {
      const {data: ownedCredit} = await supabaseService.from('credit_transactions').select('user_id').eq('payment_id',paymentId).maybeSingle();
      const {data: ownedSub} = await supabaseService.from('subscriptions').select('user_id').eq('payment_provider_subscription_id',paymentId).maybeSingle();
      if ((ownedCredit?.user_id || ownedSub?.user_id) !== user.id) return new Response(JSON.stringify({error:'Payment not found'}),{status:404,headers:corsHeaders});
    }

    console.log('[CHECK-PAYMENT-STATUS] 📋 Checking payment:', { paymentId, simulate });

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required", isPaid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verificar no banco de dados primeiro
    const { data: transaction } = await supabaseService
      .from('credit_transactions')
      .select('status, credits_purchased, bonus_credits')
      .eq('payment_id', paymentId.toString())
      .maybeSingle();

    console.log('[CHECK-PAYMENT-STATUS] 🔍 Database check:', { 
      found: !!transaction, 
      status: transaction?.status 
    });

    if (transaction?.status === 'completed') {
      const creditsAdded = (transaction.credits_purchased || 0) + (transaction.bonus_credits || 0);
      return new Response(
        JSON.stringify({ 
          isPaid: true, 
          paid: true, 
          status: 'completed',
          creditsAdded,
          source: 'database'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Checar API do Provedor
    const paymentIdStr = paymentId.toString();
    const isOpenPix = launchOrder ? launchOrder.provider === 'openpix' : paymentIdStr.includes('_');

    const { data: settings } = await supabaseService
      .from('system_settings')
      .select('key, value')
      .in('key', ['OPENPIX_APP_ID']);

    const openPixAppId = settings?.find(s => s.key === 'OPENPIX_APP_ID')?.value || Deno.env.get("OPENPIX_APP_ID");

    if (isOpenPix) {
      console.log('[CHECK-PAYMENT-STATUS] 💎 Checking OpenPix status API');
      if (!openPixAppId) {
        return new Response(JSON.stringify({ error: "OpenPix App ID não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
      }

      const opResp = await fetch(`https://api.openpix.com.br/api/v1/charge/${encodeURIComponent(paymentIdStr)}`, {
        headers: { 'Authorization': openPixAppId }
      });

      if (!opResp.ok) {
        const errorData = await opResp.text();
        console.error('[CHECK-PAYMENT-STATUS] ❌ OpenPix API error:', errorData);
        return new Response(JSON.stringify({ error: "Erro ao consultar OpenPix", isPaid: false }), { status: 502, headers: corsHeaders });
      }

      const opData = await opResp.json();
      const status = opData.charge?.status;
      const isPaid = status === 'COMPLETED';

      console.log('[CHECK-PAYMENT-STATUS] OpenPix status:', status);
      
      // Ativação de assinatura como contingência caso o webhook não chegue
      if (isPaid && launchOrder) {
        if (opData.charge.correlationID !== paymentIdStr) throw new Error('Payment identity mismatch');
        await activateLaunchPayment(supabaseService,'openpix',paymentIdStr,opData.charge.value/100,opData.charge.paidAt);
      } else if (isPaid && paymentIdStr.startsWith('subscription_')) {
        const { data: sub } = await supabaseService
          .from('subscriptions')
          .select('id, user_id')
          .eq('payment_provider_subscription_id', paymentIdStr)
          .eq('status', 'pending')
          .maybeSingle();
        if (sub) {
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
            .eq('id', sub.id);
          await supabaseService.rpc('grant_monthly_subscription_credits', { p_user_id: sub.user_id });
          console.log('[CHECK-PAYMENT-STATUS] ✅ Assinatura ativada via verificação:', paymentIdStr);
        }
      }

      let creditsAdded = 0;
      if (isPaid && transaction?.status === 'pending') {
        // Se a API diz que está pago mas o banco ainda está pendente, processamos aqui
        creditsAdded = await processSuccessfulPayment(supabaseService, paymentIdStr);
      }
      
      return new Response(
        JSON.stringify({ 
          isPaid, 
          paid: isPaid, 
          status,
          creditsAdded: creditsAdded || (isPaid ? (transaction?.credits_purchased || 0) + (transaction?.bonus_credits || 0) : 0)
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (launchOrder?.provider === 'abacate') {
      const paid = await verifyAbacatePix(paymentIdStr);
      if (paid) await activateLaunchPayment(supabaseService,'abacate',paymentIdStr,97,new Date().toISOString());
      return new Response(JSON.stringify({isPaid:paid,paid,status:paid?'completed':'pending'}),{status:200,headers:corsHeaders});
    }
    // Fallback/Default
    return new Response(JSON.stringify({ isPaid: false, status: 'pending' }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] ❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});