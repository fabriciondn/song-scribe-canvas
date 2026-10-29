import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return respond({ error: 'Método não permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return respond({ error: 'Não autenticado' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.slice(7));
    if (authError || !user) return respond({ error: 'Não autenticado' }, 401);
    const { data: isAdmin, error: roleError } = await authClient.rpc('check_admin_access');
    if (roleError || isAdmin !== true) return respond({ error: 'Apenas administradores podem usar esta ferramenta' }, 403);

    const body = await req.json();
    const action = body?.action;
    const clientEmail = typeof body?.clientEmail === 'string' ? body.clientEmail.trim().toLowerCase() : '';
    const partnerEmail = typeof body?.partnerEmail === 'string' ? body.partnerEmail.trim().toLowerCase() : '';
    if (!['check_partner_link', 'assign_partner_link'].includes(action)) return respond({ error: 'Operação não permitida. SQL arbitrário está desativado.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) {
      return respond({ error: 'Informe e-mails válidos do cliente e parceiro' }, 400);
    }

    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: people, error: peopleError } = await service.from('profiles')
      .select('id, name, email').in('email', [clientEmail, partnerEmail]);
    if (peopleError) throw peopleError;
    const client = people?.find((p) => p.email?.toLowerCase() === clientEmail);
    const partner = people?.find((p) => p.email?.toLowerCase() === partnerEmail);
    if (!client || !partner) return respond({ error: 'Cliente ou parceiro não encontrado pelo e-mail exato' }, 404);
    if (client.id === partner.id) return respond({ error: 'Cliente e parceiro devem ser pessoas diferentes' }, 400);

    const { data: links, error: linkError } = await service.from('moderator_users')
      .select('moderator_id').eq('user_id', client.id);
    if (linkError) throw linkError;
    const alreadyLinked = links?.some((link) => link.moderator_id === partner.id) || false;
    const otherLink = links?.some((link) => link.moderator_id !== partner.id) || false;
    if (action === 'check_partner_link') return respond({
      client: { name: client.name, email: client.email },
      partner: { name: partner.name, email: partner.email },
      alreadyLinked, conflictingPartner: otherLink,
    });
    if (otherLink) return respond({ error: 'Cliente já possui vínculo com outro parceiro. Operação bloqueada.' }, 409);
    if (!alreadyLinked) {
      const { error: insertError } = await service.from('moderator_users')
        .insert({ user_id: client.id, moderator_id: partner.id });
      if (insertError) throw insertError;
    }
    console.log('admin-sql-tools: partner link', { adminId: user.id, clientId: client.id, partnerId: partner.id, created: !alreadyLinked });
    return respond({ success: true, message: alreadyLinked ? 'Vínculo já existente' : 'Vínculo criado com sucesso', client: client.email, partner: partner.email });
  } catch (error) {
    console.error('admin-sql-tools error:', error);
    return respond({ error: 'Não foi possível concluir a operação. Consulte os logs da função.' }, 500);
  }
});
