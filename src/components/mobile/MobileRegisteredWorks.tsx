import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { MobileNotificationCenter } from '@/components/mobile/MobileNotificationCenter';
import { MobileCertificateDetails } from '@/components/mobile/MobileCertificateDetails';
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
  genre: string;
  rhythm: string;
  song_version: string;
  lyrics: string;
  other_authors: string | null;
  created_at: string;
  status: string;
  hash: string | null;
}

type FilterType = 'all' | 'analysis' | 'drafts';

// Cores de gradiente para os ícones
const iconGradients = [
  'from-[#8B5CF6] to-[#6366f1]', // Roxo
  'from-[#EC4899] to-[#F43F5E]', // Rosa
  'from-[#0EA5E9] to-[#06B6D4]', // Azul
  'from-[#10B981] to-[#059669]', // Verde
  'from-[#F59E0B] to-[#D97706]', // Laranja
];

export const MobileRegisteredWorks: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workId = searchParams.get('id');
  const currentUser = useCurrentUser();
  const { toggleTheme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: works, isLoading } = useQuery({
    queryKey: ['registered-works-mobile', currentUser?.id],
    queryFn: async (): Promise<RegisteredWork[]> => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('author_registrations')
        .select('id, title, author, genre, rhythm, song_version, lyrics, other_authors, created_at, status, hash')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id && !workId,
  });

  const filteredWorks = useMemo(() => {
    if (!works) return [];
    
    switch (filter) {
      case 'analysis':
        return works.filter(w => w.status === 'em análise');
      case 'drafts':
        return works.filter(w => w.status === 'draft' || w.status === 'pending');
      default:
        return works;
    }
  }, [works, filter]);

  // Se há um ID na URL, mostra os detalhes do certificado
  // (Depois de todos os hooks serem chamados)
  if (workId) {
    return <MobileCertificateDetails />;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'registered' || status === 'completed') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-900/10 text-[#00C853] text-[10px] font-bold uppercase tracking-wider border border-[#00C853]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
          Registrada
        </div>
      );
    }
    if (status === 'em análise') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-900/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider border border-yellow-400/30">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Em Análise
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-800/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border border-gray-600/30">
        Rascunho
      </div>
    );
  };

  const generateWorkId = (id: string) => {
    return `CP-${id.slice(0, 6).toUpperCase()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copiado!');
  };

  const handleViewCertificate = (work: RegisteredWork) => {
    // Navegar para a página de detalhes
    navigate(`/dashboard/registered-works?id=${work.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Outfit',sans-serif]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-2xl text-slate-300" />
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              <MaterialIcon name="light_mode" className="text-2xl text-slate-300" />
            </button>
            <MobileNotificationCenter />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white">Meus Certificados</h1>
          <p className="text-slate-400 mt-1 text-sm">Gerencie suas obras e direitos autorais</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 mt-2 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-[#00C853] text-white shadow-lg shadow-[#00C853]/30'
                : 'bg-[#1C1C1E] text-slate-300 border border-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('analysis')}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'analysis'
                ? 'bg-[#00C853] text-white shadow-lg shadow-[#00C853]/30'
                : 'bg-[#1C1C1E] text-slate-300 border border-slate-700'
            }`}
          >
            Em Análise
          </button>
          <button
            onClick={() => setFilter('drafts')}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'drafts'
                ? 'bg-[#00C853] text-white shadow-lg shadow-[#00C853]/30'
                : 'bg-[#1C1C1E] text-slate-300 border border-slate-700'
            }`}
          >
            Rascunhos
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-24 overflow-y-auto space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00C853]" />
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mb-4">
              <MaterialIcon name="description" className="text-4xl text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma obra encontrada</h3>
            <p className="text-slate-400 text-sm">
              {filter === 'all' 
                ? 'Você ainda não possui obras registradas.' 
                : filter === 'analysis' 
                ? 'Nenhuma obra em análise.' 
                : 'Nenhum rascunho encontrado.'}
            </p>
          </div>
        ) : (
          filteredWorks.map((work, index) => (
            <div 
              key={work.id}
              className="bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-slate-700/50 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start w-full">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${iconGradients[index % iconGradients.length]} flex items-center justify-center shrink-0 shadow-sm`}>
                    <MaterialIcon name="shield" filled className="text-white text-[32px]" />
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start w-full">
                      <h3 className="text-lg font-bold text-white leading-tight truncate pr-2">
                        {work.title}
                      </h3>
                      <button className="text-slate-500 hover:text-slate-300 -mt-1 -mr-2 p-1">
                        <MaterialIcon name="more_vert" className="text-xl" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Registrado em {formatDate(work.created_at)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-[10px] font-bold border border-slate-700 uppercase tracking-wide">
                        {work.genre}
                      </span>
                      {getStatusBadge(work.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-slate-800" />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>ID: <span className="select-all text-slate-400">{generateWorkId(work.id)}</span></span>
                  <button onClick={() => copyToClipboard(generateWorkId(work.id))}>
                    <MaterialIcon name="content_copy" className="text-[14px] cursor-pointer hover:text-slate-300" />
                  </button>
                </div>
                <button 
                  onClick={() => handleViewCertificate(work)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-green-400 transition-colors uppercase tracking-wide"
                >
                  Ver certificado
                  <MaterialIcon name="open_in_new" className="text-base" />
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
