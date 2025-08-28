
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[CHECK-PAYMENT-STATUS] Function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

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

    const body = await req.json();
    const { paymentId, simulate } = body;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PAYMENT-STATUS] Checking payment status', { paymentId, simulate });

    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      console.error('[CHECK-PAYMENT-STATUS] Missing MERCADO_PAGO_ACCESS_TOKEN');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    type Payment = {
      id: string;
      status: string;
      amount?: number;
      date_approved?: string;
    };
    let payment: Payment | null = null;
    let isPaymentConfirmed = false;

    console.log('[CHECK-PAYMENT-STATUS] Processing payment check', { paymentId, simulate });

    if (simulate) {
      console.log('[CHECK-PAYMENT-STATUS] Using simulation mode - creating mock paid payment');
      
      payment = {
        id: paymentId,
        status: 'approved',
        amount: 14.99,
        date_approved: new Date().toISOString()
      };
      isPaymentConfirmed = true;
    } else {
      // Consultar pagamento no Mercado Pago
      try {
        console.log('[CHECK-PAYMENT-STATUS] Consultando Mercado Pago API...');
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mercadoPagoAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const paymentData = await paymentResponse.json();
        console.log('[CHECK-PAYMENT-STATUS] Resposta do Mercado Pago:', paymentData);

        if (paymentResponse.ok && paymentData.id) {
          payment = {
            id: paymentData.id.toString(),
            status: paymentData.status,
            amount: paymentData.transaction_amount,
            date_approved: paymentData.date_approved
          };
          isPaymentConfirmed = paymentData.status === 'approved';
        } else {
          console.error('[CHECK-PAYMENT-STATUS] Erro na consulta:', paymentData);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to check payment status',
              details: paymentData
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('[CHECK-PAYMENT-STATUS] Erro na requisição:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Network error checking payment',
            details: error.message
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
    
    const paymentType = body.type || 'credits';

    if (isPaymentConfirmed) {
      console.log('[CHECK-PAYMENT-STATUS] Payment confirmed, processing...', { paymentType, userId: user?.id });
      
      if (paymentType === 'credits') {
        const { data: transaction, error: transactionError } = await supabaseServiceClient
          .from('credit_transactions')
          .select('*')
          .eq('payment_id', paymentId)
          .eq('status', 'pending')
          .maybeSingle();

        if (transactionError || !transaction) {
          console.log('[CHECK-PAYMENT-STATUS] Transaction not found or already processed:', transactionError);
        } else {
          const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
          
          const { data: currentProfile, error: profileError } = await supabaseServiceClient
            .from('profiles')
            .select('credits')
            .eq('id', transaction.user_id)
            .single();

          if (!profileError && currentProfile) {
            const newCreditsTotal = (currentProfile.credits || 0) + totalCredits;
            
            const { error: creditsError } = await supabaseServiceClient
              .from('profiles')
              .update({ credits: newCreditsTotal })
              .eq('id', transaction.user_id);

            if (creditsError) {
              console.error('[CHECK-PAYMENT-STATUS] Error adding credits:', creditsError);
            } else {
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
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: payment ? payment.status : 'NOT_FOUND',
        isPaid: isPaymentConfirmed,
        date_approved: payment ? payment.date_approved : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
