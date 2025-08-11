import jsPDF from 'jspdf';

interface RegisteredWork {
  id: string;
  title: string;
  author: string;
  author_cpf?: string;
  author_address?: string;
  other_authors: string | null;
  genre: string;
  rhythm?: string;
  song_version: string;
  lyrics: string;
  hash: string | null;
  created_at: string;
  status: string;
  user_id?: string;
}

export const generateCertificatePDF = async (work: RegisteredWork) => {
  const pdf = new jsPDF();
  
  // Configurações de cores
  const blackColor: [number, number, number] = [0, 0, 0];
  const whiteColor: [number, number, number] = [255, 255, 255];
  const grayColor: [number, number, number] = [64, 64, 64];
  const lightGrayColor: [number, number, number] = [128, 128, 128];
  const accentColor: [number, number, number] = [0, 100, 200];
  
  // Função para carregar imagem como base64
  const loadImageAsBase64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  };

  try {
    // Carregar o template de fundo
    const templateImage = await loadImageAsBase64('/lovable-uploads/76c16cc8-275f-41f4-b678-ce3151f744bc.png');
    pdf.addImage(templateImage, 'PNG', 0, 0, 210, 297);

    // Carregar e adicionar o selo da Compuse (centralizado, 1,5cm da barra cinza)
    const compuseSeal = await loadImageAsBase64('/lovable-uploads/b2e99156-0e7f-46c8-8b49-eafea58416f9.png');
    pdf.addImage(compuseSeal, 'PNG', 80, 15, 50, 50); // 1,5cm = ~15mm de afastamento

    // Carregar e adicionar a nova waveform (1cm de espaçamento do selo)
    const waveform = await loadImageAsBase64('/lovable-uploads/0302ac51-1c0b-4276-8fa8-6411e9a18597.png');
    pdf.addImage(waveform, 'PNG', 20, 75, 170, 15); // 1cm = ~10mm + altura do selo
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    // Fallback para o método original se as imagens não carregarem
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.text('CERTIFICADO DE REGISTRO DE OBRA MUSICAL', 105, 30, { align: 'center' });
  }

  // **DADOS PRINCIPAIS** - Layout organizado e responsivo
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  let yPosition = 100; // 1cm abaixo da waveform
  
  // Seção título
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DA OBRA REGISTRADA', 20, yPosition);
  
  // Linha decorativa
  pdf.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  pdf.setFontSize(10);
  
  // **PRIMEIRA LINHA** - Título (linha completa para títulos longos)
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('TÍTULO:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const titleLines = pdf.splitTextToSize(work.title, 155);
  pdf.text(titleLines, 45, yPosition);
  yPosition += Math.max(12, titleLines.length * 6 + 6);
  
  // **SEGUNDA LINHA** - Autor Principal e Gênero Musical
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('AUTOR PRINCIPAL:', 20, yPosition);
  pdf.text('GÊNERO MUSICAL:', 110, yPosition);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  // Nome completo do autor sem abreviação
  const authorLines = pdf.splitTextToSize(work.author, 85);
  pdf.text(authorLines, 20, yPosition + 8);
  pdf.text(work.genre, 110, yPosition + 8);
  yPosition += 20;
  
  // **TERCEIRA LINHA** - CPF e Ritmo
  let hasThirdLineContent = false;
  if (work.author_cpf) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('CPF:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(work.author_cpf, 20, yPosition + 8);
    hasThirdLineContent = true;
  }
  
  if (work.rhythm) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('RITMO:', 110, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(work.rhythm, 110, yPosition + 8);
    hasThirdLineContent = true;
  }
  
  if (hasThirdLineContent) {
    yPosition += 20;
  }
  
  // **QUARTA LINHA** - Endereço e Versão
  let hasFourthLineContent = false;
  if (work.author_address) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('ENDEREÇO:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const addressLines = pdf.splitTextToSize(work.author_address, 85);
    pdf.text(addressLines, 20, yPosition + 8);
    hasFourthLineContent = true;
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('VERSÃO:', 110, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(work.song_version, 110, yPosition + 8);
  hasFourthLineContent = true;
  
  if (hasFourthLineContent) {
    const addressLinesCount = work.author_address ? pdf.splitTextToSize(work.author_address, 85).length : 1;
    yPosition += Math.max(20, addressLinesCount * 6 + 12);
  }
  
  // **CO-AUTORES** - Seção separada com largura completa se necessário
  const parseCoAuthors = (otherAuthors: string | null): string => {
    if (!otherAuthors || otherAuthors.trim() === '') return '';
    
    try {
      if (otherAuthors.startsWith('{') || otherAuthors.startsWith('[')) {
        const parsed = JSON.parse(otherAuthors);
        if (parsed.has_other_authors === false || 
            (Array.isArray(parsed.other_authors) && parsed.other_authors.length === 0)) {
          return '';
        }
        if (Array.isArray(parsed.other_authors) && parsed.other_authors.length > 0) {
          return parsed.other_authors
            .map((author: any) => `${author.name} (CPF: ${author.cpf})`)
            .join(', ');
        }
        return otherAuthors;
      }
      return otherAuthors;
    } catch {
      return otherAuthors;
    }
  };

  const coAuthorsText = parseCoAuthors(work.other_authors);
  if (coAuthorsText) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('CO-AUTORES:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    // Usar largura completa da página para co-autores
    const coAuthorsLines = pdf.splitTextToSize(coAuthorsText, 170);
    pdf.text(coAuthorsLines, 20, yPosition + 8);
    yPosition += 8 + (coAuthorsLines.length * 6) + 5;
  }
  
  // **SEÇÃO DE REGISTRO**
  yPosition += 10;
  
  // Data e hora de registro
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('DATA DE REGISTRO:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  const registrationDate = new Date(work.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
  pdf.text(registrationDate, 20, yPosition + 8);
  
  // ID do documento
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('ID DO DOCUMENTO:', 110, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(work.id.substring(0, 16) + '...', 110, yPosition + 8);
  
  yPosition += 25;
  
  // **HASH DE INTEGRIDADE**
  if (work.hash) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('HASH DE INTEGRIDADE (SHA-256):', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    
    // Formatação do hash em blocos
    const hashChunks = work.hash.match(/.{1,40}/g) || [];
    hashChunks.forEach((chunk, index) => {
      pdf.text(chunk, 20, yPosition + (index * 6));
    });
    
    yPosition += (hashChunks.length * 6) + 10;
  }
  
  // **FOOTER** - Tarja preta inferior da primeira página
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.rect(0, 275, 210, 22, 'F');
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Este certificado comprova o registro da obra musical na plataforma COMPUSE', 105, 285, { align: 'center' });
  pdf.text(`compuse.com.br | Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, 292, { align: 'center' });
  
  // **SEGUNDA PÁGINA** - Letra completa (sempre criada)
  pdf.addPage();
  
  // Header da segunda página - faixa mais fina
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.rect(0, 0, 210, 25, 'F');

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LETRA COMPLETA', 105, 16, { align: 'center' });
  
  // Letra completa com sistema de duas colunas
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Configurações para layout em duas colunas
  const pageHeight = 297; // A4 height in mm
  const footerHeight = 22; // Footer height
  const headerHeight = 25; // Header height reduzido
  const availableHeight = pageHeight - headerHeight - footerHeight - 10; // 10mm margin
  const startY = 40;
  const lineHeight = 5;
  const maxLinesPerColumn = Math.floor(availableHeight / lineHeight);
  
  // Largura das colunas
  const columnWidth = 80; // 80mm each column
  const leftColumnX = 20;
  const rightColumnX = 110;
  const gapBetweenColumns = 10;
  
  // Quebrar a letra em linhas que cabem na largura da coluna
  const fullLyricsLines = pdf.splitTextToSize(work.lyrics, columnWidth);
  
  // Se a letra cabe em uma coluna, usar layout simples
  if (fullLyricsLines.length <= maxLinesPerColumn) {
    pdf.text(fullLyricsLines, leftColumnX, startY);
  } else {
    // Layout de duas colunas para letras longas
    const firstColumnLines = fullLyricsLines.slice(0, maxLinesPerColumn);
    const secondColumnLines = fullLyricsLines.slice(maxLinesPerColumn);
    
    // Primeira coluna (esquerda)
    pdf.text(firstColumnLines, leftColumnX, startY);
    
    // Segunda coluna (direita)
    if (secondColumnLines.length > 0) {
      pdf.text(secondColumnLines, rightColumnX, startY);
    }
    
    // Se ainda houver mais texto, adicionar uma nota
    if (secondColumnLines.length > maxLinesPerColumn) {
      const remainingLines = secondColumnLines.length - maxLinesPerColumn;
      pdf.setFontSize(8);
      pdf.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
      pdf.text(`[+${remainingLines} linhas adicionais da letra]`, rightColumnX, startY + (maxLinesPerColumn * lineHeight) + 10);
    }
  }
  
  // Footer da segunda página
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.rect(0, 275, 210, 22, 'F');
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('COMPUSE - Plataforma de Registro Musical', 105, 286, { align: 'center' });
  
  // Download do PDF
  const fileName = `certificado_${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};