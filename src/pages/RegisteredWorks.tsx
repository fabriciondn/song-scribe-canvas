import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Calendar, User, Hash, Play, Pause, Loader2, MapPin, Phone, Globe, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF } from '@/services/certificateService';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';

interface RegisteredWork {
  id: string;
  title: string;
  author: string;
  other_authors: string | null;
  genre: string;
  rhythm: string;
  song_version: string;
  lyrics: string;
  hash: string | null;
  created_at: string;
  status: string;
  audio_file_path: string | null;
  additional_info: string | null;
  user_id: string;
}

const RegisteredWorks: React.FC = () => {
  const { profile } = useProfile();
  const [downloadingWork, setDownloadingWork] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { getStatusText, getStatusVariant } = useRegistrationStatus();

  const { data: works, isLoading, error } = useQuery({
    queryKey: ['registered-works'],
    queryFn: async (): Promise<RegisteredWork[]> => {
      const { data, error } = await supabase
        .from('author_registrations')
        .select('*')
        .in('status', ['registered', 'em análise'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDownloadCertificate = async (work: RegisteredWork) => {
    try {
      setDownloadingWork(work.id);
      
      // Buscar dados completos do perfil para o certificado
      const enrichedWork = {
        ...work,
        author_cpf: profile?.cpf,
        author_address: profile ? [
          profile.street,
          profile.number,
          profile.neighborhood,
          profile.city,
          profile.state,
          profile.cep
        ].filter(Boolean).join(', ') : undefined,
      };

      await generateCertificatePDF(enrichedWork);
      
      toast({
        title: "Certificado baixado",
        description: `Certificado de "${work.title}" foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o certificado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingWork(null);
    }
  };

  const handlePlayAudio = async (work: RegisteredWork) => {
    if (!work.audio_file_path) {
      toast({
        title: "Áudio não disponível",
        description: "Esta obra não possui arquivo de áudio.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Se já está tocando este áudio, pausar/retomar
      if (playingAudio === work.id && currentAudio) {
        if (currentAudio.paused) {
          await currentAudio.play();
          setPlayingAudio(work.id);
        } else {
          currentAudio.pause();
          setPlayingAudio(null);
        }
        return;
      }

      // Parar áudio atual se estiver tocando outro
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingAudio(null);
      }

      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(work.audio_file_path);

      const audio = new Audio(data.publicUrl);
      audio.onended = () => {
        setPlayingAudio(null);
        setCurrentAudio(null);
      };
      
      audio.onloadstart = () => setPlayingAudio(work.id);
      audio.onerror = () => {
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio.",
          variant: "destructive",
        });
        setPlayingAudio(null);
        setCurrentAudio(null);
      };

      await audio.play();
      setCurrentAudio(audio);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reproduzir o áudio.",
        variant: "destructive",
      });
      setPlayingAudio(null);
      setCurrentAudio(null);
    }
  };

  const handleDownloadAudio = async (work: RegisteredWork) => {
    if (!work.audio_file_path) {
      toast({
        title: "Áudio não disponível",
        description: "Esta obra não possui arquivo de áudio.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(work.audio_file_path);

      // Fazer fetch do arquivo para baixar
      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      
      // Criar URL do blob e link de download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${work.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpeza do URL do blob
      URL.revokeObjectURL(blobUrl);

      toast({
        title: "Download concluído",
        description: `O áudio de "${work.title}" foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o áudio.",
        variant: "destructive",
      });
    }
  };

  const parseOtherAuthors = (otherAuthors: string | null): string => {
    if (!otherAuthors || otherAuthors.trim() === '') {
      return '';
    }

    try {
      // Tentar fazer parse se for JSON
      if (otherAuthors.startsWith('{') || otherAuthors.startsWith('[')) {
        const parsed = JSON.parse(otherAuthors);
        
        if (parsed.has_other_authors === false || 
            (Array.isArray(parsed.other_authors) && parsed.other_authors.length === 0)) {
          return '';
        }
        
        if (Array.isArray(parsed.other_authors) && parsed.other_authors.length > 0) {
          return parsed.other_authors
            .map((author: any) => `${author.name} (CPF: ${author.cpf})`)
            .join(', ');
        }
        
        return otherAuthors;
      }
      
      // Se não for JSON, retornar como string
      return otherAuthors;
    } catch {
      // Se não conseguir fazer parse, retornar como string
      return otherAuthors;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar obras registradas</p>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 sm:py-6 px-2 sm:px-4 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Voltar ao Dashboard</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Obras Registradas</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Visualize e baixe certificados das suas obras</p>
        </div>
      </div>

      {works && works.length > 0 ? (
        <div className="grid gap-3 sm:gap-6">
          {works.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-all duration-200 bg-card border border-border/50">
              <CardHeader className="pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground text-sm sm:text-lg font-semibold">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">{work.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {work.status === 'em análise' && <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                      <Badge variant={getStatusVariant(work.status)} className="text-xs">
                        {getStatusText(work.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-0 p-3 sm:p-6">
                {/* Dados do Compositor - Mobile optimized */}
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/30">
                  <h4 className="font-medium mb-2 text-foreground flex items-center gap-2 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Dados do Compositor
                  </h4>
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Nome:</span>
                      <p className="text-muted-foreground break-words">{profile?.name || work.author}</p>
                    </div>
                    {profile?.cpf && (
                      <div className="text-xs sm:text-sm">
                        <span className="font-medium text-foreground">CPF:</span>
                        <p className="text-muted-foreground">{profile.cpf}</p>
                      </div>
                    )}
                    {profile?.artistic_name && (
                      <div className="text-xs sm:text-sm">
                        <span className="font-medium text-foreground">Nome Artístico:</span>
                        <p className="text-muted-foreground break-words">{profile.artistic_name}</p>
                      </div>
                    )}
                    {(profile?.street || profile?.city) && (
                      <div className="text-xs sm:text-sm">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Endereço:
                        </span>
                        <div className="text-muted-foreground text-xs leading-relaxed">
                          {/* Mobile: Show truncated address with expand option */}
                          <div className="block sm:hidden">
                            <p className="break-words overflow-hidden">
                              {(() => {
                                const fullAddress = [profile?.street, profile?.number, profile?.neighborhood, profile?.city, profile?.state, profile?.cep]
                                  .filter(Boolean)
                                  .join(', ');
                                return fullAddress.length > 40 
                                  ? `${fullAddress.substring(0, 40)}...`
                                  : fullAddress;
                              })()}
                            </p>
                          </div>
                          {/* Desktop: Show full address */}
                          <div className="hidden sm:block">
                            <p className="break-words">
                              {[profile?.street, profile?.number, profile?.neighborhood, profile?.city, profile?.state, profile?.cep]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Details - Mobile optimized grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Autor:</span>
                    <p className="truncate">{work.author}</p>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Gênero:</span>
                    <p className="truncate">{work.genre}</p>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Ritmo:</span>
                    <p className="truncate">{work.rhythm}</p>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Versão:</span>
                    <p className="truncate">{work.song_version}</p>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground sm:col-span-2">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Registrado:
                    </span>
                    <p>{new Date(work.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  {parseOtherAuthors(work.other_authors) && (
                    <div className="text-xs sm:text-sm text-muted-foreground sm:col-span-2">
                      <span className="font-medium text-foreground">Co-autores:</span>
                      <p className="break-words">{parseOtherAuthors(work.other_authors)}</p>
                    </div>
                  )}
                  
                  <div className="text-xs sm:text-sm text-muted-foreground sm:col-span-2">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      ID:
                    </span>
                    <p className="font-mono break-all">{work.id.substring(0, 8)}...</p>
                  </div>
                  
                  {work.hash && (
                    <div className="text-xs sm:text-sm text-muted-foreground sm:col-span-2">
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Hash:
                      </span>
                      {/* Mobile: Truncated hash */}
                      <div className="block sm:hidden">
                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground mt-1">
                          {work.hash.substring(0, 20)}...
                        </p>
                      </div>
                      {/* Desktop: Full hash */}
                      <div className="hidden sm:block">
                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all text-foreground mt-1">
                          {work.hash}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lyrics Section - Mobile optimized */}
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/30">
                  <h4 className="font-medium mb-2 text-foreground text-xs sm:text-sm">Letra:</h4>
                  <div className="text-xs sm:text-sm text-muted-foreground max-h-20 sm:max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {work.lyrics.length > 120 
                      ? `${work.lyrics.substring(0, 120)}...` 
                      : work.lyrics
                    }
                  </div>
                </div>

                {/* Actions Section - Mobile optimized */}
                <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border/30">
                  {/* Audio Controls */}
                  {work.audio_file_path ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePlayAudio(work);
                        }}
                        className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
                        size="sm"
                      >
                        {playingAudio === work.id ? (
                          <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {playingAudio === work.id ? 'Pausar Áudio' : 'Reproduzir Áudio'}
                        </span>
                        <span className="sm:hidden">
                          {playingAudio === work.id ? 'Pausar' : 'Play'}
                        </span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleDownloadAudio(work)}
                        className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
                        size="sm"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Baixar Áudio MP3</span>
                        <span className="sm:hidden">Baixar MP3</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-muted-foreground text-center py-2">
                      Áudio não disponível
                    </div>
                  )}
                  
                  {/* Certificate Button */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => handleDownloadCertificate(work)}
                      variant="default"
                      className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9 bg-primary hover:bg-primary/90"
                      disabled={downloadingWork === work.id || work.status !== 'registered'}
                      size="sm"
                    >
                      {downloadingWork === work.id ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {downloadingWork === work.id ? 'Gerando PDF...' : 
                         work.status !== 'registered' ? 'Certificado disponível após registro' : 
                         'Baixar Certificado'}
                      </span>
                      <span className="sm:hidden">
                        {downloadingWork === work.id ? 'Gerando...' : 
                         work.status !== 'registered' ? 'Aguardando' : 
                         'Certificado'}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma obra registrada</h3>
            <p className="text-gray-500 mb-6">Você ainda não possui obras registradas em seu nome.</p>
            <Button asChild>
              <Link to="/dashboard/author-registration">
                Registrar Primeira Obra
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegisteredWorks;