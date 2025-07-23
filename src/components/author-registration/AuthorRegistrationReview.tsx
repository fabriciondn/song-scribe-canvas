import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileAudio, User, Music, Clock, FileText, Info, Shield } from 'lucide-react';
import { AuthorRegistrationData } from '@/pages/AuthorRegistration';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';

interface AuthorRegistrationReviewProps {
  data: AuthorRegistrationData;
  onRegister: () => void;
}

export const AuthorRegistrationReview: React.FC<AuthorRegistrationReviewProps> = ({
  data,
  onRegister,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshCredits } = useUserCredits();

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Upload do arquivo de áudio
      let audioFilePath = null;
      
      if (data.audioFile) {
        const fileExt = data.audioFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('author-registrations')
          .upload(fileName, data.audioFile);

        if (uploadError) {
          throw new Error('Erro ao fazer upload do arquivo de áudio');
        }

        audioFilePath = uploadData.path;
      }

      // Criar registro no banco de dados
      const { error: insertError } = await supabase
        .from('author_registrations')
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          other_authors: data.otherAuthors || null,
          genre: data.genre,
          rhythm: data.rhythm,
          song_version: data.songVersion,
          lyrics: data.lyrics,
          audio_file_path: audioFilePath,
          additional_info: data.additionalInfo || null,
          terms_accepted: data.termsAccepted,
          status: 'registered',
        });

      if (insertError) {
        throw new Error('Erro ao registrar a música');
      }

      // Decrementar crédito do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileData) {
        const newCredits = Math.max((profileData.credits || 0) - 1, 0);
        await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', user.id);
      }

      toast({
        title: 'Sucesso!',
        description: 'Sua música foi registrada com sucesso!',
      });

      // Refresh dos créditos para mostrar a atualização
      refreshCredits();

      onRegister();
    } catch (error) {
      console.error('Erro ao registrar música:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao registrar a música',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Revisão do Registro Autoral
          </CardTitle>
          <CardDescription>
            Revise todas as informações antes de finalizar o registro. 
            Esta ação consumirá 1 crédito da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Music className="h-5 w-5" />
              Informações da Música
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="text-base">{data.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Autor Principal</label>
                <p className="text-base">{data.author}</p>
              </div>
              
              {data.otherAuthors && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Outros Autores</label>
                  <p className="text-base">{data.otherAuthors}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                <Badge variant="secondary">{data.genre}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ritmo</label>
                <Badge variant="secondary">{data.rhythm}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Versão</label>
                <p className="text-base">{data.songVersion}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Letra */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4" />
              Letra
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{data.lyrics}</pre>
            </div>
          </div>

          <Separator />

          {/* Arquivo de áudio */}
          {data.audioFile && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <FileAudio className="h-4 w-4" />
                Arquivo de Áudio
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileAudio className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{data.audioFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(data.audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          {data.additionalInfo && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Info className="h-4 w-4" />
                  Informações Adicionais
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">{data.additionalInfo}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Confirmações */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4" />
              Confirmações
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.termsAccepted ? "default" : "destructive"}>
                {data.termsAccepted ? "✓" : "✗"}
              </Badge>
              <span className="text-sm">
                Termos e condições aceitos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de registro */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" disabled={isRegistering}>
              {isRegistering ? 'Registrando...' : 'Confirmar Registro'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Registro Autoral</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a registrar "{data.title}" como obra autoral. 
                Esta ação consumirá 1 crédito da sua conta e não pode ser desfeita.
                
                Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegister} disabled={isRegistering}>
                {isRegistering ? 'Registrando...' : 'Sim, Registrar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};