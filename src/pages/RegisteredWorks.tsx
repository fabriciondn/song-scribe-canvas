import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { WorkCard } from '@/components/registered-works/WorkCard';
import { WorkDetailsModal } from '@/components/registered-works/WorkDetailsModal';
import { useMobileDetection } from '@/hooks/use-mobile';

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
  const { isMobile } = useMobileDetection();
  const [selectedWork, setSelectedWork] = useState<RegisteredWork | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleViewDetails = (work: RegisteredWork) => {
    setSelectedWork(work);
    setIsModalOpen(true);
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
        <div className={`grid gap-3 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {works.map((work) => (
            <WorkCard 
              key={work.id}
              work={work}
              onViewDetails={() => handleViewDetails(work)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma obra registrada</h3>
          <p className="text-muted-foreground mb-6">
            Você ainda não possui obras registradas.
          </p>
          <Button asChild>
            <Link to="/dashboard">
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      )}

      {/* Modal de detalhes */}
      <WorkDetailsModal 
        work={selectedWork}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default RegisteredWorks;