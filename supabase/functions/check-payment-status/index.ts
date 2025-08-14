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

    // Initialize Supabase client
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

    const checkUrl = `https://api.abacatepay.com/v1/pixQrCode/check/${paymentId}`;
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkResponse.ok) {
      console.error('[CHECK-PAYMENT-STATUS] Abacate API error', checkResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to check payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData = await checkResponse.json();
    console.log('[CHECK-PAYMENT-STATUS] Payment status checked', { paymentData });

    // Check if payment is confirmed (not PENDING)
    const isPaymentConfirmed = paymentData.data.status !== 'PENDING';
    
    if (isPaymentConfirmed) {
      // Update subscription status to active
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('payment_provider_subscription_id', paymentId);

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
        paymentStatus: paymentData.data.status,
        isPaid: isPaymentConfirmed,
        expiresAt: paymentData.data.expiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CHECK-PAYMENT-STATUS] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});