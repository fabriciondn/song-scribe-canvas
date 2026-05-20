import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. Verificar no banco de dados primeiro (se já foi processado pelo webhook)
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

    // 2. Se não estiver no banco ou não estiver completo, checar API do Provedor
    const paymentIdStr = paymentId.toString();
    const isMercadoPago = /^\d+$/.test(paymentIdStr);
    const isOpenPix = paymentIdStr.includes('_');

    // Buscar chaves do banco de dados para garantir que temos as mais recentes
    const { data: settings } = await supabaseService
      .from('system_settings')
      .select('key, value')
      .in('key', ['OPENPIX_APP_ID', 'MERCADO_PAGO_ACCESS_TOKEN', 'ABACATE_API_KEY']);

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
      
      return new Response(JSON.stringify({ isPaid, paid: isPaid, status }), { status: 200, headers: corsHeaders });
    }

    // Fallback para Mercado Pago
    if (isMercadoPago) {
      console.log('[CHECK-PAYMENT-STATUS] 💳 Checking Mercado Pago status API');
      const mpToken = settings?.find(s => s.key === 'MERCADO_PAGO_ACCESS_TOKEN')?.value || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      
      if (!mpToken) {
        return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
      }

      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentIdStr}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });

      if (!mpResp.ok) {
        return new Response(JSON.stringify({ error: "Erro ao consultar Mercado Pago", isPaid: false }), { status: 502, headers: corsHeaders });
      }

      const mpData = await mpResp.json();
      const isPaid = mpData.status === 'approved';
      return new Response(JSON.stringify({ isPaid, paid: isPaid, status: mpData.status }), { status: 200, headers: corsHeaders });
    }

    // Fallback para Abacate Pay
    console.log('[CHECK-PAYMENT-STATUS] 🥑 Checking Abacate Pay status API');
    const abacateToken = settings?.find(s => s.key === 'ABACATE_API_KEY')?.value || Deno.env.get("ABACATE_API_KEY");
    
    if (!abacateToken) {
      return new Response(JSON.stringify({ error: "Token Abacate Pay não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
    }

    const abResp = await fetch(`https://api.abacatepay.com/billing/${paymentIdStr}`, {
      headers: { 'Authorization': `Bearer ${abacateToken}` }
    });

    if (!abResp.ok) {
      return new Response(JSON.stringify({ error: "Erro ao consultar Abacate Pay", isPaid: false }), { status: 502, headers: corsHeaders });
    }

    const abData = await abResp.json();
    const isPaid = abData.status === 'PAID';
    return new Response(JSON.stringify({ isPaid, paid: isPaid, status: abData.status }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] ❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
