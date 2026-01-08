import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Plus, Trash2, Check, ArrowRight, Music, Verified } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface Author {
  id: string;
  name: string;
  initials: string;
  percentage: number | null;
  isTitular: boolean;
}

interface MobileRegistrationStep1Props {
  onContinue: (data: {
    title: string;
    authors: Author[];
    hasSamples: boolean;
  }) => void;
  initialData?: {
    title: string;
    authors: Author[];
    hasSamples: boolean;
  };
}

export const MobileRegistrationStep1: React.FC<MobileRegistrationStep1Props> = ({
  onContinue,
  initialData,
}) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [hasSamples, setHasSamples] = useState(initialData?.hasSamples || false);
  const [authors, setAuthors] = useState<Author[]>(initialData?.authors || [
    {
      id: 'titular',
      name: profile?.name || 'Você',
      initials: getInitials(profile?.name || 'VC'),
      percentage: 100,
      isTitular: true,
    }
  ]);
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');

  function getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const handleAddAuthor = () => {
    if (newAuthorName.trim()) {
      const newAuthor: Author = {
        id: Date.now().toString(),
        name: newAuthorName.trim(),
        initials: getInitials(newAuthorName.trim()),
        percentage: null,
        isTitular: false,
      };
      setAuthors([...authors, newAuthor]);
      setNewAuthorName('');
      setShowAddAuthor(false);
    }
  };

  const handleRemoveAuthor = (id: string) => {
    setAuthors(authors.filter(a => a.id !== id));
  };

  const handleContinue = () => {
    if (title.trim()) {
      onContinue({
        title: title.trim(),
        authors,
        hasSamples,
      });
    }
  };

  const canContinue = title.trim().length > 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/5">
        <button 
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="font-bold text-lg tracking-wide">Registro Autoral</div>
        <button className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-gray-400">
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-32 max-w-md mx-auto w-full">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#00C853] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(0,200,83,0.3)] ring-4 ring-[#00C853]/20">
              1
            </div>
            <span className="text-xs mt-1.5 font-medium text-[#00C853]">Básico</span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-800 mx-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <span className="text-xs mt-1.5 font-medium text-gray-600">Mídia</span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-800 mx-2"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <span className="text-xs mt-1.5 font-medium text-gray-600">Revisão</span>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Título e Autores</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Comece definindo o nome da sua obra e quem participou da criação dela.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-300" htmlFor="songTitle">
              Título da Obra <span className="text-[#00C853]">*</span>
            </label>
            <div className="relative group">
              <Input
                id="songTitle"
                type="text"
                placeholder="Ex: Noite de Verão"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1E] border-2 border-[#2C2C2E] focus:border-[#00C853] focus:ring-0 outline-none transition-all placeholder-gray-600 text-white shadow-sm font-medium h-auto"
              />
              <Music className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none group-focus-within:text-[#00C853] transition-colors" />
            </div>
            <p className="text-xs text-gray-500 pl-1">O nome oficial da música ou composição.</p>
          </div>

          {/* Authors Section */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-300">
                Autores e Compositores
              </label>
              <button
                type="button"
                className="text-[#00C853] text-sm font-semibold flex items-center hover:opacity-80 transition-opacity"
                onClick={() => setShowAddAuthor(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </button>
            </div>

            {/* Add Author Input */}
            {showAddAuthor && (
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Nome do autor"
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1C1C1E] border-2 border-[#2C2C2E] focus:border-[#00C853] text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddAuthor}
                  className="px-4 py-2 bg-[#00C853] text-white rounded-xl font-medium"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAuthor(false);
                    setNewAuthorName('');
                  }}
                  className="px-3 py-2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Titular Author Card */}
            {authors.filter(a => a.isTitular).map((author) => (
              <div
                key={author.id}
                className="bg-[#1C1C1E] border border-[#00C853]/30 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-[#00C853]"></div>
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C853] to-green-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">Você (Titular)</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">100% Participação</span>
                      <span className="text-[10px] text-[#00C853] cursor-pointer hover:text-[#009624]">✏️</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#00C853]/10 px-2 py-1 rounded-lg">
                  <Verified className="w-4 h-4 text-[#00C853] mr-1" />
                  <span className="text-xs font-semibold text-[#00C853]">Titular</span>
                </div>
              </div>
            ))}

            {/* Other Authors */}
            {authors.filter(a => !a.isTitular).map((author) => (
              <div
                key={author.id}
                className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl p-4 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 font-bold text-sm">
                    {author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{author.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500 font-medium">Definir %</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(author.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Samples Checkbox */}
          <div className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <Checkbox
                  checked={hasSamples}
                  onCheckedChange={(checked) => setHasSamples(checked === true)}
                  className={cn(
                    "h-5 w-5 rounded-md border-2",
                    hasSamples 
                      ? "border-[#00C853] bg-[#00C853] data-[state=checked]:bg-[#00C853]" 
                      : "border-gray-600 bg-transparent hover:border-[#00C853]"
                  )}
                />
              </div>
              <div className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                Esta obra contém samples ou trechos de terceiros?
              </div>
            </label>
          </div>
        </form>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1C1C1E] border-t border-white/5 p-5 px-6 pb-8 backdrop-blur-lg z-20">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              "w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group",
              canContinue 
                ? "bg-[#00C853] hover:bg-[#009624] text-white shadow-[#00C853]/30" 
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            Continuar
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="fixed top-20 right-0 w-64 h-64 bg-[#00C853]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-20 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
    </div>
  );
};

export default MobileRegistrationStep1;
