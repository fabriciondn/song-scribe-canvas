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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[CHECK-PAYMENT-STATUS] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Initialize service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the authorization header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.log('[CHECK-PAYMENT-STATUS] Invalid or missing user', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PAYMENT-STATUS] User authenticated', { userId: user.id });

    // Parse request body
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHECK-PAYMENT-STATUS] Checking payment status', { paymentId });

    // Check payment status with Abacate Pay API
    const abacateApiKey = Deno.env.get('ABACATE_API_KEY');
    if (!abacateApiKey) {
      console.error('[CHECK-PAYMENT-STATUS] Missing ABACATE_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all payments to find the specific one
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
    const payment = paymentsData.data?.find((p: any) => p.id === paymentId);
    
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

    console.log('[CHECK-PAYMENT-STATUS] Payment found', { 
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount
    });

    // Check if payment is confirmed (status is not "PENDING")
    const isPaymentConfirmed = payment.status !== 'PENDING';
    console.log('[CHECK-PAYMENT-STATUS] Payment confirmation check', { 
      status: payment.status, 
      isPaymentConfirmed 
    });
    
    if (isPaymentConfirmed) {
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