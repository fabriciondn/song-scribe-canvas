import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFolders, createFolder, Folder } from '@/services/folderService';
import { getBases, BaseMusical } from '@/services/basesMusicais/basesService';
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

interface MobileNewDraftSetupProps {
  onContinue: (config: {
    title: string;
    folderId: string | null;
    selectedBase: BaseMusical | null;
  }) => void;
  onBack: () => void;
}

export const MobileNewDraftSetup: React.FC<MobileNewDraftSetupProps> = ({ onContinue, onBack }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<BaseMusical | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [playingBaseId, setPlayingBaseId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch folders
  const { data: folders = [], refetch: refetchFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: getFolders,
  });

  // Fetch bases
  const { data: bases = [] } = useQuery<BaseMusical[]>({
    queryKey: ['music-bases-list'],
    queryFn: getBases,
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPreview = async (base: BaseMusical, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Se já está tocando essa base, para
    if (playingBaseId === base.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingBaseId(null);
      return;
    }

    // Para qualquer áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Usa a file_url que já vem do serviço
    if (!base.file_url) {
      toast.error('Arquivo de áudio não disponível');
      return;
    }

    try {
      const audio = new Audio(base.file_url);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setPlayingBaseId(null);
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Erro de áudio:', e);
        toast.error('Erro ao reproduzir a base');
        setPlayingBaseId(null);
        audioRef.current = null;
      });

      await audio.play();
      setPlayingBaseId(base.id);
    } catch (error) {
      console.error('Erro ao reproduzir:', error);
      toast.error('Erro ao reproduzir a base');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    try {
      const newFolder = await createFolder(newFolderName);
      await refetchFolders();
      setSelectedFolderId(newFolder.id);
      setNewFolderName('');
      setShowNewFolderInput(false);
      toast.success('Pasta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
    }
  };

  const handleContinue = () => {
    if (!title.trim()) {
      toast.error('Digite um nome para o projeto');
      return;
    }

    onContinue({
      title: title.trim(),
      folderId: selectedFolderId,
      selectedBase,
    });
  };

  const handleSelectFolder = (value: string) => {
    if (value === 'new') {
      setShowNewFolderInput(true);
    } else if (value === 'none') {
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(value);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Outfit',sans-serif]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center hover:bg-[#3C3C3E] transition-colors"
        >
          <MaterialIcon name="arrow_back" className="text-xl text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1 text-center pr-10">Novo Rascunho</h1>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        {/* Icon and description */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C853]/20 to-[#00C853]/5 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#00C853]/10">
            <MaterialIcon name="post_add" className="text-3xl text-[#00C853]" />
          </div>
          <p className="text-center text-slate-400 text-sm max-w-[250px]">
            Configure os detalhes da sua nova ideia musical antes de começar.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Nome do Projeto */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300 ml-1">
              Nome do Projeto
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Minha Música Nova"
                className="w-full bg-[#2C2C2E] border-2 border-transparent focus:border-[#00C853] focus:ring-0 rounded-2xl px-5 py-4 text-white font-medium transition-all placeholder-slate-500 outline-none"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 pointer-events-none">
                <MaterialIcon name="edit" className="text-xl" />
              </div>
            </div>
          </div>

          {/* Salvar na Pasta */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300 ml-1">
              Salvar na Pasta
            </label>
            
            {showNewFolderInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nome da nova pasta"
                  className="flex-1 bg-[#2C2C2E] border-2 border-[#00C853] focus:ring-0 rounded-2xl px-5 py-4 text-white font-medium transition-all placeholder-slate-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-4 bg-[#00C853] rounded-2xl text-white font-bold"
                >
                  <MaterialIcon name="check" />
                </button>
                <button
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                  className="px-4 bg-[#2C2C2E] rounded-2xl text-slate-300"
                >
                  <MaterialIcon name="close" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedFolderId || 'none'}
                  onChange={(e) => handleSelectFolder(e.target.value)}
                  className="w-full appearance-none bg-[#2C2C2E] border-2 border-transparent focus:border-[#00C853] focus:ring-0 rounded-2xl px-5 py-4 pr-12 text-white font-medium transition-all outline-none cursor-pointer"
                >
                  <option value="none">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                  <option value="new">+ Criar Nova Pasta</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <MaterialIcon name="expand_more" className="text-2xl" />
                </div>
              </div>
            )}
            
            {selectedFolderId && (
              <div className="flex items-center gap-2 px-2 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
                <p className="text-xs text-slate-400">Pasta sincronizada na nuvem</p>
              </div>
            )}
          </div>

          {/* Base Musical */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="text-sm font-semibold text-slate-300">Base Musical</label>
              <button 
                onClick={() => navigate('/dashboard/bases')}
                className="text-xs font-bold text-[#00C853] hover:text-green-400 transition-colors uppercase tracking-wide"
              >
                Explorar
              </button>
            </div>
            
            <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar pb-2">
              {/* Opção Em Branco */}
              <label 
                className={`relative flex items-center gap-4 p-4 bg-[#2C2C2E] rounded-2xl cursor-pointer border-2 transition-all ${
                  selectedBase === null 
                    ? 'border-[#00C853] shadow-lg shadow-[#00C853]/10' 
                    : 'border-transparent opacity-80 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <input 
                  type="radio" 
                  name="base" 
                  checked={selectedBase === null}
                  onChange={() => setSelectedBase(null)}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] flex items-center justify-center text-slate-400 border border-slate-700">
                  <MaterialIcon name="music_off" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Em Branco</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Começar sem base</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  selectedBase === null 
                    ? 'bg-[#00C853] text-white scale-100' 
                    : 'border-2 border-slate-600 scale-90'
                }`}>
                  {selectedBase === null && <MaterialIcon name="check" className="text-sm" />}
                </div>
              </label>

              {/* Bases disponíveis */}
              {bases.map((base, index) => (
                <div 
                  key={base.id}
                  className={`relative flex items-center gap-4 p-4 bg-[#2C2C2E] rounded-2xl cursor-pointer border-2 transition-all ${
                    selectedBase?.id === base.id 
                      ? 'border-[#00C853] shadow-lg shadow-[#00C853]/10' 
                      : 'border-transparent opacity-80 hover:opacity-100 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedBase(base)}
                >
                  {/* Botão de Play/Pause */}
                  <button
                    onClick={(e) => handlePlayPreview(base, e)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-all ${
                      playingBaseId === base.id 
                        ? 'bg-[#00C853] animate-pulse' 
                        : index % 3 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                          index % 3 === 1 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                          'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}
                  >
                    <MaterialIcon 
                      name={playingBaseId === base.id ? "pause" : "play_arrow"} 
                      filled 
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{base.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{base.genre}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    selectedBase?.id === base.id 
                      ? 'bg-[#00C853] text-white scale-100' 
                      : 'border-2 border-slate-600 scale-90'
                  }`}>
                    {selectedBase?.id === base.id && <MaterialIcon name="check" className="text-sm" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-50 pb-8">
        <button
          onClick={handleContinue}
          className="w-full bg-[#00C853] hover:bg-[#00B848] text-white font-bold text-lg py-5 rounded-2xl shadow-xl shadow-[#00C853]/50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          Continuar
          <MaterialIcon name="arrow_forward" className="text-2xl" />
        </button>
      </div>
    </div>
  );
};
