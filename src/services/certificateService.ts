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

    // Carregar e adicionar o selo da Compuse (centro superior conforme template)
    const compuseSeal = await loadImageAsBase64('/lovable-uploads/b2e99156-0e7f-46c8-8b49-eafea58416f9.png');
    pdf.addImage(compuseSeal, 'PNG', 87, 85, 36, 36);

    // Carregar e adicionar o selo do Brasil (canto superior direito conforme template)
    const brazilFlag = await loadImageAsBase64('/lovable-uploads/b59e106c-f55f-44c4-9ac6-5f29494e1251.png');
    pdf.addImage(brazilFlag, 'PNG', 175, 85, 25, 18);

    // Carregar e adicionar a waveform (posição no meio da página conforme template)
    const waveform = await loadImageAsBase64('/lovable-uploads/21de4260-b9fa-4fc8-aed5-f739a4758d0e.png');
    pdf.addImage(waveform, 'PNG', 5, 185, 200, 30);
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    // Fallback para o método original se as imagens não carregarem
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, 210, 297, 'F');
  }

  // **TÍTULO PRINCIPAL** (posição fixa no topo)
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(16);
  pdf.text('CERTIFICADO DE REGISTRO DE OBRA MUSICAL', 105, 30, { align: 'center' });

  // **DADOS CONFORME TEMPLATE EXATO**
  let yPosition = 140; // Posição inicial após os selos
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(12);
  
  // Título
  pdf.text('Título:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.title, 55, yPosition);
  
  // Gênero  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Gênero:', 20, yPosition + 15);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.genre || '', 55, yPosition + 15);
  
  // Variação estilo
  pdf.setFont('helvetica', 'bold');
  pdf.text('Variação estilo:', 20, yPosition + 30);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.style || '', 85, yPosition + 30);
  
  // Versão
  pdf.setFont('helvetica', 'bold');
  pdf.text('Versão:', 20, yPosition + 45);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.song_version || '', 55, yPosition + 45);
  
  yPosition += 70;
  
  // **AUTOR**
  pdf.setFont('helvetica', 'bold');
  pdf.text('Autor:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  
  let authorText = work.author;
  if (work.author_cpf) {
    authorText += ` | CPF: ${work.author_cpf}`;
  }
  pdf.text(authorText, 55, yPosition);
  
  // Endereço
  if (work.author_address) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Endereço:', 20, yPosition + 15);
    pdf.setFont('helvetica', 'normal');
    pdf.text(work.author_address, 70, yPosition + 15);
    yPosition += 15;
  }
  
  // Co-autor
  pdf.setFont('helvetica', 'bold');
  pdf.text('Co-autor:', 20, yPosition + 15);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.other_authors || '', 70, yPosition + 15);
  
  yPosition += 35;
  
  // **DATA DE REGISTRO**
  pdf.setFont('helvetica', 'bold');
  pdf.text('Data de Registro:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  
  const registrationDate = new Date(work.created_at).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).replace(' às ', ' às ');
  
  pdf.text(registrationDate, 105, yPosition);
  
  yPosition += 25;
  
  // **HASH DE INTEGRIDADE**
  if (work.hash) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.text('HASH DE INTEGRIDADE:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 150, 0); // Verde como no template
    
    // Hash em duas linhas como no template
    const hashLine1 = work.hash.substring(0, 32);
    const hashLine2 = work.hash.substring(32);
    
    pdf.text(hashLine1, 20, yPosition + 12);
    pdf.text(hashLine2, 20, yPosition + 20);
    
    yPosition += 35;
  }
  
  // Posicionar a letra abaixo da waveform (posição 220)
  const lyricsStartPosition = 220;
  const lyricsLines = pdf.splitTextToSize(work.lyrics, 170);
  const availableSpace = 280 - lyricsStartPosition; // Espaço disponível até o fim da página
  const maxLyricsLines = Math.floor(availableSpace / 5);
  const needsSecondPage = lyricsLines.length > maxLyricsLines;
  
  // **LETRA DA MÚSICA** 
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(14);
  pdf.text('LETRA DA MÚSICA:', 20, lyricsStartPosition);
  
  // Conteúdo da letra
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  if (!needsSecondPage) {
    // Se cabe na primeira página, mostra a letra completa
    pdf.text(lyricsLines, 20, lyricsStartPosition + 15);
  } else {
    // Se não cabe, mostra apenas parte da letra
    const previewLines = lyricsLines.slice(0, maxLyricsLines - 2);
    pdf.text(previewLines, 20, lyricsStartPosition + 15);
    
    // Indica que continua na próxima página
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('(continua na próxima página)', 20, lyricsStartPosition + 15 + (previewLines.length * 5) + 5);
  }
  
  // **SEGUNDA PÁGINA** - Letra completa (se necessário)
  if (needsSecondPage) {
    pdf.addPage();
    
    try {
      // Usar apenas o template de fundo na segunda página (sem elementos)
      const templateImage = await loadImageAsBase64('/lovable-uploads/a10d0d4b-cf1d-4fbc-954c-cdb4fd0eeacc.png');
      pdf.addImage(templateImage, 'PNG', 0, 0, 210, 297);
    } catch (error) {
      console.error('Erro ao carregar template para segunda página:', error);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, 210, 297, 'F');
    }
    
    // Título da segunda página
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.setFontSize(16);
    pdf.text('CERTIFICADO DE REGISTRO DE OBRA MUSICAL', 105, 30, { align: 'center' });
    
    // Letra completa
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    pdf.text(lyricsLines, 20, 50);
  }
  
  // Download do PDF
  const fileName = `certificado_${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};