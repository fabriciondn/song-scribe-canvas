import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Iniciando limpeza de PDFs temporários expirados...')

    // Buscar todos os arquivos na pasta temp-pdfs
    const { data: files, error: listError } = await supabase.storage
      .from('temp-pdfs')
      .list()

    if (listError) {
      throw new Error(`Erro ao listar arquivos: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      console.log('Nenhum arquivo encontrado para limpar')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum arquivo para limpar',
          deleted: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let deletedCount = 0
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    // Verificar e deletar arquivos expirados
    for (const file of files) {
      if (!file.created_at) continue

      const fileCreatedAt = new Date(file.created_at)
      
      if (fileCreatedAt < thirtyMinutesAgo) {
        const { error: deleteError } = await supabase.storage
          .from('temp-pdfs')
          .remove([file.name])

        if (deleteError) {
          console.error(`Erro ao deletar ${file.name}:`, deleteError.message)
        } else {
          console.log(`PDF expirado deletado: ${file.name}`)
          deletedCount++

          // Limpar coluna pdf_provisorio do registro correspondente
          const userId = file.name.replace('.pdf', '')
          await supabase
            .from('author_registrations')
            .update({ pdf_provisorio: null })
            .eq('user_id', userId)
            .not('pdf_provisorio', 'is', null)
        }
      }
    }

    console.log(`Limpeza concluída: ${deletedCount} arquivos deletados`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Limpeza concluída com sucesso',
        deleted: deletedCount,
        checked: files.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na limpeza de PDFs temporários:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
