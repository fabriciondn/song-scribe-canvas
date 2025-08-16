import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditPaymentRequest {
  credits: number;
  bonusCredits: number;
  unitPrice: number;
  totalAmount: number;
}

serve(async (req) => {
  console.log('🚀 create-credits-payment function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Create Supabase client with service role for database operations
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('❌ Authentication error:', authError);
      throw new Error("User not authenticated");
    }

    const user = data.user;
    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body: CreditPaymentRequest = await req.json();
    const { credits, bonusCredits, unitPrice, totalAmount } = body;

    console.log('💳 Payment details:', {
      userId: user.id,
      credits,
      bonusCredits,
      unitPrice,
      totalAmount
    });

    // Validate input
    if (!credits || credits < 1 || !totalAmount || totalAmount < 0) {
      throw new Error("Invalid payment details");
    }

    // Get Abacate API key
    const abacateApiKey = Deno.env.get("ABACATE_API_KEY");
    if (!abacateApiKey) {
      console.error('❌ Missing ABACATE_API_KEY');
      throw new Error("Payment service configuration error");
    }

    // Create PIX payment with Abacate
    console.log('🔄 Creating PIX payment with Abacate...');
    
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacateApiKey}`
      },
      body: JSON.stringify({
        frequency: 'one-time',
        methods: ['pix'],
        products: [
          {
            externalId: `credits-${user.id}-${Date.now()}`,
            name: `${credits} Créditos${bonusCredits > 0 ? ` + ${bonusCredits} Bônus` : ''}`,
            description: `Compra de ${credits} créditos${bonusCredits > 0 ? ` com ${bonusCredits} créditos bônus` : ''}`,
            quantity: 1,
            price: Math.round(totalAmount * 100) // Convert to cents
          }
        ],
        returnUrl: `${req.headers.get("origin")}/dashboard`,
        completionUrl: `${req.headers.get("origin")}/dashboard`
      })
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('❌ Abacate API error:', errorText);
      throw new Error(`Payment service error: ${abacateResponse.status}`);
    }

    const abacateData = await abacateResponse.json();
    console.log('✅ Abacate response:', abacateData);

    if (!abacateData.id || !abacateData.paymentGatewayAttributes?.pix?.qrCode) {
      console.error('❌ Invalid Abacate response:', abacateData);
      throw new Error("Invalid payment response");
    }

    const paymentId = abacateData.id;
    const qrCode = abacateData.paymentGatewayAttributes.pix.qrCode;
    const qrCodeUrl = abacateData.paymentGatewayAttributes.pix.qrCodeUrl;

    // Save credit transaction to database
    console.log('💾 Saving credit transaction to database...');
    
    const { error: insertError } = await supabaseService
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        credits_purchased: credits,
        bonus_credits: bonusCredits,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_id: paymentId,
        status: 'pending'
      });

    if (insertError) {
      console.error('❌ Database error:', insertError);
      throw new Error("Failed to save transaction");
    }

    console.log('✅ Credit transaction saved successfully');

    // Return PIX payment data
    return new Response(
      JSON.stringify({
        payment_id: paymentId,
        qr_code: qrCode,
        qr_code_url: qrCodeUrl,
        amount: totalAmount,
        credits: credits,
        bonusCredits: bonusCredits,
        finalCredits: credits + bonusCredits
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});