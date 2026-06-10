import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { order_id, client_name, client_email } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: order, error: orderErr } = await supabase
      .from('music_preview_orders').select('*').eq('id', order_id).maybeSingle();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If already has charge, just return it
    if (order.pix_br_code) {
      return new Response(JSON.stringify({
        success: true,
        qr_code: order.pix_qr_code, br_code: order.pix_br_code,
        payment_url: order.payment_url, status: order.status,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let openPixAppId = Deno.env.get("OPENPIX_APP_ID");
    if (!openPixAppId) {
      const { data: s } = await supabase.from('system_settings')
        .select('value').eq('key', 'OPENPIX_APP_ID').maybeSingle();
      openPixAppId = s?.value;
    }
    if (!openPixAppId) {
      return new Response(JSON.stringify({ error: 'OpenPix not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const correlationID = `preview_${order_id}`;
    const payload = {
      correlationID,
      value: Math.round(Number(order.amount) * 100),
      comment: `Prévia musical - Compuse`,
      customer: {
        name: client_name || 'Cliente',
        email: client_email || 'cliente@compuse.com.br',
      },
    };

    const r = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: { 'Authorization': openPixAppId, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('OpenPix error', data);
      return new Response(JSON.stringify({ error: data.error || 'OpenPix error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const charge = data.charge;
    await supabase.from('music_preview_orders').update({
      payment_id: correlationID,
      pix_qr_code: charge.qrCodeImage,
      pix_br_code: charge.brCode,
      payment_url: charge.paymentLinkUrl,
    }).eq('id', order_id);

    return new Response(JSON.stringify({
      success: true,
      qr_code: charge.qrCodeImage,
      br_code: charge.brCode,
      payment_url: charge.paymentLinkUrl,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
