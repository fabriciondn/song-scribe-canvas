
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
    // Verificar autenticação
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );
        
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        userId = data.user?.id || null;
        console.log('[CHECK-PAYMENT-STATUS] ✅ User authenticated:', userId);
      } catch (authError) {
        console.log('[CHECK-PAYMENT-STATUS] ⚠️ Auth failed, continuing without user:', authError instanceof Error ? authError.message : 'Unknown error');
      }
    }

    const body = await req.json();
    const { paymentId, simulate } = body;

    console.log('[CHECK-PAYMENT-STATUS] 📋 Checking payment:', { paymentId, simulate, userId });

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required", isPaid: false, paid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro verificar no banco se já foi processado (PRIORIDADE MÁXIMA)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Usar maybeSingle para evitar erros se não encontrar
    const { data: transaction, error: transactionError } = await supabaseService
      .from('credit_transactions')
      .select('status, credits_purchased, bonus_credits')
      .eq('payment_id', paymentId.toString())
      .maybeSingle();

    console.log('[CHECK-PAYMENT-STATUS] 🔍 Database check:', { 
      found: !!transaction, 
      status: transaction?.status,
      error: transactionError?.message 
    });

    // Se a transação já foi completada no banco, retornar imediatamente
    // Não precisamos checar a API do Mercado Pago pois o webhook já processou
    if (transaction?.status === 'completed') {
      const creditsAdded = (transaction.credits_purchased || 0) + (transaction.bonus_credits || 0);
      console.log('[CHECK-PAYMENT-STATUS] ✅ Payment already processed in database, credits:', creditsAdded);
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

    // Se for simulação, retornar pagamento como pago
    if (simulate === true) {
      console.log('[CHECK-PAYMENT-STATUS] 🧪 Simulation mode - returning paid status');
      return new Response(
        JSON.stringify({ isPaid: true, paid: true, status: 'approved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é um payment ID do Mercado Pago (apenas números)
    const isMercadoPagoPayment = /^\d+$/.test(paymentId.toString());
    const isOpenPixPayment = paymentId.toString().includes('_'); // correlationID da OpenPix tem '_'
    
    if (isMercadoPagoPayment) {
      console.log('[CHECK-PAYMENT-STATUS] 💳 Checking Mercado Pago payment');
      // ... keep existing Mercado Pago logic
      let mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("Access Token mercado pago");
      if (!mercadoPagoToken) {
        return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
      }
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mercadoPagoToken}` }
      });
      const mpData = await mpResp.json();
      const isPaid = mpData.status === 'approved';
      return new Response(JSON.stringify({ isPaid, paid: isPaid, status: mpData.status }), { status: 200, headers: corsHeaders });
    } else if (isOpenPixPayment) {
      console.log('[CHECK-PAYMENT-STATUS] 💎 Checking OpenPix payment');
      const openPixAppId = Deno.env.get("OPENPIX_APP_ID");
      if (!openPixAppId) {
        return new Response(JSON.stringify({ error: "OpenPix App ID não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
      }
      const opResp = await fetch(`https://api.openpix.com.br/api/v1/charge/${paymentId}`, {
        headers: { 'Authorization': openPixAppId }
      });
      const opData = await opResp.json();
      const isPaid = opData.charge?.status === 'COMPLETED';
      return new Response(JSON.stringify({ isPaid, paid: isPaid, status: opData.charge?.status }), { status: 200, headers: corsHeaders });
    } else {
      // Assumir que é Abacate Pay
      console.log('[CHECK-PAYMENT-STATUS] 🥑 Checking Abacate Pay payment');
      // ... keep existing Abacate Pay logic
      const abacatePayApiToken = Deno.env.get("ABACATE_API_KEY");
      if (!abacatePayApiToken) {
        return new Response(JSON.stringify({ error: "Token Abacate Pay não configurado", isPaid: false }), { status: 503, headers: corsHeaders });
      }
      const abResp = await fetch(`https://api.abacatepay.com/billing/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${abacatePayApiToken}` }
      });
      const abData = await abResp.json();
      const isPaid = abData.status === 'PAID';
      return new Response(JSON.stringify({ isPaid, paid: isPaid, status: abData.status }), { status: 200, headers: corsHeaders });
    }


  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        isPaid: false,
        paid: false,
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
