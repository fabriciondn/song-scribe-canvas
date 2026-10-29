import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { authenticatedUser } from '../_shared/launch-subscription.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const user = await authenticatedUser(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    // A decisão sobre o gateway ocorre somente no servidor, sem RLS do cliente.
    const { data: links, error: lookupError } = await service.from('moderator_users')
      .select('moderator_id').eq('user_id', user.id).limit(2);
    if (lookupError) throw lookupError;
    if ((links?.length || 0) > 1) return json({ error: 'Múltiplos vínculos de parceiro. Contate o suporte.' }, 409);
    const provider = links?.length ? 'mercadopago' : 'openpix';
    const functionName = provider === 'mercadopago'
      ? 'create-pro-subscription-mercadopago' : 'create-openpix-payment';
    const paymentResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        Authorization: req.headers.get('Authorization') || '',
        apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'subscription', user_id: user.id, user_email: user.email }),
    });
    const responseText = await paymentResponse.text();
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(responseText); } catch { return json({ error: 'Resposta inválida do provedor de pagamento' }, 502); }
    if (!paymentResponse.ok) return json({ error: payload.error || 'Falha ao gerar cobrança' }, paymentResponse.status);
    if (!payload.qr_code || !payload.payment_id) return json({ error: 'O provedor não retornou um QR Code válido' }, 502);
    return json({ ...payload, provider });
  } catch (error) {
    console.error('create-subscription-payment:', error);
    return json({ error: error instanceof Error && error.message === 'Unauthorized' ? 'Não autenticado' : 'Não foi possível identificar o gateway de pagamento' }, error instanceof Error && error.message === 'Unauthorized' ? 401 : 500);
  }
});
