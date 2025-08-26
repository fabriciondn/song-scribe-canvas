// Função utilitária para checar status do pagamento com retries
async function verificarStatusPagamento(pixId: string, token: string, tentativas = 5, intervalo = 3000): Promise<{status: string, data: any}> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const url = `https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`;
      const tokenPreview = token ? `${token.slice(0, 4)}...${token.slice(-4)}` : 'undefined';
      console.log(`[verificarStatusPagamento] Tentativa ${i+1} - URL: ${url}`);
      console.log(`[verificarStatusPagamento] Token (prefix/suffix): ${tokenPreview}`);
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(`[verificarStatusPagamento] Resposta completa da API:`, data);
      if (response.ok) {
        if (data.data && data.data.status === "PAID") {
          console.log("[verificarStatusPagamento] Pagamento confirmado!");
          return { status: "PAID", data };
        } else {
          console.log(`[verificarStatusPagamento] Tentativa ${i+1}: Pagamento pendente. Status: ${data.data ? data.data.status : 'Status não encontrado'}`);
        }
      } else {
        console.error(`[verificarStatusPagamento] Erro na requisição: status ${response.status} -`, data.error || response.statusText);
        return { status: "ERROR", data };
      }
    } catch (error) {
      console.error("[verificarStatusPagamento] Erro ao fazer a requisição:", error);
      return { status: "ERROR", data: error };
    }
    // Aguarda antes de tentar novamente
    await new Promise(resolve => setTimeout(resolve, intervalo));
  }
  console.log("[verificarStatusPagamento] Número máximo de tentativas atingido. Pagamento não confirmado.");
  return { status: "PENDING", data: null };
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[CHECK-PAYMENT-STATUS] Function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize service role client for database operations (always available)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      // Initialize Supabase client with user session for authentication
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      // Get the user from the authorization header
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      
      if (authUser && !userError) {
        user = authUser;
        console.log('[CHECK-PAYMENT-STATUS] User authenticated', { userId: user.id });
      } else {
        console.log('[CHECK-PAYMENT-STATUS] Authentication failed, but continuing...', userError?.message);
      }
    } else {
      console.log('[CHECK-PAYMENT-STATUS] No authorization header, continuing without auth...');
    }

    // Parse request body
    const body = await req.json();
    const { paymentId, simulate } = body;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PAYMENT-STATUS] Checking payment status', { paymentId, simulate });

    // Check payment status with Abacate Pay API
    const abacateApiKey = Deno.env.get('ABACATE_API_KEY');
    if (!abacateApiKey) {
      console.error('[CHECK-PAYMENT-STATUS] Missing ABACATE_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    type PixPayment = {
      id: string;
      status: string;
      amount?: number;
      expiresAt?: string;
    };
    let payment: PixPayment | null = null;
    let isPaymentConfirmed = false;

    console.log('[CHECK-PAYMENT-STATUS] Processing payment check', { paymentId, simulate });

    // If simulate is true, simulate a successful payment for development
    if (simulate) {
      console.log('[CHECK-PAYMENT-STATUS] Using simulation mode - creating mock paid payment');
      
      // Create a mock payment object for simulation
      payment = {
        id: paymentId,
        status: 'PAID',
        amount: 14.99,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      isPaymentConfirmed = true;
    } else {
      // Usar função com tentativas e logs detalhados
      const resultado = await verificarStatusPagamento(paymentId, abacateApiKey, 5, 3000);
      if (resultado.status === "PAID") {
        payment = {
          id: paymentId,
          status: "PAID",
          amount: resultado.data?.data?.amount,
          expiresAt: resultado.data?.data?.expiresAt
        };
        isPaymentConfirmed = true;
      } else if (resultado.status === "PENDING") {
        payment = {
          id: paymentId,
          status: "PENDING"
        };
        isPaymentConfirmed = false;
      } else {
        // erro
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to check payment status',
            details: resultado.data
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (payment) {
      console.log('[CHECK-PAYMENT-STATUS] Payment found', { 
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        isPaymentConfirmed
      });
    } else {
      console.log('[CHECK-PAYMENT-STATUS] Payment not found');
    }
    
    // Handle payment confirmation based on type
    const paymentType = body.type || 'subscription'; // Default to subscription for backwards compatibility

  if (isPaymentConfirmed) {
    console.log('[CHECK-PAYMENT-STATUS] Payment confirmed, processing...', { paymentType, userId: user?.id });
    if (paymentType === 'credits') {
      // Buscar transação pelo payment_id
      let { data: transaction, error: transactionError } = await supabaseServiceClient
        .from('credit_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
      if (transactionError || !transaction) {
        console.error('[CHECK-PAYMENT-STATUS] Credit transaction not found:', transactionError);
      } else {
        const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
        // Buscar perfil do usuário pelo user_id da transação
        const { data: currentProfile, error: profileError } = await supabaseServiceClient
          .from('profiles')
          .select('credits')
          .eq('id', transaction.user_id)
          .single();
        if (!profileError && currentProfile) {
          const newCreditsTotal = (currentProfile.credits || 0) + totalCredits;
          // Atualizar créditos do usuário
          const { error: creditsError } = await supabaseServiceClient
            .from('profiles')
            .update({ credits: newCreditsTotal })
            .eq('id', transaction.user_id);
          if (creditsError) {
            console.error('[CHECK-PAYMENT-STATUS] Error adding credits:', creditsError);
          } else {
            // Atualizar status da transação
            const { error: transactionUpdateError } = await supabaseServiceClient
              .from('credit_transactions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', transaction.id);
            if (transactionUpdateError) {
              console.error('[CHECK-PAYMENT-STATUS] Failed to update transaction status:', transactionUpdateError);
            } else {
              console.log('[CHECK-PAYMENT-STATUS] Transaction status updated successfully');
            }
            console.log('[CHECK-PAYMENT-STATUS] Credits added successfully:', { totalCredits, newCreditsTotal });
          }
        }
      }
    } else {
      // Processar assinatura
      console.log('[CHECK-PAYMENT-STATUS] Processing subscription...');
      const now = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Add 1 month
      // Buscar assinatura pelo payment_id
      const { data: subscription } = await supabaseServiceClient
        .from('subscriptions')
        .select('user_id')
        .eq('payment_provider_subscription_id', paymentId)
        .maybeSingle();
      if (subscription && subscription.user_id) {
        const { error: updateError } = await supabaseServiceClient
          .from('subscriptions')
          .update({ 
            status: 'active',
            plan_type: 'pro',
            started_at: now,
            expires_at: expiresAt.toISOString(),
            payment_provider: 'abacate_pay',
            payment_provider_subscription_id: paymentId,
            amount: 14.99,
            currency: 'BRL',
            updated_at: now
          })
          .eq('user_id', subscription.user_id);
        if (updateError) {
          console.error('[CHECK-PAYMENT-STATUS] Failed to update subscription', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('[CHECK-PAYMENT-STATUS] Subscription activated successfully');
      }
    }
  }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: payment ? payment.status : 'NOT_FOUND',
        isPaid: isPaymentConfirmed,
        expiresAt: payment ? payment.expiresAt : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});