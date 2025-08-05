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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Obras Registradas</h1>
          <p className="text-muted-foreground mt-1">Visualize e baixe certificados das suas obras registradas</p>
        </div>
      </div>

      {works && works.length > 0 ? (
        <div className="grid gap-6">
          {works.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    {work.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {work.status === 'em análise' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    <Badge variant={getStatusVariant(work.status)}>
                      {getStatusText(work.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dados do Compositor */}
                <div className="bg-secondary p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-3 text-secondary-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Compositor
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Nome Completo:</span>
                      <p className="text-muted-foreground">{profile?.name || work.author}</p>
                    </div>
                    {profile?.cpf && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">CPF:</span>
                        <p className="text-muted-foreground">{profile.cpf}</p>
                      </div>
                    )}
                    {profile?.artistic_name && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Nome Artístico:</span>
                        <p className="text-muted-foreground">{profile.artistic_name}</p>
                      </div>
                    )}
                    {(profile?.street || profile?.city) && (
                      <div className="text-sm md:col-span-2">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Endereço:
                        </span>
                        <p className="text-muted-foreground">
                          {[profile?.street, profile?.number, profile?.neighborhood, profile?.city, profile?.state, profile?.cep]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span><strong className="text-foreground">Título:</strong> {work.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span><strong className="text-foreground">Autor:</strong> {work.author}</span>
                  </div>
                  {parseOtherAuthors(work.other_authors) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span><strong className="text-foreground">Co-autores:</strong> {parseOtherAuthors(work.other_authors)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Gênero:</strong> {work.genre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Ritmo:</strong> {work.rhythm}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Versão:</strong> {work.song_version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span><strong className="text-foreground">Registrado em:</strong> {new Date(work.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span><strong className="text-foreground">ID:</strong> {work.id.substring(0, 8)}...</span>
                  </div>
                  {work.hash && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
                      <Hash className="h-4 w-4" />
                      <span><strong className="text-foreground">Hash de Integridade:</strong></span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all text-foreground">
                        {work.hash}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-foreground">Letra da Música:</h4>
                  <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {work.lyrics.length > 200 
                      ? `${work.lyrics.substring(0, 200)}...` 
                      : work.lyrics
                    }
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Controles de Áudio */}
                  {work.audio_file_path ? (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => handlePlayAudio(work)}
                        className="flex items-center gap-2"
                      >
                        {playingAudio === work.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {playingAudio === work.id ? 'Pausar Áudio' : 'Reproduzir Áudio'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleDownloadAudio(work)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Áudio MP3
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Áudio não disponível
                    </div>
                  )}
                  
                  {/* Botão de Certificado */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleDownloadCertificate(work)}
                      className="flex items-center gap-2"
                      disabled={downloadingWork === work.id || work.status !== 'registered'}
                    >
                      {downloadingWork === work.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {downloadingWork === work.id ? 'Gerando PDF...' : 
                       work.status !== 'registered' ? 'Certificado disponível após registro' : 
                       'Baixar Certificado PDF'}
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