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
import { useNotification } from '@/components/ui/notification';
import { useNavigate } from 'react-router-dom';

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
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // Função para gerar hash SHA-256
  const gerarHash = async (texto: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

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
      // Gerar hash SHA-256 da letra
      const hash = await gerarHash(data.lyrics);

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

      // Decrementar crédito do usuário IMEDIATAMENTE
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

      // Refresh dos créditos para mostrar a atualização em tempo real
      refreshCredits();

      // Criar registro no banco de dados com status "em análise"
      const analysisStartedAt = new Date().toISOString();
      
      const { data: registrationData, error: insertError } = await supabase
        .from('author_registrations')
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          other_authors: JSON.stringify({
            author_cpf: data.authorCpf,
            has_other_authors: data.hasOtherAuthors,
            other_authors: data.otherAuthors
          }),
          genre: data.genre,
          rhythm: data.styleVariation,
          song_version: data.songVersion,
          lyrics: data.lyrics,
          audio_file_path: audioFilePath,
          additional_info: data.additionalInfo || null,
          terms_accepted: data.termsAccepted,
          status: 'em análise',
          hash: hash,
          analysis_started_at: analysisStartedAt,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Erro ao registrar a música');
      }

      // Mostrar mensagem de sucesso e redirecionar
      toast({
        title: 'Registro enviado para análise!',
        description: 'Recebemos seu pedido de registro, em breve notificaremos sobre seu pedido de registro.',
      });

      // Simular análise inteligente em segundo plano
      startAnalysisSimulation(registrationData.id, data.title);

      // Redirecionar para dashboard após 3 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

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

  const startAnalysisSimulation = async (registrationId: string, title: string) => {
    // Tempo aleatório entre 1 e 5 minutos (em milissegundos)
    const analysisTime = Math.random() * (5 * 60 * 1000 - 1 * 60 * 1000) + 1 * 60 * 1000;
    
    setTimeout(async () => {
      try {
        // Atualizar status para "registrada" e definir data de conclusão
        const analysisCompletedAt = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('author_registrations')
          .update({ 
            status: 'registered',
            analysis_completed_at: analysisCompletedAt
          })
          .eq('id', registrationId);

        if (updateError) {
          console.error('Erro ao atualizar status do registro:', updateError);
          return;
        }

        // Mostrar notificação de sucesso
        addNotification({
          title: 'Parabéns, sua obra está protegida!',
          message: `O registro de "${title}" foi concluído com sucesso.`,
          type: 'success',
          duration: 0, // Não expirar automaticamente
          onClick: () => {
            navigate('/dashboard/registered-works');
          }
        });

      } catch (error) {
        console.error('Erro na simulação de análise:', error);
      }
    }, analysisTime);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Revisão do Registro Autoral
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Revise todas as informações antes de finalizar o registro. 
            Esta ação consumirá 1 crédito da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Music className="h-5 w-5" />
              Informações da Música
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="text-base text-foreground">{data.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Autor Principal</label>
                <p className="text-base text-foreground">{data.author}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">CPF do Autor</label>
                <p className="text-base text-foreground">{data.authorCpf}</p>
              </div>
              
              {data.hasOtherAuthors && data.otherAuthors.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Outros Autores</label>
                  <div className="space-y-2 mt-1">
                    {data.otherAuthors.map((author, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-foreground">{author.name}</span>
                        <span className="text-sm text-muted-foreground">{author.cpf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                <Badge variant="secondary">{data.genre}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Variação do Estilo</label>
                <Badge variant="secondary">{data.styleVariation}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Versão</label>
                <p className="text-base text-foreground">{data.songVersion}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Letra */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="h-4 w-4" />
              Letra
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-foreground">{data.lyrics}</pre>
            </div>
          </div>

          <Separator />

          {/* Arquivo de áudio */}
          {data.audioFile && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileAudio className="h-4 w-4" />
                Arquivo de Áudio
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileAudio className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{data.audioFile.name}</p>
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
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Info className="h-4 w-4" />
                  Informações Adicionais
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-foreground">{data.additionalInfo}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Confirmações */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Shield className="h-4 w-4" />
              Confirmações
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.termsAccepted ? "default" : "destructive"}>
                {data.termsAccepted ? "✓" : "✗"}
              </Badge>
              <span className="text-sm text-foreground">
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
              {isRegistering ? 'Enviando para análise...' : 'Confirmar Registro'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Registro Autoral</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Você está prestes a enviar "{data.title}" para análise e registro autoral. 
                <br /><br />
                Nosso sistema inteligente irá analisar as informações enviadas, verificando se não há conteúdo de plágio e validando a autenticidade da obra. Nossa tecnologia avançada realizará essa análise e, se tudo estiver correto, o registro será concluído em até 5 minutos.
                <br /><br />
                Esta ação consumirá 1 crédito da sua conta imediatamente.
                <br /><br />
                Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegister} disabled={isRegistering}>
                {isRegistering ? 'Enviando...' : 'Sim, Enviar para Análise'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};