
import React, { useState, useEffect } from 'react';
import { Backup, getBackups } from '@/services/drafts/backupService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const BackupFolderPage: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    } else if (isAuthenticated && !authLoading) {
      loadBackups();
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const data = await getBackups();
      setBackups(data);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        title: 'Erro ao carregar backups',
        description: 'Não foi possível carregar seus backups.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const downloadBackup = (backup: Backup) => {
    if (backup.file_url) {
      window.open(backup.file_url, '_blank');
    } else {
      toast({
        title: 'Erro ao baixar',
        description: 'URL do arquivo não disponível.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-24 mr-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/folders')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Pasta de Backup</h1>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Esta é uma pasta do sistema que armazena backups automáticos das suas composições.
        Os arquivos nesta pasta não podem ser excluídos para garantir que você não perca seu trabalho.
      </p>
      
      {backups.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Nenhum backup encontrado</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Os backups aparecerão aqui quando você criar composições e exportar documentos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {backups.map(backup => (
            <Card key={backup.id} className="group hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{backup.title}</CardTitle>
                    <CardDescription>
                      Criado em {formatDate(backup.created_at)}
                    </CardDescription>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => downloadBackup(backup)}
                    title="Baixar backup"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Arquivo de texto (.txt)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
