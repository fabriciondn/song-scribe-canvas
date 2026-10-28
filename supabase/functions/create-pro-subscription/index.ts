import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { authenticatedUser, ensureLaunchPurchaseAllowed, saveLaunchOrder, LAUNCH_AMOUNT, LAUNCH_DESCRIPTION } from '../_shared/launch-subscription.ts';

interface RequestBody {
  user_id: string;
  user_email: string;
  user_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 create-pro-subscription: Iniciando processo');

    // Verificar variáveis de ambiente
    const abacateApiKey = Deno.env.get('ABACATE_API_KEY');
    if (!abacateApiKey) {
      throw new Error('ABACATE_API_KEY não configurada');
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Parse do body
    const user = await authenticatedUser(req);
    await req.json();
    const user_id=user.id, user_email=user.email, user_name=user.user_metadata?.name || 'Usuário';
    await ensureLaunchPurchaseAllowed(supabaseClient,user.id);
    
    if (!user_id || !user_email) {
      throw new Error('user_id e user_email são obrigatórios');
    }

    console.log('📝 Dados recebidos:', { user_id, user_email, user_name });

    // Criar pagamento PIX único no Abacate (não é recorrente)
    const abacatePayload = {
      frequency: 'oneTime', // Pagamento único, não recorrente
      methods: ['PIX'],
      products: [{
        externalId: `pro_subscription_${user_id}_${Date.now()}`,
        name: 'Plano Padrão — Oferta de Lançamento',
        description: LAUNCH_DESCRIPTION,
        quantity: 1,
        price: LAUNCH_AMOUNT * 100
      }],
      returnUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/subscription-checkout`,
      completionUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard`
    };

    console.log('💳 Criando pagamento no Abacate:', abacatePayload);

    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacateApiKey}`
      },
      body: JSON.stringify(abacatePayload)
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('❌ Erro do Abacate:', errorText);
      throw new Error(`Erro ao criar pagamento: ${abacateResponse.status}`);
    }

    const abacateData = await abacateResponse.json();
    console.log('✅ Pagamento criado no Abacate:', abacateData);

    const billing = abacateData.data || abacateData;
    await saveLaunchOrder(supabaseClient,user_id,'abacate',billing.id);

    // Retornar URL de pagamento (PIX QR code)
    return new Response(JSON.stringify({
      success: true,
      payment_url: billing.url, // URL do checkout com QR code
      subscription_id: billing.id,
      amount: LAUNCH_AMOUNT,
      currency: 'BRL'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});