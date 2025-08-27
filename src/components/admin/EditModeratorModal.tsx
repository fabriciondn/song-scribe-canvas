
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditModeratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moderator: {
    user_id: string;
    profile: {
      name: string | null;
      email: string | null;
      credits?: number;
    };
  } | null;
  onModeratorUpdated: () => void;
}

export const EditModeratorModal: React.FC<EditModeratorModalProps> = ({
  isOpen,
  onClose,
  moderator,
  onModeratorUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    credits: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (moderator?.profile) {
      setFormData({
        name: moderator.profile.name || '',
        email: moderator.profile.email || '',
        credits: moderator.profile.credits || 0
      });
    }
  }, [moderator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderator) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('admin_update_moderator', {
        target_moderator_id: moderator.user_id,
        new_name: formData.name,
        new_email: formData.email,
        new_credits: formData.credits
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Moderador atualizado com sucesso',
      });

      onModeratorUpdated();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar moderador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar moderador',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Moderador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do moderador"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Créditos</Label>
            <Input
              id="credits"
              type="number"
              min="0"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
