import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Calendar, User, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF } from '@/services/certificateService';
import { toast } from '@/hooks/use-toast';

interface RegisteredWork {
  id: string;
  title: string;
  author: string;
  other_authors: string | null;
  genre: string;
  song_version: string;
  lyrics: string;
  hash: string | null;
  created_at: string;
  status: string;
}

const RegisteredWorks: React.FC = () => {
  const { data: works, isLoading, error } = useQuery({
    queryKey: ['registered-works'],
    queryFn: async (): Promise<RegisteredWork[]> => {
      const { data, error } = await supabase
        .from('author_registrations')
        .select('*')
        .eq('status', 'registered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDownloadCertificate = async (work: RegisteredWork) => {
    try {
      await generateCertificatePDF(work);
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
          <h1 className="text-3xl font-bold text-gray-900">Obras Registradas</h1>
          <p className="text-gray-600 mt-1">Visualize e baixe certificados das suas obras registradas</p>
        </div>
      </div>

      {works && works.length > 0 ? (
        <div className="grid gap-6">
          {works.map((work) => (
            <Card key={work.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {work.title}
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Registrada
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span><strong>Autor:</strong> {work.author}</span>
                  </div>
                  {work.other_authors && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span><strong>Co-autores:</strong> {work.other_authors}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span><strong>Gênero:</strong> {work.genre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span><strong>Versão:</strong> {work.song_version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span><strong>Registrado em:</strong> {new Date(work.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {work.hash && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {work.hash.substring(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Letra da Música:</h4>
                  <div className="text-sm text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {work.lyrics.length > 200 
                      ? `${work.lyrics.substring(0, 200)}...` 
                      : work.lyrics
                    }
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleDownloadCertificate(work)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Certificado PDF
                  </Button>
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