
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Reset User Password - Iniciando...');

    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Criar cliente para verificar moderador
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Obter dados da requisição
    const { user_id, new_password } = await req.json();

    console.log('📋 Dados recebidos:', { user_id: user_id ? 'presente' : 'ausente' });

    // Validar dados de entrada
    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: 'user_id and new_password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar força da senha
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter usuário atual da sessão
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user: currentUser }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !currentUser) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👤 Usuário autenticado:', currentUser.id);

    // Verificar papel do usuário atual
    const { data: roleRow } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    const role = roleRow?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';

    if (!isAdmin) {
      if (role !== 'moderator') {
        return new Response(
          JSON.stringify({ error: 'Access denied. Moderator privileges required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { data: managedUser } = await supabaseAdmin
        .from('moderator_users')
        .select('user_id')
        .eq('user_id', user_id)
        .eq('moderator_id', currentUser.id)
        .maybeSingle();

      if (!managedUser) {
        return new Response(
          JSON.stringify({ error: 'You can only reset passwords for users you have created.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('✅ Permissões verificadas. Alterando senha...');

    // Alterar senha usando admin API
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('❌ Erro ao alterar senha:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Senha alterada com sucesso');

    // Log da atividade
    const { error: logError } = await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: user_id,
        action: 'password_reset_by_moderator',
        metadata: {
          moderator_user_id: currentUser.id,
          reset_at: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('⚠️ Erro ao registrar log (não crítico):', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password updated successfully',
        user_id: user_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
