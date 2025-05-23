import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Search, Upload, RefreshCw, ArrowUpRight } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dados mockados para a demonstração
const mockObras = [
  {
    id: '1',
    nome: 'Estrela do Mar',
    plataformas: ['Spotify', 'YouTube', 'Apple Music'],
    participacao: 70,
    valorTotal: 2345.67,
    ultimoPagamento: '2025-04-15',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Lua Cheia',
    plataformas: ['Spotify', 'Deezer'],
    participacao: 50,
    valorTotal: 1278.90,
    ultimoPagamento: '2025-04-10',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Céu Azul',
    plataformas: ['YouTube', 'Apple Music'],
    participacao: 100,
    valorTotal: 3452.21,
    ultimoPagamento: '2025-03-25',
    status: 'ativo'
  },
  {
    id: '4',
    nome: 'Caminho das Pedras',
    plataformas: ['Spotify', 'YouTube', 'Deezer', 'Amazon Music'],
    participacao: 33,
    valorTotal: 980.45,
    ultimoPagamento: '2025-03-18',
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'Noite Estrelada',
    plataformas: ['Spotify'],
    participacao: 80,
    valorTotal: 567.89,
    ultimoPagamento: '2025-03-08',
    status: 'pendente'
  }
];

const chartData = [
  { name: 'Jan', valor: 1200 },
  { name: 'Fev', valor: 1800 },
  { name: 'Mar', valor: 1500 },
  { name: 'Abr', valor: 2100 },
  { name: 'Mai', valor: 1700 },
  { name: 'Jun', valor: 2300 },
];

const pieData = [
  { name: 'Spotify', value: 55 },
  { name: 'YouTube', value: 25 },
  { name: 'Apple Music', value: 12 },
  { name: 'Deezer', value: 5 },
  { name: 'Outros', value: 3 },
];

const COLORS = ['#00bd4b', '#34d96c', '#65e48e', '#96efb3', '#c7fad9'];

const chartConfig = {
  valor: {
    label: "Valor Recebido (R$)",
    theme: {
      light: "#00bd4b",
      dark: "#00bd4b",
    },
  },
};

interface PlataformaProps {
  nome: string;
}

const PlataformaIcon: React.FC<PlataformaProps> = ({ nome }) => {
  const getIconClass = (plataforma: string) => {
    switch (plataforma.toLowerCase()) {
      case 'spotify':
        return 'bg-green-500';
      case 'youtube':
        return 'bg-red-500';
      case 'apple music':
        return 'bg-pink-500';
      case 'deezer':
        return 'bg-purple-500';
      case 'amazon music':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <span className={`inline-block w-3 h-3 rounded-full ${getIconClass(nome)} mr-1`}></span>
  );
};

const Distribuicao: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('todas');
  
  const filteredObras = mockObras
    .filter(obra => {
      const matchesTerm = obra.nome.toLowerCase().includes(searchTerm.toLowerCase());
      if (tab === 'todas') return matchesTerm;
      return matchesTerm && obra.status === tab;
    });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Distribuição</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Rendimentos
            </CardTitle>
            <CardDescription>Todas as plataformas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 8.624,12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                +18% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              desde o mês passado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Obra
            </CardTitle>
            <CardDescription>Valor médio recebido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.725,82</div>
            <p className="text-xs text-muted-foreground">
              Baseado em {mockObras.length} obras
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Pagamento
            </CardTitle>
            <CardDescription>Estimativa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 2.150,00</div>
            <p className="text-xs text-muted-foreground">
              Previsto para 15/06/2025
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Rendimentos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valor" fill="#00bd4b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Divisão por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Buscar obras..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Relatório
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="todas" className="mb-8" onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="ativo">Ativas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Música</TableHead>
                <TableHead>Plataformas</TableHead>
                <TableHead className="text-right">Participação</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Último Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObras.map((obra) => (
                <TableRow key={obra.id}>
                  <TableCell className="font-medium">{obra.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {obra.plataformas.map(plat => (
                        <span key={plat} className="inline-flex items-center text-xs">
                          <PlataformaIcon nome={plat} /> {plat}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{obra.participacao}%</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {obra.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(obra.ultimoPagamento).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={obra.status === 'ativo' ? 'default' : 'outline'} className={obra.status === 'ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {obra.status === 'ativo' ? 'Ativo' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/distribuicao/${obra.id}`}>Ver Detalhes</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredObras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhuma obra encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Distribuicao;
