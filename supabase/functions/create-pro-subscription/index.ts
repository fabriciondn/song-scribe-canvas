import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { user_id, user_email, user_name }: RequestBody = await req.json();
    
    if (!user_id || !user_email) {
      throw new Error('user_id e user_email são obrigatórios');
    }

    console.log('📝 Dados recebidos:', { user_id, user_email, user_name });

    // Criar pagamento no Abacate
    const abacatePayload = {
      frequency: 'monthly',
      customer: {
        name: user_name,
        email: user_email,
        cellphone: '',
        taxId: ''
      },
      billingType: 'PIX',
      value: 14.99,
      description: 'Assinatura Plano Pro - Mensal',
      externalReference: `pro_subscription_${user_id}_${Date.now()}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 24h para pagamento
    };

    console.log('💳 Criando pagamento no Abacate:', abacatePayload);

    const abacateResponse = await fetch('https://www.abacatepay.com/api/v1/billing/subscription', {
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

    // Salvar dados da subscription no Supabase
    const subscriptionData = {
      user_id,
      status: 'pending',
      plan_type: 'pro',
      amount: 14.99,
      currency: 'BRL',
      payment_provider: 'abacate',
      payment_provider_subscription_id: abacateData.id,
      auto_renew: true,
      started_at: new Date().toISOString(),
      // Não definir expires_at para subscription recorrente
    };

    console.log('💾 Salvando subscription no Supabase:', subscriptionData);

    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (subscriptionError) {
      console.error('❌ Erro ao salvar subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('✅ Subscription salva com sucesso');

    // Retornar URL de pagamento
    return new Response(JSON.stringify({
      success: true,
      payment_url: abacateData.invoiceUrl,
      subscription_id: abacateData.id,
      amount: 14.99,
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