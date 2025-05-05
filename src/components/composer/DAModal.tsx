
import React, { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { toast } = useToast();
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Documento de Anterioridade</DialogTitle>
          <DialogDescription>
            Preencha as informações para gerar o DA da sua composição.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
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
          
          <div className="grid gap-2">
            <Label htmlFor="location">Local</Label>
            <Input 
              id="location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="Cidade, Estado"
            />
          </div>
          
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
              <p>Local: {location || "Local"}</p>
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
