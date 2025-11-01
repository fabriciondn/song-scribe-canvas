import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [moderatorNotes, setModeratorNotes] = useState(user?.moderator_notes || '');
  const [userOrigin, setUserOrigin] = useState<{
    type: 'affiliate' | 'moderator' | 'direct';
    referrerName?: string;
    referrerId?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setModeratorNotes(user.moderator_notes || '');
      fetchUserOrigin();
    }
  }, [user]);

  const fetchUserOrigin = async () => {
    if (!user?.id) return;

    try {
      // Verificar se veio por afiliado
      const { data: affiliateClick, error: affiliateError } = await supabase
        .from('affiliate_clicks')
        .select('affiliate_id')
        .eq('user_id', user.id)
        .eq('converted', true)
        .maybeSingle();

      if (affiliateClick && !affiliateError) {
        // Buscar dados do afiliado
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('user_id')
          .eq('id', affiliateClick.affiliate_id)
          .single();

        if (affiliate) {
          // Buscar perfil do afiliado
          const { data: affiliateProfile } = await supabase
            .from('profiles')
            .select('name, artistic_name')
            .eq('id', affiliate.user_id)
            .single();

          setUserOrigin({
            type: 'affiliate',
            referrerName: affiliateProfile?.artistic_name || affiliateProfile?.name || 'Afiliado',
            referrerId: affiliate.user_id
          });
          return;
        }
      }

      // Verificar se foi criado por moderador
      const { data: moderatorUser, error: moderatorError } = await supabase
        .from('moderator_users')
        .select('moderator_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (moderatorUser && !moderatorError) {
        // Buscar perfil do moderador
        const { data: moderatorProfile } = await supabase
          .from('profiles')
          .select('name, artistic_name')
          .eq('id', moderatorUser.moderator_id)
          .single();

        setUserOrigin({
          type: 'moderator',
          referrerName: moderatorProfile?.artistic_name || moderatorProfile?.name || 'Moderador',
          referrerId: moderatorUser.moderator_id
        });
        return;
      }

      // Se não encontrou em nenhum, é cadastro direto
      setUserOrigin({
        type: 'direct'
      });
    } catch (error) {
      console.error('Erro ao buscar origem do usuário:', error);
      setUserOrigin({
        type: 'direct'
      });
    }
  };

  const handleUpdateCredits = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Créditos atualizados com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar créditos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ moderator_notes: moderatorNotes })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Notas atualizadas com sucesso',
      });

      onUserUpdate();
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar notas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Origem do Usuário */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <Label className="text-base font-semibold mb-2 block">Origem do Cadastro</Label>
            {userOrigin ? (
              <div className="flex items-center gap-2">
                {userOrigin.type === 'affiliate' && (
                  <>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Via Afiliado
                    </Badge>
                    <span className="text-sm">
                      Indicado por: <span className="font-semibold">{userOrigin.referrerName}</span>
                    </span>
                  </>
                )}
                {userOrigin.type === 'moderator' && (
                  <>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Criado por Moderador
                    </Badge>
                    <span className="text-sm">
                      Moderador: <span className="font-semibold">{userOrigin.referrerName}</span>
                    </span>
                  </>
                )}
                {userOrigin.type === 'direct' && (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Cadastro Direto
                    </Badge>
                    <span className="text-sm">
                      Usuário se cadastrou de forma independente
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Carregando origem...</p>
            )}
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <p className="text-sm">{user.name || 'Não informado'}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label>Nome Artístico</Label>
              <p className="text-sm">{user.artistic_name || 'Não informado'}</p>
            </div>
            <div>
              <Label>CPF</Label>
              <p className="text-sm">{user.cpf || 'Não informado'}</p>
            </div>
          </div>

          {/* Créditos */}
          <div className="space-y-2">
            <Label htmlFor="credits">Créditos</Label>
            <div className="flex gap-2">
              <Input
                id="credits"
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                min="0"
              />
              <Button onClick={handleUpdateCredits} disabled={isLoading}>
                Atualizar
              </Button>
            </div>
          </div>

          {/* Notas do Moderador */}
          <div className="space-y-2">
            <Label htmlFor="moderator-notes">Notas do Moderador</Label>
            <Textarea
              id="moderator-notes"
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              rows={4}
              placeholder="Adicione notas sobre este usuário..."
            />
            <Button onClick={handleUpdateNotes} disabled={isLoading}>
              Salvar Notas
            </Button>
          </div>

          {/* Endereço */}
          {(user.street || user.city || user.state) && (
            <div className="space-y-2">
              <Label>Endereço</Label>
              <p className="text-sm">
                {[user.street, user.number, user.neighborhood, user.city, user.state, user.cep]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
