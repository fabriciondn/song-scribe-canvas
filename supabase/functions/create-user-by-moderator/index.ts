
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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não encontrado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se o usuário atual é um moderador
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('❌ Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se o usuário é um moderador
    const { data: moderatorCheck, error: moderatorError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'moderator')
      .single();

    if (moderatorError || !moderatorCheck) {
      console.error('❌ Erro ao verificar moderador:', moderatorError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Privilégios de moderador necessários.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter dados do body da requisição
    const { name, email, password, artistic_name } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔧 Criando usuário:', { name, email });

    // Verificar se email já existe antes de tentar criar
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários existentes:', checkError);
      return new Response(
        JSON.stringify({ error: 'Erro interno ao verificar usuários' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailExists = existingUser.users.some(u => u.email === email);
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
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      
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
      console.error('❌ Erro ao criar perfil:', profileError);
      
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
        moderator_id: user.id,
        user_id: authData.user.id,
      });

    if (moderatorUserError) {
      console.error('❌ Erro ao registrar usuário criado por moderador:', moderatorUserError);
      
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
        message: 'Usuário criado com sucesso'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
