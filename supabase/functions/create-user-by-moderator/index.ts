
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com privilégios de admin
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

    // Obter o token de autenticação do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorização inválido ou ausente');
      return new Response(
        JSON.stringify({ error: 'Token de autorização não encontrado ou inválido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verificando token de usuário...');

    // Verificar se o usuário atual é um moderador usando o token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Erro ao verificar usuário:', userError?.message || 'Usuário não encontrado');
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);

    // Verificar se o usuário é moderador ou admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const callerRole = roleData?.role;
    const isModerator = callerRole === 'moderator';
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';

    if (roleError || (!isModerator && !isAdmin)) {
      console.error('❌ Erro ao verificar permissão:', roleError?.message || 'Usuário não é moderador/admin');
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Privilégios de moderador ou admin necessários.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário autorizado:', callerRole);

    // Obter dados do body da requisição
    const requestBody = await req.json();
    const { name, email, password, artistic_name, moderator_id, target_moderator_id } = requestBody;

    if (!name || !email || !password) {
      console.error('❌ Dados obrigatórios ausentes');
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let targetModeratorId = isModerator ? user.id : (target_moderator_id || moderator_id);

    if (isAdmin) {
      if (!targetModeratorId) {
        return new Response(
          JSON.stringify({ error: 'Selecione um moderador para registrar este usuário.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: targetModerator, error: targetModeratorError } = await supabaseAdmin
        .from('admin_users')
        .select('user_id')
        .eq('user_id', targetModeratorId)
        .eq('role', 'moderator')
        .maybeSingle();

      if (targetModeratorError || !targetModerator) {
        return new Response(
          JSON.stringify({ error: 'Moderador selecionado inválido.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('🔧 Criando usuário:', { name, email });

    // Verificar se email já existe antes de tentar criar
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários existentes:', checkError.message);
      return new Response(
        JSON.stringify({ error: 'Erro interno ao verificar usuários' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailExists = existingUsers.users.some(u => u.email === email);
    if (emailExists) {
      console.log('⚠️ Email já existe:', email);
      return new Response(
        JSON.stringify({ error: 'Este email já está em uso. Escolha outro email.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        artistic_name: artistic_name || null,
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      
      // Tratar erro de email já existente
      if (authError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está registrado. Use outro email.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: authError.message || 'Erro ao criar usuário' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado');
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // Atualizar/criar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name,
        email,
        artistic_name: artistic_name || null,
        credits: 0,
      });

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      
      // Reverter criação do usuário se o perfil falhar
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('🔄 Usuário revertido devido a erro no perfil');
      } catch (deleteError) {
        console.error('❌ Erro ao reverter usuário:', deleteError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil do usuário' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Perfil criado com sucesso');

    // Registrar que este usuário foi criado pelo moderador
    const { error: moderatorUserError } = await supabaseAdmin
      .from('moderator_users')
      .insert({
        moderator_id: targetModeratorId,
        user_id: authData.user.id,
      });

    if (moderatorUserError) {
      console.error('❌ Erro ao registrar usuário criado por moderador:', moderatorUserError.message);
      
      // Não reverter a criação por esse erro, apenas logar
      console.log('⚠️ Usuário criado mas não registrado como criado por moderador');
    } else {
      console.log('✅ Usuário registrado como criado por moderador');
    }

    // Log de atividade
    try {
      await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: authData.user.id,
          action: 'user_created_by_moderator',
          metadata: {
            moderator_id: user.id,
            target_moderator_id: targetModeratorId,
            performed_by: user.id,
            is_admin_operation: isAdmin,
            moderator_email: user.email,
            created_at: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('⚠️ Erro ao registrar log de atividade:', logError);
      // Não falhar por causa do log
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        moderatorId: targetModeratorId,
        message: 'Usuário criado com sucesso'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error instanceof Error ? error.message : error);
    
    // Retornar erro mais específico se possível
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
      // Se é erro de validação, usar status 400
      if (error.message.includes('já existe') || error.message.includes('already')) {
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
