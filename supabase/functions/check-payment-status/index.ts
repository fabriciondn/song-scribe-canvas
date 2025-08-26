// Função utilitária para checar status do pagamento com retries
async function verificarStatusPagamento(pixId: string, token: string, tentativas = 3, intervalo = 2000): Promise<{status: string, data: any}> {
  for (let i = 0; i < tentativas; i++) {
    try {
      // URL corrigida para usar /info em vez de /check
      const url = `https://api.abacatepay.com/v1/pixQrCode/info/${pixId}`;
      console.log(`[verificarStatusPagamento] Tentativa ${i+1}/${tentativas} - URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`[verificarStatusPagamento] Resposta da API (tentativa ${i+1}):`, {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (response.ok && data.data) {
        const paymentStatus = data.data.status;
        console.log(`[verificarStatusPagamento] Status do pagamento: ${paymentStatus}`);
        
        if (paymentStatus === "PAID") {
          console.log("[verificarStatusPagamento] ✅ Pagamento confirmado!");
          return { status: "PAID", data };
        } else {
          console.log(`[verificarStatusPagamento] ⏳ Pagamento pendente (${paymentStatus})`);
        }
      } else {
        console.error(`[verificarStatusPagamento] ❌ Erro na API: ${response.status}`, data);
        if (i === tentativas - 1) {
          return { status: "ERROR", data };
        }
      }
    } catch (error) {
      console.error(`[verificarStatusPagamento] ❌ Erro na requisição (tentativa ${i+1}):`, error);
      if (i === tentativas - 1) {
        return { status: "ERROR", data: error };
      }
    }
    
    // Aguarda antes de tentar novamente (exceto na última tentativa)
    if (i < tentativas - 1) {
      console.log(`[verificarStatusPagamento] ⏱️ Aguardando ${intervalo}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, intervalo));
    }
  }
  
  console.log("[verificarStatusPagamento] ⚠️ Número máximo de tentativas atingido. Pagamento ainda pendente.");
  return { status: "PENDING", data: null };
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[CHECK-PAYMENT-STATUS] 🚀 Function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('[CHECK-PAYMENT-STATUS] 📝 Service client initialized');

    // Parse request body
    const body = await req.json();
    const { paymentId, simulate } = body;

    if (!paymentId) {
      console.log('[CHECK-PAYMENT-STATUS] ❌ Missing payment ID');
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PAYMENT-STATUS] 💳 Checking payment status', { paymentId, simulate });

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
      console.log('[CHECK-PAYMENT-STATUS] 🔍 Verificando status do pagamento via API...');
      const resultado = await verificarStatusPagamento(paymentId, abacateApiKey, 3, 2000);
      
      if (resultado.status === "PAID") {
        console.log('[CHECK-PAYMENT-STATUS] ✅ Pagamento confirmado pela API');
        payment = {
          id: paymentId,
          status: "PAID",
          amount: resultado.data?.data?.amount || 0,
          expiresAt: resultado.data?.data?.expiresAt
        };
        isPaymentConfirmed = true;
      } else if (resultado.status === "PENDING") {
        console.log('[CHECK-PAYMENT-STATUS] ⏳ Pagamento ainda pendente');
        payment = {
          id: paymentId,
          status: "PENDING"
        };
        isPaymentConfirmed = false;
      } else {
        console.log('[CHECK-PAYMENT-STATUS] ❌ Erro ao verificar pagamento:', resultado.data);
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
    console.log('[CHECK-PAYMENT-STATUS] 💰 Pagamento confirmado, processando créditos...');
    
    if (paymentType === 'credits') {
      // Buscar transação pelo payment_id
      console.log('[CHECK-PAYMENT-STATUS] 🔍 Buscando transação no banco...');
      const { data: transaction, error: transactionError } = await supabaseServiceClient
        .from('credit_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
        
      if (transactionError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Erro ao buscar transação:', transactionError);
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction not found in database' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!transaction) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Transação não encontrada para payment_id:', paymentId);
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (transaction.status === 'completed') {
        console.log('[CHECK-PAYMENT-STATUS] ✅ Transação já foi processada anteriormente');
        return new Response(
          JSON.stringify({ success: true, paymentStatus: 'PAID', isPaid: true, message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
      console.log('[CHECK-PAYMENT-STATUS] 💳 Processando créditos:', {
        userId: transaction.user_id,
        creditsPurchased: transaction.credits_purchased,
        bonusCredits: transaction.bonus_credits || 0,
        totalCredits
      });
      
      // Buscar perfil do usuário
      const { data: currentProfile, error: profileError } = await supabaseServiceClient
        .from('profiles')
        .select('credits')
        .eq('id', transaction.user_id)
        .single();
        
      if (profileError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Erro ao buscar perfil do usuário:', profileError);
        return new Response(
          JSON.stringify({ success: false, error: 'User profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const currentCredits = currentProfile.credits || 0;
      const newCreditsTotal = currentCredits + totalCredits;
      
      console.log('[CHECK-PAYMENT-STATUS] 📊 Atualizando créditos:', {
        currentCredits,
        totalCredits,
        newCreditsTotal
      });
      
      // Atualizar créditos do usuário
      const { error: creditsError } = await supabaseServiceClient
        .from('profiles')
        .update({ credits: newCreditsTotal })
        .eq('id', transaction.user_id);
        
      if (creditsError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Erro ao atualizar créditos:', creditsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Atualizar status da transação
      const { error: transactionUpdateError } = await supabaseServiceClient
        .from('credit_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction.id);
        
      if (transactionUpdateError) {
        console.error('[CHECK-PAYMENT-STATUS] ❌ Erro ao atualizar status da transação:', transactionUpdateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update transaction status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[CHECK-PAYMENT-STATUS] ✅ Créditos adicionados com sucesso!', {
        userId: transaction.user_id,
        creditsAdded: totalCredits,
        newTotal: newCreditsTotal
      });
      
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