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
  customerData?: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
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
    const { credits, bonusCredits, unitPrice, totalAmount, customerData } = body;

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
    
    const requestBody = {
      metadata: {
        externalId: `credits-${user.id}-${Date.now()}`
      },
      amount: Math.round(totalAmount * 100), // Convert to cents
      expiresIn: 3600, // 1 hour
      description: `${credits} Créditos${bonusCredits > 0 ? ` + ${bonusCredits} Bônus` : ''}`,
      customer: customerData ? {
        name: customerData.name,
        email: customerData.email,
        cpf: customerData.cpf,
        cellphone: customerData.phone
      } : {}
    };
    
    console.log('📤 Request to Abacate:', JSON.stringify(requestBody, null, 2));
    
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacateApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('❌ Abacate API error:', {
        status: abacateResponse.status,
        statusText: abacateResponse.statusText,
        headers: Object.fromEntries(abacateResponse.headers),
        errorText: errorText
      });
      throw new Error(`Payment service error: ${abacateResponse.status} - ${errorText}`);
    }

    const abacateData = await abacateResponse.json();
    console.log('✅ Abacate response:', JSON.stringify(abacateData, null, 2));

    if (!abacateData.data?.id) {
      console.error('❌ Missing payment ID in Abacate response:', abacateData);
      throw new Error("Invalid payment response - missing payment ID");
    }

    if (!abacateData.data?.brCode) {
      console.error('❌ Missing QR Code in Abacate response:', abacateData);
      throw new Error("Invalid payment response - missing QR Code");
    }

    const paymentId = abacateData.data.id;
    const qrCode = abacateData.data.brCode;
    const qrCodeUrl = abacateData.data.brCodeBase64;

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