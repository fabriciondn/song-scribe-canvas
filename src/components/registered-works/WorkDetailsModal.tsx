import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Hash, 
  Play, 
  Pause, 
  Loader2, 
  MapPin,
  Music,
  Clock
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';
import { generateCertificatePDF } from '@/services/certificateService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface WorkDetailsModalProps {
  work: RegisteredWork | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkDetailsModal: React.FC<WorkDetailsModalProps> = ({
  work,
  open,
  onOpenChange
}) => {
  const { profile } = useProfile();
  const { getStatusText, getStatusVariant } = useRegistrationStatus();
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  if (!work) return null;

  const parseOtherAuthors = (otherAuthors: string | null): string => {
    if (!otherAuthors || otherAuthors.trim() === '') {
      return '';
    }

    try {
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
      
      return otherAuthors;
    } catch {
      return otherAuthors;
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      setDownloadingCertificate(true);
      
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
      setDownloadingCertificate(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!work.audio_file_path) {
      toast({
        title: "Áudio não disponível",
        description: "Esta obra não possui arquivo de áudio.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (playingAudio && currentAudio) {
        if (currentAudio.paused) {
          await currentAudio.play();
          setPlayingAudio(true);
        } else {
          currentAudio.pause();
          setPlayingAudio(false);
        }
        return;
      }

      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingAudio(false);
      }

      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(work.audio_file_path);

      const audio = new Audio(data.publicUrl);
      audio.onended = () => {
        setPlayingAudio(false);
        setCurrentAudio(null);
      };
      
      audio.onloadstart = () => setPlayingAudio(true);
      audio.onerror = () => {
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio.",
          variant: "destructive",
        });
        setPlayingAudio(false);
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
      setPlayingAudio(false);
      setCurrentAudio(null);
    }
  };

  const handleDownloadAudio = async () => {
    if (!work.audio_file_path) {
      toast({
        title: "Áudio não disponível",
        description: "Esta obra não possui arquivo de áudio.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(work.audio_file_path);

      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${work.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {work.title}
          </DialogTitle>
          <Badge variant={getStatusVariant(work.status)} className="w-fit">
            {work.status === 'em análise' && <Clock className="h-3 w-3 mr-1" />}
            {getStatusText(work.status)}
          </Badge>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Dados do Compositor */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
              <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Dados do Compositor
              </h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-foreground">Nome:</span>
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
                  <div className="text-sm">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Endereço:
                    </span>
                    <p className="text-muted-foreground break-words">
                      {[profile?.street, profile?.number, profile?.neighborhood, profile?.city, profile?.state, profile?.cep]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes da Obra */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm">
                <span className="font-medium text-foreground">Autor:</span>
                <p className="text-muted-foreground">{work.author}</p>
              </div>
              
              <div className="text-sm">
                <span className="font-medium text-foreground">Gênero:</span>
                <p className="text-muted-foreground">{work.genre}</p>
              </div>
              
              <div className="text-sm">
                <span className="font-medium text-foreground">Ritmo:</span>
                <p className="text-muted-foreground">{work.rhythm}</p>
              </div>
              
              <div className="text-sm">
                <span className="font-medium text-foreground">Versão:</span>
                <p className="text-muted-foreground">{work.song_version}</p>
              </div>
              
              <div className="text-sm col-span-2">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Registrado:
                </span>
                <p className="text-muted-foreground">{new Date(work.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              
              {parseOtherAuthors(work.other_authors) && (
                <div className="text-sm col-span-2">
                  <span className="font-medium text-foreground">Co-autores:</span>
                  <p className="text-muted-foreground break-words">{parseOtherAuthors(work.other_authors)}</p>
                </div>
              )}
              
              <div className="text-sm col-span-2">
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  ID:
                </span>
                <p className="font-mono text-muted-foreground break-all">{work.id}</p>
              </div>
              
              {work.hash && (
                <div className="text-sm col-span-2">
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Hash:
                  </span>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all text-foreground mt-1">
                    {work.hash}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Letra */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
              <h4 className="font-medium mb-3 text-foreground">Letra:</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {work.lyrics}
              </div>
            </div>

            <Separator />

            {/* Ações */}
            <div className="space-y-3">
              {/* Certificado */}
              <Button 
                onClick={handleDownloadCertificate}
                disabled={downloadingCertificate}
                className="w-full"
              >
                {downloadingCertificate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando Certificado...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar Certificado
                  </>
                )}
              </Button>

              {/* Controles de Áudio */}
              {work.audio_file_path && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handlePlayAudio}
                    className="flex-1"
                  >
                    {playingAudio && !currentAudio?.paused ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {playingAudio && !currentAudio?.paused ? 'Pausar' : 'Reproduzir'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleDownloadAudio}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};