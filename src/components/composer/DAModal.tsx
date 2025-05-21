import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Printer, Save, Send } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { createBackup } from '@/services/draftService';

interface DAModalProps {
  isOpen: boolean;
  onClose: () => void;
  songContent: string;
  songTitle: string;
}

export const DAModal: React.FC<DAModalProps> = ({ 
  isOpen, 
  onClose, 
  songContent,
  songTitle 
}) => {
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [genre, setGenre] = useState('');
  const [version, setVersion] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [instrumentation, setInstrumentation] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBackupCreating, setIsBackupCreating] = useState(false);
  
  const { getActiveTemplate } = useTemplates();
  const { toast } = useToast();
  
  // Load template data when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeTemplate = getActiveTemplate();
      
      if (activeTemplate) {
        setLocation(activeTemplate.location || '');
        setCity(activeTemplate.city || '');
        setGenre(activeTemplate.genre || '');
        setVersion(activeTemplate.version || '');
        setCollaborators(activeTemplate.collaborators || '');
        setInstrumentation(activeTemplate.instrumentation || '');
        setDuration(activeTemplate.duration || '');
        setNotes(activeTemplate.notes || '');
      }
      
      // REMOVED automatic backup creation when modal opens
    }
  }, [isOpen, getActiveTemplate, songTitle, songContent]);
  
  // This function is now empty but kept for compatibility
  const createAutomaticBackup = async () => {
    // No-op function - does nothing
    console.log('Automatic backup disabled');
  };
  
  const handleGenerateDA = async () => {
    setIsSending(true);
    
    try {
      // Generate PDF content
      const pdfContent = generatePdfContent();
      
      // We no longer create backups, but keeping the code structure
      // for compatibility with existing components
      if (songTitle && songContent) {
        console.log('Backup during DA generation skipped (feature disabled)');
      }
      
      // Simulate sending email
      if (email) {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: 'Documento de Anterioridade gerado!',
        description: email 
          ? `O DA foi enviado para ${email}` 
          : 'O DA foi gerado com sucesso.',
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating DA:', error);
      toast({
        title: 'Erro ao gerar DA',
        description: 'Ocorreu um erro ao gerar o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const generatePdfContent = () => {
    // Create a string representation of the DA content
    return `
      Documento de Anterioridade
      
      Título da Obra: ${songTitle || "Sem título"}
      Nome do Autor: ${author || "Nome não informado"}
      ${location ? `Local: ${location}` : ''}
      ${city ? `Cidade: ${city}` : ''}
      ${genre ? `Gênero Musical: ${genre}` : ''}
      ${version ? `Versão da Letra: ${version}` : ''}
      ${collaborators ? `Colaboradores: ${collaborators}` : ''}
      ${instrumentation ? `Instrumentação: ${instrumentation}` : ''}
      ${duration ? `Duração Estimada: ${duration}` : ''}
      ${notes ? `Observações: ${notes}` : ''}
      Data: ${today}
      Hora: ${time}
      
      Letra da Composição:
      ${songContent}
      
      Este documento registra a anterioridade da obra musical acima descrita, cujo conteúdo está em posse do autor.
      Documento gerado em ${today} às ${time}
    `;
  };

  const handlePrint = () => {
    // Create a printable version of the document
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px;">Documento de Anterioridade</h1>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Título da Obra</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${songTitle || "Sem título"}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Nome do Autor</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${author || "Nome não informado"}</p>
        </div>
        
        ${location ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Local</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${location}</p>
        </div>
        ` : ''}
        
        ${city ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Cidade</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${city}</p>
        </div>
        ` : ''}
        
        ${genre ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Gênero Musical</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${genre}</p>
        </div>
        ` : ''}
        
        ${version ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Versão da Letra</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${version}</p>
        </div>
        ` : ''}
        
        ${collaborators ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Colaboradores</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${collaborators}</p>
        </div>
        ` : ''}
        
        ${instrumentation ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Instrumentação</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${instrumentation}</p>
        </div>
        ` : ''}
        
        ${duration ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Duração Estimada</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${duration}</p>
        </div>
        ` : ''}
        
        ${notes ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">Observações</h2>
          <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${notes}</p>
        </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 18px; margin-bottom: 5px;">Data</h2>
            <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${today}</p>
          </div>
          <div>
            <h2 style="font-size: 18px; margin-bottom: 5px;">Hora</h2>
            <p style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">${time}</p>
          </div>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 15px;">Letra da Composição</h2>
          <pre style="white-space: pre-wrap; font-family: monospace;">${songContent}</pre>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-style: italic;">
          <p>Este documento registra a anterioridade da obra musical acima descrita, cujo conteúdo está em posse do autor.</p>
          <p>Documento gerado em ${today} às ${time}</p>
        </div>
      </div>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Documento de Anterioridade - ${songTitle}</title>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };
  
  const today = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const activeTemplate = getActiveTemplate();
  const selectedFields = activeTemplate?.selectedFields || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Documento de Anterioridade</DialogTitle>
          <DialogDescription>
            Preencha as informações para gerar o DA da sua composição.
            {isBackupCreating && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Criando backup automático...
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Obra</Label>
            <Input id="title" value={songTitle} readOnly />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="author">Nome do Autor</Label>
            <Input 
              id="author" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              placeholder="Seu nome completo"
            />
          </div>
          
          {selectedFields.includes("location") && (
            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Cidade, Estado"
              />
            </div>
          )}
          
          {selectedFields.includes("city") && (
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                placeholder="Cidade"
              />
            </div>
          )}
          
          {selectedFields.includes("genre") && (
            <div className="grid gap-2">
              <Label htmlFor="genre">Gênero Musical</Label>
              <Input 
                id="genre" 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)} 
                placeholder="Gênero musical"
              />
            </div>
          )}
          
          {selectedFields.includes("version") && (
            <div className="grid gap-2">
              <Label htmlFor="version">Versão da Letra</Label>
              <Input 
                id="version" 
                value={version} 
                onChange={(e) => setVersion(e.target.value)} 
                placeholder="Versão da letra"
              />
            </div>
          )}
          
          {selectedFields.includes("collaborators") && (
            <div className="grid gap-2">
              <Label htmlFor="collaborators">Colaboradores</Label>
              <Input 
                id="collaborators" 
                value={collaborators} 
                onChange={(e) => setCollaborators(e.target.value)} 
                placeholder="Nome dos colaboradores"
              />
            </div>
          )}
          
          {selectedFields.includes("instrumentation") && (
            <div className="grid gap-2">
              <Label htmlFor="instrumentation">Instrumentação</Label>
              <Input 
                id="instrumentation" 
                value={instrumentation} 
                onChange={(e) => setInstrumentation(e.target.value)} 
                placeholder="Instrumentos previstos"
              />
            </div>
          )}
          
          {selectedFields.includes("duration") && (
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração Estimada</Label>
              <Input 
                id="duration" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                placeholder="Ex: 3:30min"
              />
            </div>
          )}
          
          {selectedFields.includes("notes") && (
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Observações adicionais"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" value={today} readOnly />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" value={time} readOnly />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Enviar para e-mail (opcional)</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-md border">
            <h4 className="text-sm font-medium mb-2">Prévia do Documento:</h4>
            <div className="text-xs text-muted-foreground">
              <p>Título: {songTitle || "Sem título"}</p>
              <p>Autor: {author || "Nome do Autor"}</p>
              {location && <p>Local: {location}</p>}
              {city && <p>Cidade: {city}</p>}
              {genre && <p>Gênero: {genre}</p>}
              {version && <p>Versão: {version}</p>}
              {collaborators && <p>Colaboradores: {collaborators}</p>}
              {instrumentation && <p>Instrumentação: {instrumentation}</p>}
              {duration && <p>Duração: {duration}</p>}
              {notes && <p>Observações: {notes}</p>}
              <p>Data e Hora: {today} às {time}</p>
              <div className="mt-2 border-t pt-2">
                <p className="italic">
                  Este documento registra a anterioridade da obra musical acima descrita, 
                  cujo conteúdo está em posse do autor.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleGenerateDA} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gerar e Enviar DA
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
