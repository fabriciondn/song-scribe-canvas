
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors';
import { z } from 'npm:zod@3';
import { authenticatedUser, ensureLaunchPurchaseAllowed, saveLaunchOrder, LAUNCH_AMOUNT, LAUNCH_DESCRIPTION } from '../_shared/launch-subscription.ts';

interface PaymentRequest {
  type: 'credits' | 'subscription';
  credits?: number;
  bonusCredits?: number;
  unitPrice?: number;
  totalAmount: number;
  user_id: string;
  user_email: string;
  user_name: string;
  customerData?: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const user = await authenticatedUser(req);
    const parsed = z.object({ type: z.enum(['credits', 'subscription']), user_id: z.string().uuid().optional() }).passthrough().safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({error: 'Dados inválidos'}), {status:400, headers:corsHeaders});
    const body = parsed.data as unknown as PaymentRequest;
    if (body.user_id && body.user_id !== user.id) return new Response(JSON.stringify({error:'Access denied'}), {status:403,headers:corsHeaders});
    const { type, customerData } = body;
    const user_id = user.id;
    const user_email = user.email;
    const { data: profile } = await supabaseService.from('profiles').select('name,email,cpf,cellphone').eq('id', user_id).single();
    const user_name = profile?.name || 'Usuário';
    const totalAmount = type === 'subscription' ? LAUNCH_AMOUNT : body.totalAmount;
    if (type === 'subscription') {
      await ensureLaunchPurchaseAllowed(supabaseService, user_id);
      if (!profile?.name || !profile?.cpf || !profile?.email || !profile?.cellphone) return new Response(JSON.stringify({error:'Complete nome, CPF, email e telefone no perfil'}), {status:400,headers:corsHeaders});
    }

    let openPixAppId = Deno.env.get("OPENPIX_APP_ID");
    
    // Tentar buscar do banco de dados se não estiver no env
    if (!openPixAppId) {
      const { data: dbSetting } = await supabaseService
        .from('system_settings')
        .select('value')
        .eq('key', 'OPENPIX_APP_ID')
        .maybeSingle();
      
      if (dbSetting?.value) {
        openPixAppId = dbSetting.value;
      }
    }

    if (!openPixAppId) {
      return new Response(
        JSON.stringify({ error: "OpenPix App ID not configured in environment or database settings" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correlationID = `${type}_${user_id}_${Date.now()}`;
    
    // Preparar payload para OpenPix
    const openPixPayload = {
      correlationID,
      value: Math.round(totalAmount * 100), // Valor em centavos
      comment: type === 'subscription' ? LAUNCH_DESCRIPTION : `${body.credits} Créditos - Compuse`,
      customer: {
        name: customerData?.name || user_name,
        email: customerData?.email || user_email,
        taxID: (type === 'subscription' ? profile?.cpf : customerData?.cpf)?.replace(/\D/g, '') || '',
        phone: (type === 'subscription' ? profile?.cellphone : customerData?.phone) || ''
      }
    };

    console.log('Criando cobrança OpenPix', { type });

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': openPixAppId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openPixPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na OpenPix:', data);
      throw new Error(data.error || 'Erro ao criar cobrança na OpenPix');
    }

    const charge = data.charge;

    // Registrar no banco de dados
    if (type === 'credits') {
      await supabaseService
        .from('credit_transactions')
        .insert({
          user_id,
          credits_purchased: body.credits,
          bonus_credits: body.bonusCredits || 0,
          unit_price: body.unitPrice,
          total_amount: totalAmount,
          payment_id: charge.correlationID,
          payment_provider: 'openpix',
          status: 'pending'
        });
    } else if (type === 'subscription') {
      await saveLaunchOrder(supabaseService, user_id, 'openpix', charge.correlationID);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: charge.correlationID,
        qr_code: charge.brCode,
        qr_code_url: charge.qrCodeImage,
        correlationID: charge.correlationID,
        amount: totalAmount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
