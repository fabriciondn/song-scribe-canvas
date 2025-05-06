
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
import { Send } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';

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
    }
  }, [isOpen, getActiveTemplate]);
  
  const handleGenerateDA = () => {
    setIsSending(true);
    
    // Simulate PDF generation and sending
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: 'Documento de Anterioridade gerado!',
        description: email 
          ? `O DA foi enviado para ${email}` 
          : 'O DA foi gerado com sucesso',
      });
      onClose();
    }, 2000);
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleGenerateDA} disabled={isSending}>
            {isSending ? 'Processando...' : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gerar e Enviar DA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
