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

    let payment = null;
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
      // Use correct Abacate Pay API endpoint for status check
      // GET https://api.abacatepay.com/v1/pixQrCode/check?externalId=<id>
      const checkUrl = `https://api.abacatepay.com/v1/pixQrCode/check?externalId=${encodeURIComponent(paymentId)}`;
      console.log('[CHECK-PAYMENT-STATUS] Calling Abacate API', { checkUrl });

      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${abacateApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[CHECK-PAYMENT-STATUS] API response status', {
        status: checkResponse.status,
        statusText: checkResponse.statusText
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error('[CHECK-PAYMENT-STATUS] Abacate API error', {
          status: checkResponse.status,
          statusText: checkResponse.statusText,
          body: errorText
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to check payment status',
            details: `API returned ${checkResponse.status}: ${checkResponse.statusText}`
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentData = await checkResponse.json();
      console.log('[CHECK-PAYMENT-STATUS] Payment data received', paymentData);

      if (paymentData.data) {
        payment = paymentData.data;
      } else {
        console.log('[CHECK-PAYMENT-STATUS] Payment not found or invalid response structure', { paymentId, response: paymentData });
        return new Response(
          JSON.stringify({
            success: true,
            paymentStatus: 'NOT_FOUND',
            isPaid: false,
            expiresAt: null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if payment is confirmed (status is not "PENDING")
      isPaymentConfirmed = payment.status === 'PAID' || payment.status === 'CONFIRMED';
    }

    console.log('[CHECK-PAYMENT-STATUS] Payment found', { 
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      isPaymentConfirmed
    });
    
    // Handle payment confirmation based on type
    const paymentType = body.type || 'subscription'; // Default to subscription for backwards compatibility

    if (isPaymentConfirmed && user) {
      console.log('[CHECK-PAYMENT-STATUS] Payment confirmed, processing...', { paymentType, userId: user.id });
      
      if (paymentType === 'credits') {
        // Handle credit purchase confirmation
        console.log('[CHECK-PAYMENT-STATUS] Processing credit purchase...');
        
        // Get credit transaction details
        const { data: transaction, error: transactionError } = await supabaseServiceClient
          .from('credit_transactions')
          .select('*')
          .eq('payment_id', paymentId)
          .eq('user_id', user.id)
          .single();
        
        if (transactionError || !transaction) {
          console.error('[CHECK-PAYMENT-STATUS] Credit transaction not found:', transactionError);
        } else {
          const totalCredits = transaction.credits_purchased + (transaction.bonus_credits || 0);
          
          // Get current user credits
          const { data: currentProfile, error: profileError } = await supabaseServiceClient
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();
          
          if (!profileError && currentProfile) {
            const newCreditsTotal = (currentProfile.credits || 0) + totalCredits;
            
            // Update user credits
            const { error: creditsError } = await supabaseServiceClient
              .from('profiles')
              .update({ credits: newCreditsTotal })
              .eq('id', user.id);
            
            if (creditsError) {
              console.error('[CHECK-PAYMENT-STATUS] Error adding credits:', creditsError);
            } else {
              // Update transaction status
              await supabaseServiceClient
                .from('credit_transactions')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', transaction.id);
              
              console.log('[CHECK-PAYMENT-STATUS] Credits added successfully:', { totalCredits, newCreditsTotal });
            }
          }
        }
      } else {
        // Handle subscription confirmation (existing logic)
        console.log('[CHECK-PAYMENT-STATUS] Processing subscription...');
        
        const now = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // Add 1 month
        
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
          .eq('user_id', user.id);

        if (updateError) {
          console.error('[CHECK-PAYMENT-STATUS] Failed to update subscription', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[CHECK-PAYMENT-STATUS] Subscription activated successfully');
      }
    } else if (isPaymentConfirmed && !user) {
      console.log('[CHECK-PAYMENT-STATUS] Payment confirmed but no user authenticated - not updated');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: payment.status,
        isPaid: isPaymentConfirmed,
        expiresAt: payment.expiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})