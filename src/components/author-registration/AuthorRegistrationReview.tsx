import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileAudio, User, Music, Clock, FileText, Info, Shield } from 'lucide-react';
import { AuthorRegistrationData } from '@/pages/AuthorRegistration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  // Função para gerar hash SHA-256
  const gerarHash = async (texto: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Função melhorada para upload de áudio com validações
  const uploadAudioFile = async (audioFile: File, userId: string): Promise<string | null> => {
    try {
      console.log('🎵 Iniciando upload do arquivo:', audioFile.name);
      console.log('📊 Tamanho do arquivo:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('🎧 Tipo do arquivo:', audioFile.type);
      console.log('👤 User ID para upload:', userId);

      // Validação de tamanho do arquivo (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (audioFile.size > maxSize) {
        throw new Error('Arquivo muito grande. O tamanho máximo é de 50MB.');
      }

      // Validação de tipo de arquivo
      const allowedTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 
        'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/x-m4a'
      ];
      
      if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i)) {
        throw new Error('Tipo de arquivo não suportado. Use MP3, WAV, M4A, OGG ou FLAC.');
      }
      
      // Gerar nome único para o arquivo
      const fileExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`;
      
      console.log('📁 Nome do arquivo gerado:', fileName);
      
      // Fazer upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('author-registrations')
        .upload(fileName, audioFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: audioFile.type || 'audio/mpeg'
        });

      if (uploadError) {
        console.error('❌ Erro detalhado no upload:', uploadError);
        
        // Tratamento específico de erros
        if (uploadError.message.includes('Payload too large')) {
          throw new Error('Arquivo muito grande. Reduza o tamanho e tente novamente.');
        } else if (uploadError.message.includes('Invalid mime type')) {
          throw new Error('Tipo de arquivo não permitido. Use apenas arquivos de áudio.');
        } else if (uploadError.message.includes('Policy')) {
          throw new Error('Erro de permissão. Verifique se você está logado corretamente.');
        } else {
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }
      }

      if (!uploadData?.path) {
        console.error('❌ Upload realizado mas path não retornado:', uploadData);
        throw new Error('Upload incompleto - caminho do arquivo não disponível');
      }

      console.log('✅ Upload realizado com sucesso:', uploadData.path);
      return uploadData.path;
      
    } catch (error) {
      console.error('❌ Erro completo no upload:', error);
      throw error;
    }
  };

  const handleRegister = async () => {
    console.log('🚀 Iniciando processo de registro...');
    
    // Validação robusta de autenticação
    console.log('🔍 Debug de autenticação:', {
      user: user ? { id: user.id, email: user.email } : null,
      currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null
    });

    // Usar o hook useCurrentUser que já resolve corretamente a impersonação
    const targetUserId = currentUser?.id;
    
    console.log('👤 Target User ID:', targetUserId);
    
    if (!targetUserId || !user) {
      console.error('❌ ERRO CRÍTICO: Usuário não autenticado ou target user não encontrado');
      toast({
        title: 'Erro de Autenticação',
        description: 'Usuário não está autenticado. Faça login novamente.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar sessão ativa no Supabase
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Verificação de sessão:', {
        hasSession: !!sessionData.session,
        sessionUserId: sessionData.session?.user?.id,
        sessionError
      });

      if (sessionError || !sessionData.session) {
        console.error('❌ Sessão Supabase inválida:', sessionError);
        toast({
          title: 'Sessão Expirada',
          description: 'Sua sessão expirou. Faça login novamente.',
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível verificar sua sessão. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Gerar hash da letra
      console.log('🔒 Gerando hash da letra...');
      const hash = await gerarHash(data.lyrics);
      console.log('✅ Hash gerado:', hash);

      // Upload do arquivo de áudio (se existir)
      let audioFilePath = null;
      
      if (data.audioFile) {
        console.log('🎵 Iniciando upload do arquivo de áudio...');
        try {
          audioFilePath = await uploadAudioFile(data.audioFile, targetUserId);
          console.log('✅ Upload concluído, path:', audioFilePath);
        } catch (uploadError) {
          console.error('❌ Erro no upload do áudio:', uploadError);
          toast({
            title: 'Erro no upload',
            description: uploadError instanceof Error ? uploadError.message : 'Não foi possível fazer upload do arquivo de áudio. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Atualização de créditos (primeiro)
      console.log('💳 Atualizando créditos do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        throw new Error('Erro ao verificar créditos do usuário');
      }

      if (profileData) {
        const newCredits = Math.max((profileData.credits || 0) - 1, 0);
        const { error: creditError } = await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', targetUserId);
        
        if (creditError) {
          console.error('❌ Erro ao atualizar créditos:', creditError);
          throw new Error('Erro ao atualizar créditos');
        }
        
        console.log('✅ Créditos atualizados para:', newCredits);
      }

      // Refresh dos créditos
      refreshCredits();

      // Inserção no banco de dados
      const analysisStartedAt = new Date().toISOString();
      
      console.log('📝 Preparando dados para inserção:', {
        user_id: targetUserId,
        title: data.title,
        author: data.author,
        hash: hash.substring(0, 20) + '...' // Log apenas parte do hash
      });

      const { data: registrationData, error: insertError } = await supabase
        .from('author_registrations')
        .insert({
          user_id: targetUserId, // Usar o targetUserId correto (pode ser impersonado)
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
        console.error('❌ Erro detalhado na inserção:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Tratamento específico para diferentes tipos de erro
        if (insertError.message.includes('row-level security')) {
          throw new Error('Erro de permissão: Não foi possível registrar a música. Verifique suas permissões.');
        }
        
        throw new Error(`Erro ao registrar a música: ${insertError.message}`);
      }

      console.log('✅ Registro criado com sucesso:', registrationData);

      // Processar conversão de afiliado (se existir código no localStorage)
      try {
        const { processAffiliateConversion } = await import('@/services/affiliateService');
        await processAffiliateConversion(
          'author_registration',
          registrationData.id,
          19.99
        );
        console.log('✅ Conversão de afiliado processada');
      } catch (affiliateError) {
        console.error('⚠️ Erro ao processar conversão de afiliado:', affiliateError);
        // Não bloquear o fluxo se falhar
      }

      // Mostrar mensagem de sucesso
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
      console.error('❌ Erro completo ao registrar música:', error);
      toast({
        title: 'Erro no Registro',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao registrar a música',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const startAnalysisSimulation = async (registrationId: string, title: string) => {
    try {
      // Gerar tempo aleatório entre 1 e 5 minutos (60000ms a 300000ms)
      const randomTime = Math.floor(Math.random() * (300000 - 60000 + 1)) + 60000;
      
      console.log(`🔍 Iniciando análise para registro ${registrationId}. Tempo estimado: ${Math.floor(randomTime / 1000 / 60)}m${Math.floor((randomTime / 1000) % 60)}s`);
      
      // Simular o processamento da análise
      setTimeout(async () => {
        try {
          // Atualizar status para "registered" após o tempo aleatório
          const analysisCompletedAt = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('author_registrations')
            .update({ 
              status: 'registered',
              analysis_completed_at: analysisCompletedAt
            })
            .eq('id', registrationId);

          if (updateError) {
            console.error('❌ Erro ao atualizar status do registro:', updateError);
            return;
          }

          console.log(`✅ Registro ${registrationId} atualizado para 'registered' em:`, analysisCompletedAt);

        } catch (error) {
          console.error('❌ Erro ao finalizar análise:', error);
        }
      }, randomTime);
      
    } catch (error) {
      console.error('❌ Erro na simulação da análise:', error);
    }
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
              
              {data.styleVariation && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Variação do Estilo</label>
                  <Badge variant="secondary">{data.styleVariation}</Badge>
                </div>
              )}
              
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
            <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground break-words max-w-full">{data.lyrics}</pre>
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
