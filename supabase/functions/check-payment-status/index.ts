
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[CHECK-PAYMENT-STATUS] Function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verificar autenticação opcional
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
      } catch (authError) {
        console.log('[CHECK-PAYMENT-STATUS] Authentication failed, but continuing...', authError?.message || 'Auth session missing!');
      }
    } else {
      console.log('[CHECK-PAYMENT-STATUS] Authentication failed, but continuing...', 'Auth session missing!');
    }

    const body = await req.json();
    const { paymentId, simulate } = body;

    console.log('[CHECK-PAYMENT-STATUS] Checking payment status', { paymentId, simulate });

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se for simulação, retornar pagamento como pago
    if (simulate === true) {
      console.log('[CHECK-PAYMENT-STATUS] Simulation mode - returning paid status');
      return new Response(
        JSON.stringify({ isPaid: true, paid: true, status: 'approved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é um payment ID do Mercado Pago (começa com número)
    const isMercadoPagoPayment = /^\d+$/.test(paymentId.toString());
    
    if (isMercadoPagoPayment) {
      console.log('[CHECK-PAYMENT-STATUS] Processing Mercado Pago payment check');
      
      const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mercadoPagoAccessToken) {
        console.error('[CHECK-PAYMENT-STATUS] Missing MERCADO_PAGO_ACCESS_TOKEN');
        return new Response(
          JSON.stringify({ 
            error: "Serviço de verificação temporariamente indisponível",
            isPaid: false,
            paid: false 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Consultar status do pagamento no Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!paymentResponse.ok) {
        console.error('[CHECK-PAYMENT-STATUS] Error fetching payment from Mercado Pago:', paymentResponse.status);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao consultar status do pagamento",
            isPaid: false,
            paid: false 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentData = await paymentResponse.json();
      console.log('[CHECK-PAYMENT-STATUS] Mercado Pago payment status:', paymentData.status);

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
    } else {
      // Assumir que é Abacate Pay (formato diferente de ID)
      console.log('[CHECK-PAYMENT-STATUS] Processing Abacate Pay payment check');
      
      const abacatePayApiToken = Deno.env.get("ABACATE_PAY_API_TOKEN");
      if (!abacatePayApiToken) {
        console.error('[CHECK-PAYMENT-STATUS] Missing ABACATE_PAY_API_TOKEN');
        return new Response(
          JSON.stringify({ 
            error: "Serviço de verificação temporariamente indisponível",
            isPaid: false,
            paid: false 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Consultar status do pagamento no Abacate Pay
      const paymentResponse = await fetch(`https://api.abacatepay.com/billing/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${abacatePayApiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!paymentResponse.ok) {
        console.error('[CHECK-PAYMENT-STATUS] Error fetching payment from Abacate Pay:', paymentResponse.status);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao consultar status do pagamento",
            isPaid: false,
            paid: false 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentData = await paymentResponse.json();
      console.log('[CHECK-PAYMENT-STATUS] Abacate Pay payment status:', paymentData.status);

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
    }

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        isPaid: false,
        paid: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
