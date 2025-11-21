import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import jsPDF from 'https://esm.sh/jspdf@2.5.1'

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
    const fileName = `${work.id}_${Date.now()}.pdf`
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
    
    // Processar buffer em chunks para evitar stack overflow com imagens grandes
    const uint8Array = new Uint8Array(buffer)
    const chunkSize = 8192
    let binaryString = ''
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode(...chunk)
    }
    
    const base64 = btoa(binaryString)
    return `data:${blob.type};base64,${base64}`
  } catch (error) {
    console.error('Erro ao carregar imagem:', url, error)
    return ''
  }
}

async function generatePDF(work: WorkData, user: UserData): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Cores (exatamente como no frontend)
  const blackColor: [number, number, number] = [0, 0, 0]
  const whiteColor: [number, number, number] = [255, 255, 255]
  const grayColor: [number, number, number] = [64, 64, 64]
  const lightGrayColor: [number, number, number] = [128, 128, 128]
  const accentColor: [number, number, number] = [0, 100, 200]

  // URLs das imagens no Storage do Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const templateUrl = `${supabaseUrl}/storage/v1/object/public/temp-pdfs/template-background.png`
  const sealUrl = `${supabaseUrl}/storage/v1/object/public/temp-pdfs/compuse-seal.png`
  const waveformUrl = `${supabaseUrl}/storage/v1/object/public/temp-pdfs/waveform.png`

  try {
    // Carregar o template de fundo
    const templateImage = await loadImageAsBase64(templateUrl)
    if (templateImage) {
      pdf.addImage(templateImage, 'PNG', 0, 0, 210, 297)
    }

    // Carregar e adicionar o selo da Compuse (centralizado, 1,5cm da barra cinza)
    const compuseSeal = await loadImageAsBase64(sealUrl)
    if (compuseSeal) {
      pdf.addImage(compuseSeal, 'PNG', 80, 15, 50, 50)
    }

    // Carregar e adicionar a nova waveform (1cm de espaçamento do selo)
    const waveform = await loadImageAsBase64(waveformUrl)
    if (waveform) {
      pdf.addImage(waveform, 'PNG', 20, 75, 170, 15)
    }
  } catch (error) {
    console.error('Erro ao carregar imagens:', error)
    // Fallback para fundo simples se as imagens falharem
    pdf.setFillColor(240, 240, 240)
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(16)
    pdf.text('CERTIFICADO DE REGISTRO DE OBRA MUSICAL', 105, 30, { align: 'center' })
  }

  // **DADOS PRINCIPAIS** - Layout organizado e responsivo
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  let yPosition = 100 // 1cm abaixo da waveform
  
  // Seção título
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DADOS DA OBRA REGISTRADA', 20, yPosition)
  
  // Linha decorativa
  pdf.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
  pdf.setLineWidth(0.5)
  pdf.line(20, yPosition + 3, 190, yPosition + 3)
  
  yPosition += 15
  pdf.setFontSize(10)
  
  // **PRIMEIRA LINHA** - Título (linha completa para títulos longos)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.text('TÍTULO:', 20, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  const titleLines = pdf.splitTextToSize(work.title, 155)
  pdf.text(titleLines, 45, yPosition)
  yPosition += Math.max(12, titleLines.length * 6 + 6)
  
  // **SEGUNDA LINHA** - Autor Principal e Gênero Musical
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.text('AUTOR PRINCIPAL:', 20, yPosition)
  pdf.text('GÊNERO MUSICAL:', 110, yPosition)
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  const authorLines = pdf.splitTextToSize(work.author, 85)
  pdf.text(authorLines, 20, yPosition + 8)
  pdf.text(work.genre, 110, yPosition + 8)
  yPosition += 20
  
  // **TERCEIRA LINHA** - CPF e Ritmo
  let hasThirdLineContent = false
  if (user.cpf) {
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
    pdf.text('CPF:', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    pdf.text(user.cpf, 20, yPosition + 8)
    hasThirdLineContent = true
  }
  
  if (work.rhythm) {
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
    pdf.text('RITMO:', 110, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    pdf.text(work.rhythm, 110, yPosition + 8)
    hasThirdLineContent = true
  }
  
  if (hasThirdLineContent) {
    yPosition += 20
  }
  
  // **QUARTA LINHA** - Endereço e Versão
  let hasFourthLineContent = false
  if (user.street && user.city && user.state) {
    const address = `${user.street}, ${user.number || 'S/N'} - ${user.neighborhood || ''}, ${user.city}/${user.state}`
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
    pdf.text('ENDEREÇO:', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    const addressLines = pdf.splitTextToSize(address, 85)
    pdf.text(addressLines, 20, yPosition + 8)
    hasFourthLineContent = true
  }
  
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.text('VERSÃO:', 110, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.text(work.song_version, 110, yPosition + 8)
  hasFourthLineContent = true
  
  if (hasFourthLineContent) {
    const addressLinesCount = (user.street && user.city) ? pdf.splitTextToSize(`${user.street}, ${user.number || 'S/N'}`, 85).length : 1
    yPosition += Math.max(20, addressLinesCount * 6 + 12)
  }
  
  // **CO-AUTORES** - Seção separada com largura completa se necessário
  const parseCoAuthors = (otherAuthors: string | undefined): string => {
    if (!otherAuthors || otherAuthors.trim === '') return ''
    
    try {
      if (otherAuthors.startsWith('{') || otherAuthors.startsWith('[')) {
        const parsed = JSON.parse(otherAuthors)
        if (parsed.has_other_authors === false || 
            (Array.isArray(parsed.other_authors) && parsed.other_authors.length === 0)) {
          return ''
        }
        if (Array.isArray(parsed.other_authors) && parsed.other_authors.length > 0) {
          return parsed.other_authors
            .map((author: any) => `${author.name} (CPF: ${author.cpf})`)
            .join(', ')
        }
        return otherAuthors
      }
      return otherAuthors
    } catch {
      return otherAuthors
    }
  }

  const coAuthorsText = parseCoAuthors(work.other_authors)
  if (coAuthorsText) {
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
    pdf.text('CO-AUTORES:', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    const coAuthorsLines = pdf.splitTextToSize(coAuthorsText, 170)
    pdf.text(coAuthorsLines, 20, yPosition + 8)
    yPosition += 8 + (coAuthorsLines.length * 6) + 5
  }
  
  // **SEÇÃO DE REGISTRO**
  yPosition += 10
  
  // Data e hora de registro
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.text('DATA DE REGISTRO:', 20, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  
  const registrationDate = new Date(work.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
  pdf.text(registrationDate, 20, yPosition + 8)
  
  // ID do documento
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.text('ID DO DOCUMENTO:', 110, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.text(work.id.substring(0, 16) + '...', 110, yPosition + 8)
  
  yPosition += 25
  
  // **HASH DE INTEGRIDADE**
  if (work.hash) {
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2])
    pdf.text('HASH DE INTEGRIDADE (SHA-256):', 20, yPosition)
    
    yPosition += 10
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    
    // Formatação do hash em blocos
    const hashChunks = work.hash.match(/.{1,40}/g) || []
    hashChunks.forEach((chunk, index) => {
      pdf.text(chunk, 20, yPosition + (index * 6))
    })
    
    yPosition += (hashChunks.length * 6) + 10
  }
  
  // **FOOTER** - Tarja preta inferior da primeira página
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.rect(0, 275, 210, 22, 'F')
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Este certificado comprova o registro da obra musical na plataforma COMPUSE', 105, 285, { align: 'center' })
  pdf.text(`compuse.com.br | Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, 292, { align: 'center' })
  
  // **SEGUNDA PÁGINA** - Letra completa
  pdf.addPage()
  
  // Header da segunda página - faixa mais fina
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.rect(0, 0, 210, 25, 'F')

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('LETRA COMPLETA', 105, 16, { align: 'center' })
  
  // Letra completa com sistema de duas colunas
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  // Configurações para layout em duas colunas
  const pageHeight = 297
  const footerHeight = 22
  const headerHeight = 25
  const availableHeight = pageHeight - headerHeight - footerHeight - 10
  const startY = 40
  const lineHeight = 5
  const maxLinesPerColumn = Math.floor(availableHeight / lineHeight)
  
  // Largura das colunas
  const columnWidth = 80
  const leftColumnX = 20
  const rightColumnX = 110
  
  // Quebrar a letra em linhas que cabem na largura da coluna
  const fullLyricsLines = pdf.splitTextToSize(work.lyrics, columnWidth)
  
  // Se a letra cabe em uma coluna, usar layout simples
  if (fullLyricsLines.length <= maxLinesPerColumn) {
    pdf.text(fullLyricsLines, leftColumnX, startY)
  } else {
    // Layout de duas colunas para letras longas
    const firstColumnLines = fullLyricsLines.slice(0, maxLinesPerColumn)
    const secondColumnLines = fullLyricsLines.slice(maxLinesPerColumn)
    
    // Primeira coluna (esquerda)
    pdf.text(firstColumnLines, leftColumnX, startY)
    
    // Segunda coluna (direita)
    if (secondColumnLines.length > 0) {
      pdf.text(secondColumnLines, rightColumnX, startY)
    }
    
    // Se ainda houver mais texto, adicionar uma nota
    if (secondColumnLines.length > maxLinesPerColumn) {
      const remainingLines = secondColumnLines.length - maxLinesPerColumn
      pdf.setFontSize(8)
      pdf.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2])
      pdf.text(`[+${remainingLines} linhas adicionais da letra]`, rightColumnX, startY + (maxLinesPerColumn * lineHeight) + 10)
    }
  }
  
  // Footer da segunda página
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2])
  pdf.rect(0, 275, 210, 22, 'F')
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('COMPUSE - Plataforma de Registro Musical', 105, 286, { align: 'center' })

  // Retornar PDF como Uint8Array
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}
