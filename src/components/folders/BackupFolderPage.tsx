
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, File, FileText, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Backup, getBackups } from '@/services/backupService';
import { format } from 'date-fns';

export const BackupFolderPage: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadBackups = async () => {
      try {
        const fetchedBackups = await getBackups();
        setBackups(fetchedBackups);
      } catch (error) {
        console.error('Error fetching backups:', error);
        toast({
          title: 'Erro ao carregar backups',
          description: 'Não foi possível carregar os backups.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBackups();
  }, [toast]);

  const openBackup = async (backup: Backup) => {
    setSelectedBackup(backup);
  };

  const downloadBackup = (backup: Backup) => {
    if (!backup.file_url) return;
    
    // Create an anchor element and trigger download
    const a = document.createElement('a');
    a.href = backup.file_url;
    a.download = `${backup.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pasta de Backup do Sistema</h2>
        <div className="text-sm text-muted-foreground">
          Esta pasta contém backups automáticos de suas composições.
          Estes arquivos não podem ser excluídos.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backups.length === 0 ? (
          <div className="col-span-full text-center p-8 border rounded-lg bg-muted/10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum backup encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Os backups das suas composições serão salvos aqui automaticamente.
            </p>
          </div>
        ) : (
          backups.map(backup => (
            <Card 
              key={backup.id} 
              className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => openBackup(backup)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-primary mr-2" />
                    <CardTitle className="text-base">{backup.title}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadBackup(backup);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {backup.created_at && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {selectedBackup && selectedBackup.file_url && (
        <div className="mt-8 p-4 border rounded-lg bg-background">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{selectedBackup.title}</h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => downloadBackup(selectedBackup)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <iframe 
            src={selectedBackup.file_url} 
            className="w-full h-96 border rounded bg-white"
            title={selectedBackup.title}
          />
        </div>
      )}
    </div>
  );
};
