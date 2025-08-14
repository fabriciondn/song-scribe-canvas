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

    // If simulate is true, use simulation API for development
    if (simulate) {
      console.log('[CHECK-PAYMENT-STATUS] Using simulation mode');
      
      const simulateUrl = 'https://api.abacatepay.com/v1/pixQrCode/simulate-payment';
      const simulateResponse = await fetch(simulateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${abacateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: {} })
      });

      if (simulateResponse.ok) {
        const simulateData = await simulateResponse.json();
        console.log('[CHECK-PAYMENT-STATUS] Simulation response', simulateData);
        
        // Create a mock payment object for simulation
        payment = {
          id: paymentId,
          status: 'PAID', // Simulate successful payment
          amount: 14.99,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        isPaymentConfirmed = true;
      } else {
        console.error('[CHECK-PAYMENT-STATUS] Simulation API error', simulateResponse.status);
        // Fallback to regular API check
      }
    }

    // If not simulating or simulation failed, use regular API
    if (!payment) {
      const checkUrl = `https://api.abacatepay.com/v1/pixQrCode`;
      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${abacateApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        console.error('[CHECK-PAYMENT-STATUS] Abacate API error', {
          status: checkResponse.status,
          statusText: checkResponse.statusText
        });
        return new Response(
          JSON.stringify({ error: 'Failed to check payment status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentsData = await checkResponse.json();
      console.log('[CHECK-PAYMENT-STATUS] Payments received', { 
        totalPayments: paymentsData.data?.length || 0,
        searchingForId: paymentId
      });

      // Find the specific payment by ID
      payment = paymentsData.data?.find((p: any) => p.id === paymentId);
      
      if (!payment) {
        console.log('[CHECK-PAYMENT-STATUS] Payment not found', { paymentId });
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
      isPaymentConfirmed = payment.status !== 'PENDING';
    }

    console.log('[CHECK-PAYMENT-STATUS] Payment found', { 
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      isPaymentConfirmed
    });
    
    if (isPaymentConfirmed && user) {
      // Update subscription to Pro active status using service role client
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
    } else if (isPaymentConfirmed && !user) {
      console.log('[CHECK-PAYMENT-STATUS] Payment confirmed but no user authenticated - subscription not updated');
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