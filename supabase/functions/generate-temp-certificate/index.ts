import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { jsPDF } from 'https://cdn.skypack.dev/jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkData {
  id: string
  title: string
  author: string
  other_authors?: string
  genre: string
  rhythm: string
  song_version: string
  lyrics: string
  hash?: string
  created_at: string
  user_id: string
}

interface UserData {
  name?: string
  cpf?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  cep?: string
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

    const { workId } = await req.json()

    console.log('Gerando PDF temporário para registro:', workId)

    // Buscar dados do registro
    const { data: work, error: workError } = await supabase
      .from('author_registrations')
      .select('*')
      .eq('id', workId)
      .single()

    if (workError || !work) {
      throw new Error('Registro não encontrado')
    }

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', work.user_id)
      .single()

    if (userError) {
      console.warn('Erro ao buscar perfil do usuário:', userError)
    }

    // Gerar PDF
    const pdfBuffer = await generatePDF(work, user || {})

    // Upload para Storage
    const fileName = `${work.user_id}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('temp-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
    }

    // Gerar URL assinada (30 minutos = 1800 segundos)
    const { data: signedData, error: signError } = await supabase.storage
      .from('temp-pdfs')
      .createSignedUrl(fileName, 1800)

    if (signError || !signedData) {
      throw new Error(`Erro ao gerar URL assinada: ${signError?.message}`)
    }

    // Atualizar coluna pdf_provisorio
    const { error: updateError } = await supabase
      .from('author_registrations')
      .update({ pdf_provisorio: signedData.signedUrl })
      .eq('id', workId)

    if (updateError) {
      throw new Error(`Erro ao atualizar registro: ${updateError.message}`)
    }

    console.log('PDF temporário gerado com sucesso:', signedData.signedUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: signedData.signedUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao gerar PDF temporário:', error)
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

async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return `data:${blob.type};base64,${base64}`
  } catch (error) {
    console.error('Erro ao carregar imagem:', url, error)
    return ''
  }
}

async function generatePDF(work: WorkData, user: UserData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Cores
  const primaryColor = [106, 13, 173]
  const secondaryColor = [251, 146, 60]
  const textColor = [51, 51, 51]

  // Carregar imagens
  const templateUrl = 'https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/temp-pdfs/template-background.png'
  const sealUrl = 'https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/temp-pdfs/seal.png'
  const waveformUrl = 'https://hnencfkdsyiwtvktdvzy.supabase.co/storage/v1/object/public/temp-pdfs/waveform.png'

  const templateImg = await loadImageAsBase64(templateUrl)
  const sealImg = await loadImageAsBase64(sealUrl)
  const waveformImg = await loadImageAsBase64(waveformUrl)

  // Adicionar template de fundo
  if (templateImg) {
    doc.addImage(templateImg, 'PNG', 0, 0, 210, 297)
  }

  // Adicionar selo Compuse
  if (sealImg) {
    doc.addImage(sealImg, 'PNG', 160, 15, 35, 35)
  }

  // Título
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICADO DE REGISTRO', 105, 70, { align: 'center' })

  // Subtítulo
  doc.setFontSize(14)
  doc.setTextColor(...secondaryColor)
  doc.text('Obra Musical Protegida', 105, 80, { align: 'center' })

  // Linha decorativa
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(30, 85, 180, 85)

  // Informações da obra
  let yPos = 100
  doc.setFontSize(11)
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')

  const addField = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 30, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value || 'Não informado', 80, yPos)
    yPos += 8
  }

  addField('Título da Obra', work.title)
  addField('Autor(a) Principal', work.author)
  if (work.other_authors) {
    addField('Coautores', work.other_authors)
  }
  addField('Gênero Musical', work.genre)
  addField('Ritmo', work.rhythm)
  addField('Versão', work.song_version)

  if (user.cpf) {
    addField('CPF do Autor', user.cpf)
  }

  if (user.street && user.city && user.state) {
    const address = `${user.street}, ${user.number || 'S/N'} - ${user.neighborhood || ''}, ${user.city}/${user.state}`
    addField('Endereço', address)
  }

  yPos += 5
  addField('Data de Registro', new Date(work.created_at).toLocaleDateString('pt-BR'))
  addField('ID do Documento', work.id)

  if (work.hash) {
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Hash de Integridade:', 30, yPos)
    doc.setFont('helvetica', 'normal')
    const hashLines = doc.splitTextToSize(work.hash, 150)
    doc.text(hashLines, 30, yPos + 5)
    yPos += (hashLines.length * 4) + 5
  }

  // Adicionar forma de onda decorativa
  if (waveformImg) {
    doc.addImage(waveformImg, 'PNG', 30, yPos, 150, 20)
    yPos += 25
  }

  // Rodapé
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Este certificado comprova o registro da obra no sistema Compuse', 105, 280, { align: 'center' })
  doc.text('Para validar a autenticidade, acesse: www.compuse.com.br', 105, 285, { align: 'center' })

  // Segunda página com letra
  doc.addPage()
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('LETRA DA MÚSICA', 105, 30, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(...textColor)
  doc.setFont('helvetica', 'normal')

  const lyricsLines = work.lyrics.split('\n')
  const maxLinesPerColumn = 45
  const columnWidth = 85

  if (lyricsLines.length > maxLinesPerColumn) {
    // Duas colunas
    let leftColumnY = 45
    let rightColumnY = 45

    lyricsLines.forEach((line, index) => {
      if (index < maxLinesPerColumn) {
        doc.text(line, 20, leftColumnY)
        leftColumnY += 5
      } else {
        doc.text(line, 110, rightColumnY)
        rightColumnY += 5
      }
    })
  } else {
    // Uma coluna centralizada
    let yPosition = 45
    lyricsLines.forEach(line => {
      doc.text(line, 105, yPosition, { align: 'center', maxWidth: 170 })
      yPosition += 5
    })
  }

  // Rodapé da segunda página
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Compuse - Plataforma de Registro de Obras Musicais', 105, 285, { align: 'center' })

  // Retornar PDF como Uint8Array
  const pdfOutput = doc.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}
