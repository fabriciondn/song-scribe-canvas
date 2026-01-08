import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Modal states
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'token'>('manual');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorCpf, setNewAuthorCpf] = useState('');
  const [partnerToken, setPartnerToken] = useState('');
  const [isSearchingToken, setIsSearchingToken] = useState(false);

  function getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Formatar CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const handleAddAuthorManual = () => {
    if (newAuthorName.trim() && newAuthorCpf.trim()) {
      const newAuthor: Author = {
        id: Date.now().toString(),
        name: newAuthorName.trim(),
        initials: getInitials(newAuthorName.trim()),
        percentage: null,
        isTitular: false,
        cpf: newAuthorCpf.trim(),
        isFromPlatform: false,
      };
      setAuthors([...authors, newAuthor]);
      resetModal();
      toast.success('Co-autor adicionado com sucesso!');
    }
  };

  const handleSearchByToken = async () => {
    if (!partnerToken.trim()) return;
    
    setIsSearchingToken(true);
    try {
      // Buscar o token de parceiro na tabela composer_tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('composer_tokens')
        .select('user_id, is_active, expires_at')
        .eq('token', partnerToken.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!tokenData) {
        toast.error('Token inválido ou expirado');
        return;
      }

      // Verificar se o token não expirou
      if (new Date(tokenData.expires_at) < new Date()) {
        toast.error('Este token já expirou');
        return;
      }

      // Buscar os dados do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, cpf, avatar_url')
        .eq('id', tokenData.user_id)
        .single();

      if (profileError) throw profileError;

      if (!profileData) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Verificar se o co-autor já foi adicionado
      if (authors.some(a => a.id === profileData.id)) {
        toast.error('Este co-autor já foi adicionado');
        return;
      }

      // Adicionar o co-autor
      const newAuthor: Author = {
        id: profileData.id,
        name: profileData.name || 'Usuário',
        initials: getInitials(profileData.name || 'US'),
        percentage: null,
        isTitular: false,
        cpf: profileData.cpf || '',
        avatarUrl: profileData.avatar_url || undefined,
        isFromPlatform: true,
      };
      
      setAuthors([...authors, newAuthor]);
      resetModal();
      toast.success(`${profileData.name} foi adicionado como co-autor!`);
    } catch (error) {
      console.error('Erro ao buscar token:', error);
      toast.error('Erro ao buscar co-autor. Tente novamente.');
    } finally {
      setIsSearchingToken(false);
    }
  };

  const resetModal = () => {
    setShowAddAuthorModal(false);
    setAddMode('manual');
    setNewAuthorName('');
    setNewAuthorCpf('');
    setPartnerToken('');
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
  const canAddManual = newAuthorName.trim().length > 0 && newAuthorCpf.replace(/\D/g, '').length === 11;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-black">
        <button 
          className="p-2 -ml-2"
          onClick={() => navigate(-1)}
        >
          <MaterialIcon name="arrow_back" className="text-2xl text-white" />
        </button>
        <div className="font-semibold text-lg">Registro Autoral</div>
        <button className="p-2 -mr-2">
          <MaterialIcon name="help_outline" className="text-2xl text-gray-400" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-32">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 mt-2 px-2">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#00C853] text-white flex items-center justify-center font-bold text-base">
              1
            </div>
            <span className="text-xs mt-2 font-medium text-[#00C853]">Básico</span>
          </div>
          
          {/* Line 1 */}
          <div className="h-[2px] flex-1 bg-[#2C2C2E] mx-3"></div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#2C2C2E] text-gray-500 flex items-center justify-center font-bold text-base border border-[#3C3C3E]">
              2
            </div>
            <span className="text-xs mt-2 font-medium text-gray-500">Mídia</span>
          </div>
          
          {/* Line 2 */}
          <div className="h-[2px] flex-1 bg-[#2C2C2E] mx-3"></div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#2C2C2E] text-gray-500 flex items-center justify-center font-bold text-base border border-[#3C3C3E]">
              3
            </div>
            <span className="text-xs mt-2 font-medium text-gray-500">Revisão</span>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold mb-3 text-white">Título e Autores</h1>
          <p className="text-[15px] text-gray-400 leading-relaxed">
            Comece definindo o nome da sua obra e quem participou da criação dela.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-gray-300" htmlFor="songTitle">
              Título da Obra <span className="text-[#00C853]">*</span>
            </label>
            <div className="relative">
              <Input
                id="songTitle"
                type="text"
                placeholder="Ex: Noite de Verão"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] focus:border-[#00C853] focus:ring-0 outline-none transition-all placeholder-gray-600 text-white text-base h-auto"
              />
              <MaterialIcon name="music_note" className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-500" />
            </div>
            <p className="text-[13px] text-gray-500">O nome oficial da música ou composição.</p>
          </div>

          {/* Authors Section */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <label className="block text-[15px] font-medium text-gray-300">
                Autores e Compositores
              </label>
              <button
                type="button"
                className="text-[#00C853] text-sm font-semibold flex items-center"
                onClick={() => setShowAddAuthorModal(true)}
              >
                <MaterialIcon name="add_circle_outline" className="text-lg mr-1" />
                Adicionar
              </button>
            </div>

            {/* Titular Author Card */}
            {authors.filter(a => a.isTitular).map((author) => (
              <div
                key={author.id}
                className="bg-[#1C1C1E] border border-[#00C853]/40 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
              >
                {/* Green left border */}
                <div className="absolute inset-y-0 left-0 w-1 bg-[#00C853]"></div>
                
                <div className="flex items-center gap-3 pl-3">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#00C853]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00C853] flex items-center justify-center text-white font-bold text-sm">
                      {author.initials}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[15px] text-white">Você (Titular)</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] text-gray-400">100% Participação</span>
                      <MaterialIcon name="edit" className="text-sm text-[#00C853] cursor-pointer" />
                    </div>
                  </div>
                </div>
                
                {/* Titular Badge */}
                <div className="flex items-center bg-[#00C853]/15 px-3 py-1.5 rounded-lg">
                  <MaterialIcon name="verified" filled className="text-base text-[#00C853] mr-1" />
                  <span className="text-xs font-semibold text-[#00C853]">Titular</span>
                </div>
              </div>
            ))}

            {/* Other Authors */}
            {authors.filter(a => !a.isTitular).map((author) => (
              <div
                key={author.id}
                className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {author.avatarUrl ? (
                    <img 
                      src={author.avatarUrl} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center text-gray-300 font-bold text-sm">
                      {author.initials}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[15px] text-white">{author.name}</p>
                      {author.isFromPlatform && (
                        <MaterialIcon name="verified" filled className="text-sm text-blue-400" />
                      )}
                    </div>
                    <span className="text-[13px] text-[#F97316] font-medium">Definir %</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(author.id)}
                  className="p-2 text-gray-400"
                >
                  <MaterialIcon name="delete_outline" className="text-2xl" />
                </button>
              </div>
            ))}
          </div>

          {/* Samples Checkbox */}
          <div className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex items-center mt-0.5">
                <Checkbox
                  checked={hasSamples}
                  onCheckedChange={(checked) => setHasSamples(checked === true)}
                  className={cn(
                    "h-5 w-5 rounded border-2",
                    hasSamples 
                      ? "border-[#00C853] bg-[#00C853] data-[state=checked]:bg-[#00C853]" 
                      : "border-gray-600 bg-transparent"
                  )}
                />
              </div>
              <span className="text-[15px] text-gray-400 leading-snug">
                Esta obra contém samples ou trechos de terceiros?
              </span>
            </label>
          </div>
        </form>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1C1C1E] border-t border-[#2C2C2E] p-4 pb-8">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            "w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2",
            canContinue 
              ? "bg-[#00C853] text-white active:scale-[0.98]" 
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          Continuar
          <MaterialIcon name="arrow_forward" className="text-xl" />
        </button>
      </div>

      {/* Add Co-Author Modal */}
      {showAddAuthorModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full bg-[#1C1C1E] rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Adicionar Co-autor</h2>
              <button onClick={resetModal} className="p-2 text-gray-400">
                <MaterialIcon name="close" className="text-2xl" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
                  addMode === 'manual'
                    ? "bg-[#00C853] text-white"
                    : "bg-[#2C2C2E] text-gray-400"
                )}
              >
                <MaterialIcon name="edit" className="text-base mr-1 align-middle" />
                Informar Dados
              </button>
              <button
                type="button"
                onClick={() => setAddMode('token')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
                  addMode === 'token'
                    ? "bg-[#00C853] text-white"
                    : "bg-[#2C2C2E] text-gray-400"
                )}
              >
                <MaterialIcon name="key" className="text-base mr-1 align-middle" />
                Token de Parceiro
              </button>
            </div>

            {/* Manual Mode */}
            {addMode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo do Co-autor <span className="text-[#00C853]">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#2C2C2E] border border-[#3C3C3E] focus:border-[#00C853] text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CPF do Co-autor <span className="text-[#00C853]">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newAuthorCpf}
                    onChange={(e) => setNewAuthorCpf(formatCpf(e.target.value))}
                    maxLength={14}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#2C2C2E] border border-[#3C3C3E] focus:border-[#00C853] text-white placeholder-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAuthorManual}
                  disabled={!canAddManual}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    canAddManual
                      ? "bg-[#00C853] text-white"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <MaterialIcon name="person_add" className="text-xl" />
                  Adicionar Co-autor
                </button>
              </div>
            )}

            {/* Token Mode */}
            {addMode === 'token' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MaterialIcon name="info" className="text-blue-400 text-xl mt-0.5" />
                    <p className="text-sm text-blue-200 leading-relaxed">
                      Se o co-autor é cadastrado na plataforma, peça o <strong>Token de Parceiro</strong> dele. 
                      Os dados serão preenchidos automaticamente.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token de Parceiro <span className="text-[#00C853]">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Cole o token aqui"
                    value={partnerToken}
                    onChange={(e) => setPartnerToken(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#2C2C2E] border border-[#3C3C3E] focus:border-[#00C853] text-white placeholder-gray-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchByToken}
                  disabled={!partnerToken.trim() || isSearchingToken}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    partnerToken.trim() && !isSearchingToken
                      ? "bg-[#00C853] text-white"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSearchingToken ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <MaterialIcon name="search" className="text-xl" />
                      Buscar Co-autor
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileRegistrationStep1;
