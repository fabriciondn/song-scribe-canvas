
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileMusic
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Dados mockados para demonstração
const mockData = {
  compositions: {
    total: 47,
    finished: 23,
    drafts: 18,
    lastEdited: {
      title: "Estrelas do Amanhã",
      date: "2025-01-20"
    }
  },
  distribution: {
    totalEarnings: 8624.12,
    monthlyEarnings: 2340.50,
    lastPayment: {
      amount: 1250.75,
      date: "2025-01-15"
    },
    topSong: "Lua Cheia",
    platformData: [
      { name: 'Spotify', value: 55, color: '#1DB954' },
      { name: 'YouTube', value: 25, color: '#FF0000' },
      { name: 'Apple Music', value: 12, color: '#000000' },
      { name: 'Deezer', value: 8, color: '#A238FF' }
    ]
  },
  partnerships: {
    active: 5,
    recent: [
      { name: "Maria Silva", role: "Intérprete" },
      { name: "João Santos", role: "Produtor" },
      { name: "Ana Costa", role: "Compositora" }
    ]
  },
  folders: {
    total: 12,
    breakdown: [
      { name: "Ideias", count: 15 },
      { name: "Rascunhos", count: 18 },
      { name: "Finalizadas", count: 23 }
    ]
  },
  templates: {
    created: 8,
    generated: 156,
    lastDA: {
      title: "DA - Noite Estrelada",
      date: "2025-01-18"
    }
  },
  notifications: [
    { message: "Novo pagamento recebido: R$ 450,30", time: "2h atrás", type: "payment" },
    { message: "Colaboração aceita por Maria Silva", time: "1 dia atrás", type: "partnership" },
    { message: "Lembrete: Enviar DA por e-mail", time: "3 dias atrás", type: "reminder" }
  ]
};

const monthlyData = [
  { name: 'Nov', value: 1200 },
  { name: 'Dez', value: 1800 },
  { name: 'Jan', value: 2340 }
];

const chartConfig = {
  value: {
    label: "Valor (R$)",
    theme: {
      light: "#00bd4b",
      dark: "#00bd4b",
    },
  },
};

const DashboardHome: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['all']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes('all') || expandedSections.includes(section);

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
                <div className="text-2xl font-bold text-blue-600">{mockData.compositions.total}</div>
                <div className="text-sm text-gray-600">Total de Letras</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{mockData.compositions.finished}</div>
                <div className="text-sm text-gray-600">Finalizadas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{mockData.compositions.drafts}</div>
                <div className="text-sm text-gray-600">Rascunhos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{mockData.compositions.lastEdited.title}</div>
                <div className="text-sm text-gray-600">Última Editada</div>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to="/composer">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Link>
                </Button>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {mockData.distribution.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600">Total Acumulado</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {mockData.distribution.monthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600">Este Mês</div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Último Pagamento</div>
                      <div className="text-sm text-gray-600">
                        R$ {mockData.distribution.lastPayment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">{mockData.distribution.lastPayment.date}</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/distribuicao">Ver Relatório Completo</Link>
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Receita por Plataforma</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={mockData.distribution.platformData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {mockData.distribution.platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
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
                  <div className="text-2xl font-bold text-purple-600">{mockData.partnerships.active}</div>
                  <div className="text-sm text-gray-600">Colaborações Ativas</div>
                </div>
                <Button className="w-full" asChild>
                  <Link to="/partnerships">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Convidar Novo Parceiro
                  </Link>
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Últimos Colaboradores</h4>
                <div className="space-y-2">
                  {mockData.partnerships.recent.map((partner, index) => (
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
                <div className="text-2xl font-bold text-yellow-600">{mockData.folders.total}</div>
                <div className="text-sm text-gray-600">Total de Pastas</div>
              </div>
              <div className="space-y-2">
                {mockData.folders.breakdown.map((folder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{folder.name}</span>
                    <Badge variant="secondary">{folder.count}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/folders">Ver Todas as Pastas</Link>
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
                  <div className="text-2xl font-bold text-indigo-600">{mockData.templates.created}</div>
                  <div className="text-sm text-gray-600">Modelos Criados</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{mockData.templates.generated}</div>
                  <div className="text-sm text-gray-600">DAs Gerados</div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="font-medium">{mockData.templates.lastDA.title}</div>
                <div className="text-sm text-gray-600 mb-2">{mockData.templates.lastDA.date}</div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar PDF
                </Button>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/templates">Gerenciar Modelos</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notificações e Sugestões */}
      {isExpanded('notifications') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              Notificações e Avisos
            </CardTitle>
            <CardDescription>Últimas atualizações e lembretes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.notifications.map((notification, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'payment' ? 'bg-green-500' :
                    notification.type === 'partnership' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm">{notification.message}</div>
                    <div className="text-xs text-gray-500">{notification.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Tendências */}
      {isExpanded('trends') && (
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" />
              Tendências de Rendimento
            </CardTitle>
            <CardDescription>Evolução mensal dos seus ganhos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#00bd4b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHome;
