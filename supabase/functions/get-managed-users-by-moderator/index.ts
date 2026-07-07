import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não encontrado ou inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedModeratorId = body?.moderator_id || user.id;

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const callerRole = roleData?.role;
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    const isModerator = callerRole === 'moderator';

    if (roleError || (!isAdmin && !isModerator)) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isModerator && requestedModeratorId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Você só pode listar os seus próprios usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isAdmin) {
      const { data: targetModerator } = await supabaseAdmin
        .from('admin_users')
        .select('user_id')
        .eq('user_id', requestedModeratorId)
        .eq('role', 'moderator')
        .maybeSingle();

      if (!targetModerator) {
        return new Response(
          JSON.stringify({ error: 'Moderador selecionado inválido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: moderatorUsers, error: moderatorUsersError } = await supabaseAdmin
      .from('moderator_users')
      .select('user_id, created_at')
      .eq('moderator_id', requestedModeratorId)
      .order('created_at', { ascending: false });

    if (moderatorUsersError) {
      throw moderatorUsersError;
    }

    if (!moderatorUsers || moderatorUsers.length === 0) {
      return new Response(
        JSON.stringify({ users: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = moderatorUsers.map((item) => item.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, artistic_name, credits')
      .in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    const profilesById = new Map((profiles || [])
      .filter((profile) => !String(profile.name || '').includes('[USUÁRIO EXCLUÍDO]'))
      .map((profile) => [profile.id, profile]));

    const users = moderatorUsers
      .filter((item) => profilesById.has(item.user_id))
      .map((item) => {
        const profile = profilesById.get(item.user_id);
        return {
          id: item.user_id,
          name: profile?.name || null,
          email: profile?.email || null,
          artistic_name: profile?.artistic_name || null,
          credits: profile?.credits || 0,
          created_at: item.created_at,
        };
      });

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao listar usuários do moderador:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});