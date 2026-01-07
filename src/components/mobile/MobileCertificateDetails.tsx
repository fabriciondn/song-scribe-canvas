import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';
import { generateCertificatePDF } from '@/services/certificateService';
import { toast } from 'sonner';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

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
}

export const MobileCertificateDetails: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workId = searchParams.get('id');
  const currentUser = useCurrentUser();
  const { profile } = useProfile();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const { data: work, isLoading } = useQuery({
    queryKey: ['certificate-details', workId],
    queryFn: async (): Promise<RegisteredWork | null> => {
      if (!workId || !currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from('author_registrations')
        .select('*')
        .eq('id', workId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!workId && !!currentUser?.id,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseOtherAuthors = (otherAuthors: string | null): string => {
    if (!otherAuthors || otherAuthors.trim() === '') return '';
    
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
    if (!work) return;
    
    setDownloadingPdf(true);
    try {
      let fullAddress = '';
      if (profile?.street) {
        fullAddress = `${profile.street}${profile.number ? ', ' + profile.number : ''}`;
        if (profile.neighborhood) fullAddress += ` - ${profile.neighborhood}`;
        if (profile.city && profile.state) fullAddress += ` - ${profile.city}/${profile.state}`;
        if (profile.cep) fullAddress += ` - CEP: ${profile.cep}`;
      }

      await generateCertificatePDF({
        ...work,
        author_cpf: profile?.cpf || undefined,
        author_address: fullAddress || undefined,
      });
      toast.success('Certificado baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!work?.audio_file_path) {
      toast.error('Esta obra não possui áudio');
      return;
    }

    try {
      if (currentAudio) {
        if (currentAudio.paused) {
          await currentAudio.play();
          setPlayingAudio(true);
        } else {
          currentAudio.pause();
          setPlayingAudio(false);
        }
        return;
      }

      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(work.audio_file_path);

      const audio = new Audio(data.publicUrl);
      audio.onended = () => {
        setPlayingAudio(false);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        toast.error('Erro ao reproduzir áudio');
        setPlayingAudio(false);
        setCurrentAudio(null);
      };

      await audio.play();
      setCurrentAudio(audio);
      setPlayingAudio(true);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast.error('Erro ao reproduzir áudio');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'registered' || status === 'completed') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/20 text-[#00C853] text-xs font-bold uppercase tracking-wider border border-[#00C853]/30">
          <span className="w-2 h-2 rounded-full bg-[#00C853]" />
          Registrada
        </div>
      );
    }
    if (status === 'em análise') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-900/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-400/30">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          Em Análise
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 text-xs font-bold uppercase tracking-wider border border-gray-600/30">
        Rascunho
      </div>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-['Outfit',sans-serif]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C853]" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-['Outfit',sans-serif] px-6">
        <div className="w-20 h-20 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mb-4">
          <MaterialIcon name="error" className="text-4xl text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Obra não encontrada</h3>
        <p className="text-slate-400 text-sm text-center mb-6">Esta obra não existe ou você não tem permissão para visualizá-la.</p>
        <button
          onClick={() => navigate('/dashboard/registered-works')}
          className="px-6 py-3 rounded-xl bg-[#00C853] text-white font-semibold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const coAuthorsText = parseOtherAuthors(work.other_authors);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Outfit',sans-serif]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard/registered-works')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <MaterialIcon name="arrow_back" className="text-2xl text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1 truncate">Detalhes do Certificado</h1>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto space-y-5">
        {/* Work Header Card */}
        <div className="bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MaterialIcon name="shield" filled className="text-white text-3xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white leading-tight">{work.title}</h2>
              <p className="text-white/70 text-sm mt-1">{work.author}</p>
              <div className="mt-3">
                {getStatusBadge(work.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Data e ID */}
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00C853]/20 flex items-center justify-center">
              <MaterialIcon name="calendar_today" className="text-[#00C853] text-xl" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Registrado em</p>
              <p className="text-white font-medium">{formatDate(work.created_at)}</p>
            </div>
          </div>
          
          <div className="h-px bg-slate-800 my-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">ID do Registro</p>
              <p className="text-white font-mono text-sm mt-1 select-all">CP-{work.id.slice(0, 6).toUpperCase()}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(`CP-${work.id.slice(0, 6).toUpperCase()}`)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <MaterialIcon name="content_copy" className="text-slate-300 text-lg" />
            </button>
          </div>
        </div>

        {/* Detalhes da Obra */}
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MaterialIcon name="music_note" className="text-[#00C853]" />
            Detalhes da Obra
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Gênero</p>
              <p className="text-white font-medium mt-1">{work.genre}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Ritmo</p>
              <p className="text-white font-medium mt-1">{work.rhythm}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Versão</p>
              <p className="text-white font-medium mt-1">{work.song_version}</p>
            </div>
            
            {coAuthorsText && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Co-autores</p>
                <p className="text-white font-medium mt-1">{coAuthorsText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hash de Integridade */}
        {work.hash && (
          <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <MaterialIcon name="fingerprint" className="text-[#00C853]" />
              Hash de Integridade (SHA-256)
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-3 relative">
              <p className="text-xs font-mono text-slate-300 break-all pr-8">{work.hash}</p>
              <button 
                onClick={() => copyToClipboard(work.hash!)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <MaterialIcon name="content_copy" className="text-slate-300 text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* Letra */}
        <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <MaterialIcon name="lyrics" className="text-[#00C853]" />
            Letra
          </h3>
          <div className="bg-slate-800/50 rounded-xl p-4 max-h-64 overflow-y-auto">
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{work.lyrics}</p>
          </div>
        </div>

        {/* Áudio */}
        {work.audio_file_path && (
          <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <MaterialIcon name="headphones" className="text-[#00C853]" />
              Áudio
            </h3>
            <button
              onClick={handlePlayAudio}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <MaterialIcon name={playingAudio && !currentAudio?.paused ? "pause" : "play_arrow"} filled className="text-[#00C853] text-2xl" />
              <span className="text-white font-medium">
                {playingAudio && !currentAudio?.paused ? 'Pausar' : 'Reproduzir Áudio'}
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={handleDownloadCertificate}
          disabled={downloadingPdf || work.status !== 'registered'}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            work.status === 'registered'
              ? 'bg-[#00C853] text-white shadow-lg shadow-[#00C853]/30 active:scale-[0.98]'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {downloadingPdf ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gerando Certificado...
            </>
          ) : (
            <>
              <MaterialIcon name="download" className="text-xl" />
              Baixar Certificado PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};
