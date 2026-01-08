import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const GENRES = [
  { value: '', label: 'Selecione o gênero' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'sertanejo_universitario', label: 'Sertanejo Universitário' },
  { value: 'funk', label: 'Funk' },
  { value: 'pagode', label: 'Pagode' },
  { value: 'forro', label: 'Forró' },
  { value: 'axe', label: 'Axé' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'mpb', label: 'MPB' },
  { value: 'hiphop', label: 'Hip Hop / Rap' },
  { value: 'eletronica', label: 'Eletrônica' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'brega', label: 'Brega' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'blues', label: 'Blues' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classica', label: 'Clássica' },
  { value: 'outro', label: 'Outro' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/aiff'];

interface MobileRegistrationStep2Props {
  onContinue: (data: {
    registrationType: 'lyrics_only' | 'complete';
    genre: string;
    version: string;
    lyrics: string;
    audioFile: File | null;
    additionalInfo: string;
  }) => void;
  onBack: () => void;
  initialData?: {
    registrationType: 'lyrics_only' | 'complete';
    genre: string;
    version: string;
    lyrics: string;
    audioFile: File | null;
    additionalInfo: string;
  };
}

export const MobileRegistrationStep2: React.FC<MobileRegistrationStep2Props> = ({
  onContinue,
  onBack,
  initialData,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [registrationType, setRegistrationType] = useState<'lyrics_only' | 'complete'>(
    initialData?.registrationType || 'complete'
  );
  const [genre, setGenre] = useState(initialData?.genre || '');
  const [version, setVersion] = useState(initialData?.version || '');
  const [lyrics, setLyrics] = useState(initialData?.lyrics || '');
  const [audioFile, setAudioFile] = useState<File | null>(initialData?.audioFile || null);
  const [additionalInfo, setAdditionalInfo] = useState(initialData?.additionalInfo || '');

  const handlePasteLyrics = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLyrics(text);
        toast.success('Letra colada com sucesso!');
      }
    } catch (error) {
      toast.error('Não foi possível acessar a área de transferência');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|aiff)$/i)) {
      toast.error('Formato não suportado. Use MP3, WAV, M4A, OGG, FLAC ou AIFF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('O arquivo deve ter no máximo 50MB');
      return;
    }

    setAudioFile(file);
    toast.success('Arquivo carregado com sucesso!');
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    // Validações
    if (!lyrics.trim()) {
      toast.error('A letra da música é obrigatória');
      return;
    }

    if (!genre) {
      toast.error('Selecione um gênero musical');
      return;
    }

    if (registrationType === 'complete' && !audioFile) {
      toast.error('O arquivo de áudio é obrigatório para registro completo');
      return;
    }

    onContinue({
      registrationType,
      genre,
      version,
      lyrics: lyrics.trim(),
      audioFile,
      additionalInfo: additionalInfo.trim(),
    });
  };

  const canContinue = lyrics.trim().length > 0 && genre !== '' && (registrationType === 'lyrics_only' || audioFile !== null);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <button 
          className="p-2 -ml-2"
          onClick={onBack}
        >
          <MaterialIcon name="arrow_back" className="text-2xl text-white" />
        </button>
        <div className="font-semibold text-lg">Detalhes da Obra</div>
        <button 
          className="text-gray-400 text-sm font-semibold"
          onClick={() => navigate('/dashboard')}
        >
          Cancelar
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-32 overflow-y-auto">
        {/* Steps Indicator */}
        <div className="flex flex-col items-center py-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-8 rounded-full bg-[#00C853]"></div>
            <div className="h-1.5 w-8 rounded-full bg-[#00C853]"></div>
            <div className="h-1.5 w-8 rounded-full bg-[#2C2C2E]"></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Etapa 2 de 3</p>
        </div>

        {/* Section Title */}
        <div className="mb-6 pt-2">
          <h1 className="text-[28px] font-bold mb-2 text-white">Sobre a sua composição</h1>
          <p className="text-[15px] text-gray-400 leading-relaxed">
            Preencha os dados técnicos para garantir a proteção correta.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Registration Type */}
          <div className="space-y-3">
            <p className="text-[15px] font-medium text-white">Tipo de Registro</p>
            
            {/* Complete Registration */}
            <label 
              className={cn(
                "relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
                registrationType === 'complete' 
                  ? "border-[#00C853] bg-[#00C853]/5" 
                  : "border-[#2C2C2E] bg-[#1C1C1E]"
              )}
            >
              <div 
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                  registrationType === 'complete' 
                    ? "border-[#00C853] bg-[#00C853]" 
                    : "border-[#3C3C3E]"
                )}
              >
                {registrationType === 'complete' && (
                  <div className="h-2 w-2 rounded-full bg-black"></div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white">Registro Completo</p>
                <p className="text-[13px] text-gray-400">Proteção da letra e do arquivo de áudio</p>
              </div>
              <MaterialIcon 
                name="music_note" 
                className={cn(
                  "text-xl",
                  registrationType === 'complete' ? "text-[#00C853]" : "text-gray-500"
                )} 
              />
              <input 
                type="radio" 
                name="registrationType" 
                className="sr-only"
                checked={registrationType === 'complete'}
                onChange={() => setRegistrationType('complete')}
              />
            </label>

            {/* Lyrics Only */}
            <label 
              className={cn(
                "relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
                registrationType === 'lyrics_only' 
                  ? "border-[#00C853] bg-[#00C853]/5" 
                  : "border-[#2C2C2E] bg-[#1C1C1E]"
              )}
            >
              <div 
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                  registrationType === 'lyrics_only' 
                    ? "border-[#00C853] bg-[#00C853]" 
                    : "border-[#3C3C3E]"
                )}
              >
                {registrationType === 'lyrics_only' && (
                  <div className="h-2 w-2 rounded-full bg-black"></div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white">Apenas Letra</p>
                <p className="text-[13px] text-gray-400">Proteção somente da composição escrita</p>
              </div>
              <MaterialIcon 
                name="description" 
                className={cn(
                  "text-xl",
                  registrationType === 'lyrics_only' ? "text-[#00C853]" : "text-gray-500"
                )} 
              />
              <input 
                type="radio" 
                name="registrationType" 
                className="sr-only"
                checked={registrationType === 'lyrics_only'}
                onChange={() => setRegistrationType('lyrics_only')}
              />
            </label>
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-white">
              Gênero Musical <span className="text-[#00C853]">*</span>
            </label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E] p-4 pr-12 text-[15px] text-white focus:border-[#00C853] focus:outline-none focus:ring-1 focus:ring-[#00C853] transition-all"
              >
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value} disabled={g.value === ''}>
                    {g.label}
                  </option>
                ))}
              </select>
              <MaterialIcon 
                name="expand_more" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-500 pointer-events-none" 
              />
            </div>
          </div>

          {/* Version */}
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-white">
              Versão
            </label>
            <Input
              type="text"
              placeholder="Ex: Original, Remix, Acústica"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] focus:border-[#00C853] focus:ring-0 outline-none transition-all placeholder-gray-600 text-white text-[15px] h-auto"
            />
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[15px] font-medium text-white">
                Letra da Música <span className="text-[#00C853]">*</span>
              </label>
              <button 
                type="button"
                onClick={handlePasteLyrics}
                className="text-[#00C853] text-xs font-semibold flex items-center gap-1"
              >
                <MaterialIcon name="content_paste" className="text-base" />
                Colar
              </button>
            </div>
            <Textarea
              placeholder="Cole ou digite a letra da sua composição aqui..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={6}
              className="w-full px-4 py-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] focus:border-[#00C853] focus:ring-0 outline-none transition-all placeholder-gray-600 text-white text-[15px] resize-y"
            />
          </div>

          {/* Audio File */}
          {registrationType === 'complete' && (
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-white">
                Arquivo de Áudio <span className="text-[#00C853]">*</span>
              </label>
              
              {!audioFile ? (
                <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2C2C2E] bg-[#1C1C1E]/50 p-8 transition-all active:scale-[0.99] cursor-pointer">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-gray-500">
                    <MaterialIcon name="cloud_upload" className="text-3xl" />
                  </div>
                  <p className="text-white text-sm font-semibold text-center">Toque para enviar o áudio</p>
                  <p className="text-gray-500 text-xs mt-1 text-center">Suporta MP3, WAV ou AIFF (Max 50MB)</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-[#00C853]/40 bg-[#1C1C1E] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00C853]/15">
                      <MaterialIcon name="audio_file" className="text-2xl text-[#00C853]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{audioFile.name}</p>
                      <p className="text-gray-500 text-xs">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <MaterialIcon name="delete_outline" className="text-xl" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-white">
              Observações Adicionais <span className="text-gray-500 text-xs font-normal ml-1">(Opcional)</span>
            </label>
            <Textarea
              placeholder="Informações sobre co-autores, samples utilizados, etc."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              className="w-full px-4 py-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] focus:border-[#00C853] focus:ring-0 outline-none transition-all placeholder-gray-600 text-white text-[15px] resize-none"
            />
          </div>
        </div>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-t border-white/10 p-4 pb-8">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            "w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2",
            canContinue 
              ? "bg-[#00C853] text-black active:scale-[0.98] shadow-[0_0_20px_rgba(0,200,83,0.3)]" 
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          Continuar
          <MaterialIcon name="arrow_forward" className="text-xl" />
        </button>
      </div>
    </div>
  );
};
