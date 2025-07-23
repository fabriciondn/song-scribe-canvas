
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Edit, 
  DollarSign, 
  Users, 
  Folder, 
  FileText, 
  Bell, 
  Eye,
  UserPlus,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Music,
  FileMusic,
  ChevronRight
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMobileDetection } from '@/hooks/use-mobile';

const DashboardHome: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['all']);
  const { stats, isLoading, error } = useDashboardStats();
  const isMobile = useMobileDetection();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes('all') || expandedSections.includes(section);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral da sua atividade musical</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleSection('all')}>
            {expandedSections.includes('all') ? 'Recolher Tudo' : 'Expandir Tudo'}
          </Button>
        </div>
      </div>

      {/* Resumo de Composições */}
      {isExpanded('compositions') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Resumo de Composições
            </CardTitle>
            <CardDescription>Suas criações musicais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.compositions.total}</div>
                <div className="text-sm text-gray-600">Total de Letras</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.compositions.finished}</div>
                <div className="text-sm text-gray-600">Finalizadas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.compositions.drafts}</div>
                <div className="text-sm text-gray-600">Rascunhos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                {stats.compositions.lastEdited ? (
                  <>
                    <div className="text-lg font-semibold text-purple-600">{stats.compositions.lastEdited.title}</div>
                    <div className="text-sm text-gray-600">Última Editada</div>
                    <div className="text-xs text-gray-500">{stats.compositions.lastEdited.date}</div>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to="/composer">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-gray-400">Nenhuma composição</div>
                    <div className="text-sm text-gray-600">Crie sua primeira música</div>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to="/composer">
                        <Edit className="h-4 w-4 mr-1" />
                        Começar
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição Musical */}
      {isExpanded('distribution') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Distribuição Musical
            </CardTitle>
            <CardDescription>Rendimentos e performance financeira</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-4">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Dados de distribuição não disponíveis</p>
                <p className="text-sm">Conecte sua conta de distribuição para ver os rendimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcerias */}
      {isExpanded('partnerships') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Parcerias
            </CardTitle>
            <CardDescription>Colaborações e trabalhos em equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-center p-4 bg-purple-50 rounded-lg mb-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.partnerships.active}</div>
                  <div className="text-sm text-gray-600">Colaborações Ativas</div>
                </div>
                <Button className="w-full" asChild>
                  <Link to="/partnerships">
                    <UserPlus className="h-4 w-4 mr-1" />
                    {stats.partnerships.active === 0 ? 'Criar Primeira Parceria' : 'Convidar Novo Parceiro'}
                  </Link>
                </Button>
              </div>
              <div>
                {stats.partnerships.recent.length > 0 ? (
                  <>
                    <h4 className="font-semibold mb-3">Últimos Colaboradores</h4>
                    <div className="space-y-2">
                      {stats.partnerships.recent.map((partner, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-sm text-gray-600">{partner.role}</div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Nenhuma parceria criada ainda</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organização de Pastas e Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organização de Pastas */}
        {isExpanded('folders') && (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-yellow-600" />
                Organização de Pastas
              </CardTitle>
              <CardDescription>Estrutura dos seus projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-yellow-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.folders.total}</div>
                <div className="text-sm text-gray-600">Total de Pastas</div>
              </div>
              {stats.folders.breakdown.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {stats.folders.breakdown.map((folder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{folder.name}</span>
                      <Badge variant="secondary">{folder.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg mb-4">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Nenhuma pasta criada ainda</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/folders">{stats.folders.total === 0 ? 'Criar Primeira Pasta' : 'Ver Todas as Pastas'}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modelos de DA */}
        {isExpanded('templates') && (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Modelos de DA
              </CardTitle>
              <CardDescription>Declarações de autoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.templates.created}</div>
                  <div className="text-sm text-gray-600">Modelos Criados</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.templates.generated}</div>
                  <div className="text-sm text-gray-600">DAs Gerados</div>
                </div>
              </div>
              {stats.templates.lastDA ? (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="font-medium">{stats.templates.lastDA.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{stats.templates.lastDA.date}</div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar PDF
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg mb-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Nenhum modelo criado ainda</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/templates">{stats.templates.created === 0 ? 'Criar Primeiro Modelo' : 'Gerenciar Modelos'}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mensagem sobre dados em tempo real */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-800 font-medium">Dashboard em tempo real</p>
              <p className="text-blue-600 text-sm">Os dados são atualizados automaticamente conforme você usa a plataforma.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
