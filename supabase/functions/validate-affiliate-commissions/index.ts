import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  approved_commissions: number;
  cancelled_commissions: number;
  total_processed: number;
  processed_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando validação automática de comissões de afiliados');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar função de validação
    console.log('📞 Chamando função validate_affiliate_commissions()');
    const { data, error } = await supabase.rpc('validate_affiliate_commissions');

    if (error) {
      console.error('❌ Erro ao validar comissões:', error);
      throw error;
    }

    const result = data as ValidationResult;

    console.log('✅ Validação concluída:', {
      aprovadas: result.approved_commissions,
      canceladas: result.cancelled_commissions,
      total: result.total_processed,
      processado_em: result.processed_at
    });

    // Buscar comissões pendentes de validação (para relatório)
    const { data: pendingCommissions, error: pendingError } = await supabase
      .from('affiliate_commissions')
      .select('id, validation_deadline, user_id, amount')
      .eq('status', 'pending')
      .not('validation_deadline', 'is', null)
      .not('validated_at', 'is', null)
      .order('validation_deadline', { ascending: true })
      .limit(10);

    if (pendingError) {
      console.error('⚠️ Erro ao buscar comissões pendentes:', pendingError);
    }

    const response = {
      success: true,
      message: 'Validação de comissões executada com sucesso',
      result: {
        approved: result.approved_commissions,
        cancelled: result.cancelled_commissions,
        total_processed: result.total_processed,
        processed_at: result.processed_at
      },
      pending_validations: pendingCommissions?.length || 0,
      next_validations: pendingCommissions || []
    };

    console.log('📊 Resposta:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('💥 Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
