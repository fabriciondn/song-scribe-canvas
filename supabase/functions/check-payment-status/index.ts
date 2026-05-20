import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const body = await req.json();
    const { paymentId, simulate } = body;

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
    const isOpenPix = paymentIdStr.includes('_');

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

      const opResp = await fetch(`https://api.openpix.com.br/api/v1/charge/${paymentIdStr}`, {
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

    // Fallback/Default
    return new Response(JSON.stringify({ isPaid: false, status: 'pending' }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] ❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});