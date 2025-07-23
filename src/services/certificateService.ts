import jsPDF from 'jspdf';

interface RegisteredWork {
  id: string;
  title: string;
  author: string;
  other_authors: string | null;
  genre: string;
  song_version: string;
  lyrics: string;
  hash: string | null;
  created_at: string;
  status: string;
}

export const generateCertificatePDF = async (work: RegisteredWork) => {
  const pdf = new jsPDF();
  
  // Configurações de cores e estilos
  const primaryColor: [number, number, number] = [37, 99, 235]; // RGB para azul primário
  const secondaryColor: [number, number, number] = [75, 85, 99]; // RGB para cinza escuro
  const accentColor: [number, number, number] = [34, 197, 94]; // RGB para verde

  // Cabeçalho
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, 210, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFICADO DE REGISTRO', 105, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('DE OBRA MUSICAL', 105, 30, { align: 'center' });

  // Reset da cor do texto
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  // Informações principais
  let yPosition = 60;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DA OBRA:', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Título da obra
  pdf.setFont('helvetica', 'bold');
  pdf.text('Título:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.title, 45, yPosition);
  
  yPosition += 10;
  
  // Autor principal
  pdf.setFont('helvetica', 'bold');
  pdf.text('Autor:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.author, 45, yPosition);
  
  yPosition += 10;
  
  // Co-autores (se houver)
  if (work.other_authors) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Co-autores:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(work.other_authors, 55, yPosition);
    yPosition += 10;
  }
  
  // Gênero
  pdf.setFont('helvetica', 'bold');
  pdf.text('Gênero:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.genre, 45, yPosition);
  
  yPosition += 10;
  
  // Versão
  pdf.setFont('helvetica', 'bold');
  pdf.text('Versão:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(work.song_version, 45, yPosition);
  
  yPosition += 20;
  
  // Data de registro
  pdf.setFont('helvetica', 'bold');
  pdf.text('Data de Registro:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  const registrationDate = new Date(work.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(registrationDate, 70, yPosition);
  
  yPosition += 20;
  
  // Hash de integridade
  if (work.hash) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('HASH DE INTEGRIDADE:', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    
    // Quebra o hash em linhas para melhor visualização
    const hashChunks = work.hash.match(/.{1,32}/g) || [];
    hashChunks.forEach((chunk, index) => {
      pdf.text(chunk, 20, yPosition + (index * 8));
    });
    
    yPosition += (hashChunks.length * 8) + 10;
  }
  
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Letra da música (primeira página apenas um resumo)
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LETRA DA MÚSICA:', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Limita a letra para não passar da primeira página
  const lyricsPreview = work.lyrics.length > 400 
    ? work.lyrics.substring(0, 400) + '...' 
    : work.lyrics;
  
  const splitText = pdf.splitTextToSize(lyricsPreview, 170);
  const remainingSpace = 280 - yPosition;
  const maxLines = Math.floor(remainingSpace / 6);
  
  const displayLines = splitText.slice(0, maxLines);
  pdf.text(displayLines, 20, yPosition);
  
  // Rodapé
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 270, 210, 27, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Este certificado atesta o registro da obra musical na plataforma.', 105, 280, { align: 'center' });
  pdf.text(`Documento ID: ${work.id}`, 105, 290, { align: 'center' });
  
  // Se a letra for muito longa, adiciona uma segunda página
  if (work.lyrics.length > 400) {
    pdf.addPage();
    
    // Cabeçalho da segunda página
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LETRA COMPLETA', 105, 30, { align: 'center' });
    
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const fullLyricsLines = pdf.splitTextToSize(work.lyrics, 170);
    pdf.text(fullLyricsLines, 20, 50);
  }
  
  // Download do PDF
  const fileName = `certificado_${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};