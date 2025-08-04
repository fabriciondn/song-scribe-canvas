import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText } from 'lucide-react';

interface UserNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export const UserNotesModal = ({ isOpen, onClose, user }: UserNotesModalProps) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Buscar notas existentes quando o modal abrir
  useEffect(() => {
    const fetchNotes = async () => {
      if (!isOpen || !user.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('moderator_notes')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar notas:', error);
          return;
        }

        setNotes(data?.moderator_notes || '');
      } catch (error) {
        console.error('Erro ao buscar notas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [isOpen, user.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ moderator_notes: notes })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Notas salvas',
        description: 'As notas foram atualizadas com sucesso.',
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar as notas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Notas - {user.name || user.email}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notas do Moderador</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas observações sobre este usuário..."
              className="min-h-32 mt-2"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};