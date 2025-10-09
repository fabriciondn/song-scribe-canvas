
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import FeatureCarousel from '@/components/dashboard/FeatureCarousel';
import { CardSelector } from '@/components/dashboard/CardSelector';
import { TransactionCard } from '@/components/dashboard/TransactionCard';
import { TrialBanner } from '@/components/ui/TrialBanner';
import { 
  Edit, 
  DollarSign, 
  Users, 
  Folder, 
  Bell, 
  Eye,
  UserPlus,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Music,
  FileMusic,
  ChevronRight,
  Shield,
  Download
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useDashboardCardSelection } from '@/hooks/useDashboardCardSelection';
import { useUserRole } from '@/hooks/useUserRole';

const DashboardHome: React.FC = () => {
  const { stats, isLoading, error } = useDashboardStats();
  const isMobile = useMobileDetection();
  const { expandedSections, toggleSection, isExpanded } = useDashboardCardSelection();
  const { isPro } = useUserRole();

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
    <>
      {/* Banner Carousel Fixo - Não rola com a página */}
      <div className="fixed left-0 right-0 top-16 z-20 bg-background px-6 pt-4 pb-4">
        <div className="container mx-auto">
          <FeatureCarousel />
        </div>
      </div>

      {/* Conteúdo com espaçamento para o banner fixo */}
      <div className="container mx-auto pt-[280px] space-y-6">
        
        <div className="flex items-center justify-end">
        <CardSelector 
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
        >
          <Button variant="outline" size="sm">
            {expandedSections.includes('all') ? 'Recolher Tudo' : 'Configurar Cards'}
          </Button>
        </CardSelector>
      </div>

      {/* Resumo de Composições - Apenas Pro */}
      {isPro && isExpanded('compositions') && (
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
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.compositions.total}</div>
                <div className="text-sm text-muted-foreground">Total de Letras</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.compositions.finished}</div>
                <div className="text-sm text-muted-foreground">Finalizadas</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.compositions.drafts}</div>
                <div className="text-sm text-muted-foreground">Rascunhos</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                {stats.compositions.lastEdited ? (
                  <>
                    <div className="text-lg font-semibold text-purple-600">{stats.compositions.lastEdited.title}</div>
                    <div className="text-sm text-muted-foreground">Última Editada</div>
                    <div className="text-xs text-muted-foreground">{stats.compositions.lastEdited.date}</div>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link to="/composer">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-muted-foreground">Nenhuma composição</div>
                    <div className="text-sm text-muted-foreground">Crie sua primeira música</div>
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


      {/* Parcerias - Apenas Pro */}
      {isPro && isExpanded('partnerships') && (
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
                <div className="text-center p-4 bg-muted rounded-lg mb-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.partnerships.active}</div>
                  <div className="text-sm text-muted-foreground">Colaborações Ativas</div>
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
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{partner.name}</div>
                            <div className="text-sm text-muted-foreground">{partner.role}</div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma parceria criada ainda</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Obras Registradas */}
      {isExpanded('registeredWorks') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Obras Registradas
            </CardTitle>
            <CardDescription>Registros de autoria das suas criações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-muted rounded-lg mb-4">
              <div className="text-2xl font-bold text-green-600">{stats.registeredWorks.total}</div>
              <div className="text-sm text-muted-foreground">Obras Protegidas</div>
            </div>
            {stats.registeredWorks.lastRegistered ? (
              <div className="p-4 bg-muted rounded-lg mb-4">
                <div className="font-medium text-foreground">{stats.registeredWorks.lastRegistered.title}</div>
                <div className="text-sm text-muted-foreground mb-2">Registrada em {stats.registeredWorks.lastRegistered.date}</div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/registered-works">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Certificado
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center p-4 bg-muted rounded-lg mb-4">
                <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma obra registrada ainda</p>
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard/registered-works">
                {stats.registeredWorks.total === 0 ? 'Registrar Primeira Obra' : 'Ver Todas as Obras'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Organização de Pastas e Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Organização de Pastas - Apenas Pro */}
        {isPro && isExpanded('folders') && (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-yellow-600" />
                Organização de Pastas
              </CardTitle>
              <CardDescription>Estrutura dos seus projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-muted rounded-lg mb-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.folders.total}</div>
                <div className="text-sm text-muted-foreground">Total de Pastas</div>
              </div>
              {stats.folders.breakdown.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {stats.folders.breakdown.map((folder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">{folder.name}</span>
                      <Badge variant="secondary">{folder.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-muted rounded-lg mb-4">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma pasta criada ainda</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/folders">{stats.folders.total === 0 ? 'Criar Primeira Pasta' : 'Ver Todas as Pastas'}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
      </div>
    </>
  );
};

export default DashboardHome;
