
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
        console.log('[CHECK-PAYMENT-STATUS] ⚠️ Auth failed, continuing without user:', authError?.message);
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

    // Primeiro verificar no banco se já foi processado
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: transaction } = await supabaseService
      .from('credit_transactions')
      .select('status')
      .eq('payment_id', paymentId.toString())
      .single();

    if (transaction?.status === 'completed') {
      console.log('[CHECK-PAYMENT-STATUS] ✅ Payment already processed in database');
      return new Response(
        JSON.stringify({ isPaid: true, paid: true, status: 'completed' }),
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

    // Verificar se é um payment ID do Mercado Pago
    const isMercadoPagoPayment = /^\d+$/.test(paymentId.toString());
    
    if (isMercadoPagoPayment) {
      console.log('[CHECK-PAYMENT-STATUS] 💳 Checking Mercado Pago payment');
      
      // Buscar token do Mercado Pago
      let mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      
      // Se não encontrar, tentar outras variações
      if (!mercadoPagoToken) {
        mercadoPagoToken = Deno.env.get("Access Token mercado pago");
      }
      
      if (!mercadoPagoToken) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Missing Mercado Pago token');
        return new Response(
          JSON.stringify({ 
            error: "Token do Mercado Pago não configurado",
            isPaid: false,
            paid: false 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[CHECK-PAYMENT-STATUS] 📡 Consulting Mercado Pago API...');

      try {
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentResponse.ok) {
          console.error('[CHECK-PAYMENT-STATUS] ❌ Mercado Pago API error:', paymentResponse.status, paymentResponse.statusText);
          return new Response(
            JSON.stringify({ 
              error: `Erro na API do Mercado Pago: ${paymentResponse.status}`,
              isPaid: false,
              paid: false 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const paymentData = await paymentResponse.json();
        console.log('[CHECK-PAYMENT-STATUS] 📊 Mercado Pago response:', { 
          id: paymentData.id, 
          status: paymentData.status,
          status_detail: paymentData.status_detail 
        });

        const isPaid = paymentData.status === 'approved';
        
        return new Response(
          JSON.stringify({ 
            isPaid, 
            paid: isPaid, 
            status: paymentData.status,
            mercadoPagoData: {
              id: paymentData.id,
              status: paymentData.status,
              status_detail: paymentData.status_detail
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (fetchError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Network error:', fetchError);
        return new Response(
          JSON.stringify({ 
            error: "Erro de rede ao consultar Mercado Pago",
            isPaid: false,
            paid: false 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Assumir que é Abacate Pay
      console.log('[CHECK-PAYMENT-STATUS] 🥑 Checking Abacate Pay payment');
      
      const abacatePayApiToken = Deno.env.get("ABACATE_API_KEY");
      if (!abacatePayApiToken) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Missing Abacate Pay token');
        return new Response(
          JSON.stringify({ 
            error: "Token do Abacate Pay não configurado",
            isPaid: false,
            paid: false 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const paymentResponse = await fetch(`https://api.abacatepay.com/billing/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${abacatePayApiToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentResponse.ok) {
          console.error('[CHECK-PAYMENT-STATUS] ❌ Abacate Pay API error:', paymentResponse.status);
          return new Response(
            JSON.stringify({ 
              error: `Erro na API do Abacate Pay: ${paymentResponse.status}`,
              isPaid: false,
              paid: false 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const paymentData = await paymentResponse.json();
        console.log('[CHECK-PAYMENT-STATUS] 📊 Abacate Pay response:', { 
          id: paymentData.id, 
          status: paymentData.status 
        });

        const isPaid = paymentData.status === 'PAID';
        
        return new Response(
          JSON.stringify({ 
            isPaid, 
            paid: isPaid, 
            status: paymentData.status,
            abacateData: {
              id: paymentData.id,
              status: paymentData.status
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (fetchError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Network error:', fetchError);
        return new Response(
          JSON.stringify({ 
            error: "Erro de rede ao consultar Abacate Pay",
            isPaid: false,
            paid: false 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] ❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        isPaid: false,
        paid: false,
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
