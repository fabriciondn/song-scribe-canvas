import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useProfile } from '@/hooks/useProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Componente para Material Icons
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

// Mapeamento de gêneros
const GENRE_LABELS: Record<string, string> = {
  sertanejo: 'Sertanejo',
  sertanejo_universitario: 'Sertanejo Universitário',
  funk: 'Funk',
  pagode: 'Pagode',
  forro: 'Forró',
  axe: 'Axé',
  pop: 'Pop',
  rock: 'Rock',
  mpb: 'MPB',
  hiphop: 'Hip Hop / Rap',
  eletronica: 'Eletrônica',
  gospel: 'Gospel',
  brega: 'Brega',
  reggae: 'Reggae',
  blues: 'Blues',
  jazz: 'Jazz',
  classica: 'Clássica',
  outro: 'Outro',
};

interface Author {
  id: string;
  name: string;
  initials: string;
  percentage: number | null;
  isTitular: boolean;
  cpf?: string;
  avatarUrl?: string;
  isFromPlatform?: boolean;
}

interface MobileRegistrationStep3Props {
  onConfirm: () => void;
  onBack: () => void;
  formData: {
    title: string;
    author: string;
    authorCpf: string;
    hasOtherAuthors: boolean;
    otherAuthors: Array<{ name: string; cpf: string }>;
    genre: string;
    styleVariation: string;
    songVersion?: string;
    lyrics: string;
    audioFile: File | null;
    additionalInfo: string;
    registrationType: 'lyrics_only' | 'complete';
  };
  authors: Author[];
}

export const MobileRegistrationStep3: React.FC<MobileRegistrationStep3Props> = ({
  onConfirm,
  onBack,
  formData,
  authors,
}) => {
  const navigate = useNavigate();
  const { credits, refreshCredits } = useUserCredits();
  const { profile } = useProfile();
  const currentUser = useCurrentUser();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Calcular porcentagem do titular
  const titularAuthor = authors.find(a => a.isTitular);
  const titularPercentage = titularAuthor?.percentage || 100;

  // Toggle audio playback
  const toggleAudioPlayback = () => {
    if (!formData.audioFile) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(formData.audioFile));
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        toast.error('Erro ao reproduzir o áudio');
        setIsPlaying(false);
      };
    }

    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
      toast.error('Não foi possível reproduzir o áudio');
      setIsPlaying(false);
    });
  };

  // Função para gerar hash SHA-256
  const gerarHash = async (texto: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Upload de áudio
  const uploadAudioFile = async (audioFile: File, userId: string): Promise<string | null> => {
    const fileExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('author-registrations')
      .upload(fileName, audioFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: audioFile.type || 'audio/mpeg'
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    return uploadData?.path || null;
  };

  const handleConfirmAndRegister = async () => {
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }

    const targetUserId = currentUser?.id;
    if (!targetUserId) {
      toast.error('Usuário não autenticado. Faça login novamente.');
      return;
    }

    setIsRegistering(true);

    try {
      // Gerar hash da letra
      const hash = await gerarHash(formData.lyrics);

      // Upload do arquivo de áudio (se existir)
      let audioFilePath = null;
      if (formData.audioFile) {
        audioFilePath = await uploadAudioFile(formData.audioFile, targetUserId);
      }

      // Atualizar créditos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw new Error('Erro ao verificar créditos');

      if (profileData) {
        const newCredits = Math.max((profileData.credits || 0) - 1, 0);
        const { error: creditError } = await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', targetUserId);

        if (creditError) throw new Error('Erro ao atualizar créditos');
      }

      refreshCredits();

      // Inserir registro
      const analysisStartedAt = new Date().toISOString();
      
      const { data: registrationData, error: insertError } = await supabase
        .from('author_registrations')
        .insert({
          user_id: targetUserId,
          title: formData.title,
          author: formData.author,
          other_authors: JSON.stringify({
            author_cpf: formData.authorCpf,
            has_other_authors: formData.hasOtherAuthors,
            other_authors: formData.otherAuthors
          }),
          genre: formData.genre,
          rhythm: formData.styleVariation,
          song_version: formData.songVersion,
          lyrics: formData.lyrics,
          audio_file_path: audioFilePath,
          additional_info: formData.additionalInfo || null,
          terms_accepted: termsAccepted,
          status: 'em análise',
          hash: hash,
          analysis_started_at: analysisStartedAt,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Erro ao registrar: ${insertError.message}`);

      // Processar comissão de afiliado
      try {
        await supabase.rpc('process_affiliate_first_purchase', {
          p_user_id: targetUserId,
          p_payment_amount: 19.99,
          p_payment_id: registrationData.id
        });
      } catch {
        // Ignorar erros de afiliado
      }

      toast.success('Registro enviado para análise!');

      // Simular análise
      startAnalysisSimulation(registrationData.id);

      // Redirecionar
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

      onConfirm();
    } catch (error) {
      console.error('Erro ao registrar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar a música');
    } finally {
      setIsRegistering(false);
    }
  };

  const startAnalysisSimulation = async (registrationId: string) => {
    const randomTime = Math.floor(Math.random() * (300000 - 120000 + 1)) + 120000;
    
    setTimeout(async () => {
      try {
        await supabase
          .from('author_registrations')
          .update({ 
            status: 'registered',
            analysis_completed_at: new Date().toISOString()
          })
          .eq('id', registrationId);
      } catch {
        // Ignorar erros
      }
    }, randomTime);
  };

  const canConfirm = termsAccepted && !isRegistering;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-black/95 backdrop-blur-sm">
        <button 
          className="p-2 -ml-2"
          onClick={onBack}
        >
          <MaterialIcon name="arrow_back" className="text-2xl text-white" />
        </button>
        <div className="h-8 w-8" />
        <button className="p-2 -mr-2">
          <MaterialIcon name="help_outline" className="text-2xl text-gray-400" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-52 overflow-y-auto">
        {/* Steps Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#00C853] uppercase tracking-wider">Passo 3 de 3</span>
            <span className="text-xs text-gray-400">Revisão e Confirmação</span>
          </div>
          <div className="h-1.5 w-full bg-[#2C2C2E] rounded-full overflow-hidden">
            <div className="h-full bg-[#00C853] w-full rounded-full shadow-[0_0_10px_rgba(0,200,83,0.5)]"></div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h1 className="text-[24px] font-bold mb-1 text-white">Confirme os detalhes</h1>
          <p className="text-sm text-gray-400">Revise as informações da obra antes de registrar.</p>
        </div>

        {/* Credits Card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#1a1a1a] border border-[#2C2C2E]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00C853]/10 flex items-center justify-center">
                <MaterialIcon name="account_balance_wallet" className="text-xl text-[#00C853]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Seu Saldo</p>
                <p className="text-lg font-bold text-white">{credits || 0} Créditos</p>
              </div>
            </div>
            <div className="bg-[#00C853]/10 px-3 py-1 rounded-full border border-[#00C853]/20">
              <span className="text-xs font-bold text-[#00C853]">Ativo</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-[#2C2C2E]">
            <span className="text-sm text-gray-300">Custo do registro</span>
            <span className="text-sm font-bold text-red-500">-1 Crédito</span>
          </div>
        </div>

        {/* Work Information Card */}
        <div className="mb-4 p-5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E]">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Informações da Obra</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#00C853] to-blue-500 flex-shrink-0 flex items-center justify-center">
              <MaterialIcon name="music_note" className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{formData.title}</h2>
              <p className="text-sm text-gray-400">
                {GENRE_LABELS[formData.genre] || formData.genre}
                {formData.songVersion && ` • ${formData.songVersion}`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#121212] p-3 rounded-xl">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tipo</p>
              <div className="flex items-center gap-1">
                <MaterialIcon name="queue_music" className="text-sm text-[#00C853]" />
                <span className="text-sm font-medium text-gray-200">
                  {formData.registrationType === 'complete' ? 'Melodia + Letra' : 'Apenas Letra'}
                </span>
              </div>
            </div>
            <div className="bg-[#121212] p-3 rounded-xl">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Versão</p>
              <div className="flex items-center gap-1">
                <MaterialIcon name="history" className="text-sm text-[#00C853]" />
                <span className="text-sm font-medium text-gray-200">
                  {formData.songVersion || 'Original'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio File Card */}
        {formData.audioFile && (
          <div className="mb-4 p-5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Arquivo Protegido</h3>
            <div className="flex items-center justify-between bg-[#121212] p-3 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="audio_file" className="text-xl text-red-500" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">{formData.audioFile.name}</span>
                  <span className="text-xs text-gray-500">
                    {(formData.audioFile.size / 1024 / 1024).toFixed(1)} MB • Enviado hoje
                  </span>
                </div>
              </div>
              <button 
                onClick={toggleAudioPlayback}
                className="text-[#00C853] transition-colors"
              >
                <MaterialIcon name={isPlaying ? "pause_circle" : "play_circle"} className="text-2xl" />
              </button>
            </div>
          </div>
        )}

        {/* Co-Authors Card */}
        {authors.length > 0 && (
          <div className="mb-6 p-5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Co-autores</h3>
            <div className="flex -space-x-2 overflow-hidden items-center">
              {authors.slice(0, 3).map((author, index) => (
                author.avatarUrl ? (
                  <img 
                    key={author.id}
                    src={author.avatarUrl} 
                    alt={author.name}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1C1C1E] object-cover"
                  />
                ) : (
                  <div 
                    key={author.id}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1C1C1E] bg-[#2C2C2E] flex items-center justify-center text-xs font-medium text-gray-300"
                  >
                    {author.initials}
                  </div>
                )
              ))}
              {authors.length > 3 && (
                <div className="h-8 w-8 rounded-full ring-2 ring-[#1C1C1E] bg-[#2C2C2E] flex items-center justify-center text-xs font-medium text-gray-500">
                  +{authors.length - 3}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Você possui {titularPercentage}% dos direitos desta obra.
            </p>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 mb-6">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className={cn(
              "h-5 w-5 mt-0.5 rounded border-2",
              termsAccepted 
                ? "border-[#00C853] bg-[#00C853] data-[state=checked]:bg-[#00C853]" 
                : "border-gray-600 bg-transparent"
            )}
          />
          <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
            Declaro que sou o autor original desta obra e li os{' '}
            <a href="#" className="text-[#00C853] underline">Termos de Uso</a>{' '}
            e Políticas de Privacidade.
          </label>
        </div>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black to-transparent p-4 pb-6">
        <button
          type="button"
          onClick={handleConfirmAndRegister}
          disabled={!canConfirm}
          className={cn(
            "w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2",
            canConfirm 
              ? "bg-[#00C853] text-black active:scale-[0.98] shadow-[0_0_20px_rgba(0,200,83,0.3)]" 
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          {isRegistering ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
              Registrando...
            </>
          ) : (
            <>
              <MaterialIcon name="verified" filled className="text-xl" />
              Confirmar e Registrar
            </>
          )}
        </button>

        {/* Bonus Info */}
        <div className="mt-4 w-full flex items-center justify-center gap-2 bg-[#00C853]/10 border border-[#00C853]/20 rounded-2xl py-3 px-4 shadow-[0_0_15px_rgba(0,200,83,0.1)]">
          <MaterialIcon name="stars" className="text-base text-[#00C853]" />
          <span className="text-xs font-bold text-[#00C853]">Após esse registro você ganhará 1 Acorde.</span>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-3">
          A certificação será gerada instantaneamente no blockchain.
        </p>
      </div>
    </div>
  );
};
