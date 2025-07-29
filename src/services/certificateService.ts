import jsPDF from 'jspdf';

interface RegisteredWork {
  id: string;
  title: string;
  author: string;
  author_cpf?: string;
  author_address?: string;
  other_authors: string | null;
  genre: string;
  style?: string;
  song_version: string;
  lyrics: string;
  hash: string | null;
  created_at: string;
  status: string;
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
    const templateImage = await loadImageAsBase64('/lovable-uploads/a10d0d4b-cf1d-4fbc-954c-cdb4fd0eeacc.png');
    pdf.addImage(templateImage, 'PNG', 0, 0, 210, 297);

    // Carregar e adicionar o selo da Compuse (centralizado e maior)
    const compuseSeal = await loadImageAsBase64('/lovable-uploads/b2e99156-0e7f-46c8-8b49-eafea58416f9.png');
    pdf.addImage(compuseSeal, 'PNG', 80, 10, 50, 50);

    // Carregar e adicionar a waveform
    const waveform = await loadImageAsBase64('/lovable-uploads/21de4260-b9fa-4fc8-aed5-f739a4758d0e.png');
    pdf.addImage(waveform, 'PNG', 20, 50, 170, 15);
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    // Fallback para o método original se as imagens não carregarem
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.text('CERTIFICADO DE REGISTRO DE OBRA MUSICAL', 105, 30, { align: 'center' });
  }

  // **DADOS PRINCIPAIS** - Layout em duas colunas
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  let yPosition = 80;
  
  // Seção título
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DA OBRA REGISTRADA', 20, yPosition);
  
  // Linha decorativa
  pdf.setDrawColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  pdf.setFontSize(11);
  
  // **COLUNA ESQUERDA**
  let leftColumnY = yPosition;
  
  // Título da obra - destacado
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('TÍTULO:', 20, leftColumnY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const titleLines = pdf.splitTextToSize(work.title, 80);
  pdf.text(titleLines, 20, leftColumnY + 8);
  leftColumnY += 8 + (titleLines.length * 6);
  
  // Autor principal
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('AUTOR PRINCIPAL:', 20, leftColumnY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(work.author, 20, leftColumnY + 8);
  leftColumnY += 20;
  
  // CPF do autor
  if (work.author_cpf) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('CPF:', 20, leftColumnY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(work.author_cpf, 20, leftColumnY + 8);
    leftColumnY += 20;
  }
  
  // Endereço do autor
  if (work.author_address) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('ENDEREÇO:', 20, leftColumnY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const addressLines = pdf.splitTextToSize(work.author_address, 80);
    pdf.text(addressLines, 20, leftColumnY + 8);
    leftColumnY += 8 + (addressLines.length * 6);
  }
  
  // **COLUNA DIREITA**
  let rightColumnY = yPosition;
  
  // Gênero e estilo
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('GÊNERO MUSICAL:', 110, rightColumnY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(work.genre, 110, rightColumnY + 8);
  rightColumnY += 20;
  
  if (work.style) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('ESTILO:', 110, rightColumnY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(work.style, 110, rightColumnY + 8);
    rightColumnY += 20;
  }
  
  // Versão
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('VERSÃO:', 110, rightColumnY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(work.song_version, 110, rightColumnY + 8);
  rightColumnY += 20;
  
  // Co-autores (somente se houver co-autores válidos)
  if (work.other_authors && work.other_authors.trim() !== '' && !work.other_authors.includes('has_other_authors":false')) {
    try {
      // Verifica se é um JSON malformado
      if (work.other_authors.startsWith('{') || work.other_authors.startsWith('[')) {
        const parsed = JSON.parse(work.other_authors);
        if (parsed.has_other_authors === false || (Array.isArray(parsed.other_authors) && parsed.other_authors.length === 0)) {
          // Não exibe co-autores se não há co-autores válidos
        } else {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
          pdf.text('CO-AUTORES:', 110, rightColumnY);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          const coAuthorsLines = pdf.splitTextToSize(work.other_authors, 80);
          pdf.text(coAuthorsLines, 110, rightColumnY + 8);
          rightColumnY += 8 + (coAuthorsLines.length * 6);
        }
      } else {
        // É texto simples, exibe normalmente
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text('CO-AUTORES:', 110, rightColumnY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        const coAuthorsLines = pdf.splitTextToSize(work.other_authors, 80);
        pdf.text(coAuthorsLines, 110, rightColumnY + 8);
        rightColumnY += 8 + (coAuthorsLines.length * 6);
      }
    } catch (error) {
      // Se não conseguir fazer parse, exibe como texto simples
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.text('CO-AUTORES:', 110, rightColumnY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const coAuthorsLines = pdf.splitTextToSize(work.other_authors, 80);
      pdf.text(coAuthorsLines, 110, rightColumnY + 8);
      rightColumnY += 8 + (coAuthorsLines.length * 6);
    }
  }
  
  // **SEÇÃO DE REGISTRO**
  yPosition = Math.max(leftColumnY, rightColumnY) + 15;
  
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
  
  // **LETRA DA MÚSICA**
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text('LETRA DA MÚSICA:', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  // Determina espaço disponível para letra
  const remainingSpace = 250 - yPosition;
  const maxLyricsLines = Math.floor(remainingSpace / 4);
  
  const lyricsLines = pdf.splitTextToSize(work.lyrics, 170);
  const displayLyricsLines = lyricsLines.slice(0, maxLyricsLines);
  
  if (lyricsLines.length > maxLyricsLines) {
    displayLyricsLines[displayLyricsLines.length - 1] = displayLyricsLines[displayLyricsLines.length - 1] + ' [continua...]';
  }
  
  pdf.text(displayLyricsLines, 20, yPosition);
  
  // **FOOTER** - Tarja preta inferior
  pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.rect(0, 275, 210, 22, 'F');
  
  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Este certificado comprova o registro da obra musical na plataforma COMPUSE', 105, 285, { align: 'center' });
  pdf.text(`compuse.com.br | Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, 292, { align: 'center' });
  
  // **SEGUNDA PÁGINA** - Letra completa (se necessário)
  if (lyricsLines.length > maxLyricsLines) {
    pdf.addPage();
    
    // Header da segunda página
    pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.rect(0, 0, 210, 35, 'F');
    
    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LETRA COMPLETA', 105, 22, { align: 'center' });
    
    // Letra completa
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const fullLyricsLines = pdf.splitTextToSize(work.lyrics, 170);
    pdf.text(fullLyricsLines, 20, 50);
    
    // Footer da segunda página
    pdf.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.rect(0, 275, 210, 22, 'F');
    
    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('COMPUSE - Plataforma de Registro Musical', 105, 286, { align: 'center' });
  }
  
  // Download do PDF
  const fileName = `certificado_${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};