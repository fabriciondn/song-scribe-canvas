import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  artistic_name: string | null;
  cpf: string | null;
  cellphone: string | null;
  hasRegisteredWork: boolean;
  totalWorks: number;
  conversionDate: string;
}

interface AffiliateReferralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateId: string;
  affiliateName: string;
}

export default function AffiliateReferralsModal({
  isOpen,
  onClose,
  affiliateId,
  affiliateName,
}: AffiliateReferralsModalProps) {
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && affiliateId) {
      loadReferredUsers();
    }
  }, [isOpen, affiliateId]);

  const loadReferredUsers = async () => {
    setIsLoading(true);
    try {
      // Buscar conversões do afiliado
      const { data: conversions, error: conversionError } = await supabase
        .from('affiliate_conversions')
        .select('user_id, created_at')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (conversionError) throw conversionError;

      if (!conversions || conversions.length === 0) {
        setReferredUsers([]);
        setIsLoading(false);
        return;
      }

      const userIds = conversions.map(c => c.user_id);

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, artistic_name, cpf, cellphone')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Buscar obras registradas por cada usuário
      const { data: works, error: worksError } = await supabase
        .from('author_registrations')
        .select('user_id, status')
        .in('user_id', userIds);

      if (worksError) throw worksError;

      // Combinar dados
      const usersData: ReferredUser[] = conversions.map(conversion => {
        const profile = profiles?.find(p => p.id === conversion.user_id);
        const userWorks = works?.filter(w => w.user_id === conversion.user_id) || [];
        const hasRegistered = userWorks.some(w => 
          w.status === 'registered' || w.status === 'completed'
        );

        return {
          id: conversion.user_id,
          name: profile?.name || 'Nome não disponível',
          email: profile?.email || 'Email não disponível',
          avatar_url: profile?.avatar_url || null,
          artistic_name: profile?.artistic_name || null,
          cpf: profile?.cpf || null,
          cellphone: profile?.cellphone || null,
          hasRegisteredWork: hasRegistered,
          totalWorks: userWorks.filter(w => w.status === 'registered' || w.status === 'completed').length,
          conversionDate: new Date(conversion.created_at).toLocaleDateString('pt-BR'),
        };
      });

      setReferredUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários indicados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Usuários Indicados - {affiliateName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Nenhum usuário indicado ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nome Artístico</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Obra Registrada</TableHead>
                <TableHead>Data Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.cpf && (
                          <p className="text-xs text-muted-foreground">
                            CPF: {user.cpf}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.artistic_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.cellphone || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.hasRegisteredWork ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <Badge variant="default" className="bg-green-500">
                            {user.totalWorks} obra{user.totalWorks !== 1 ? 's' : ''}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                          <Badge variant="secondary">Sem registro</Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.conversionDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
