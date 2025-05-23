
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

// Dados mockados para a página de detalhes
const mockObras = {
  '1': {
    id: '1',
    nome: 'Estrela do Mar',
    plataformas: [
      { nome: 'Spotify', valor: 1250.45 },
      { nome: 'YouTube', valor: 780.22 },
      { nome: 'Apple Music', valor: 315.00 }
    ],
    participacao: 70,
    valorTotal: 2345.67,
    ultimoPagamento: '2025-04-15',
    status: 'ativo',
    observacoes: 'Música com bom desempenho no Spotify. A distribuição para as plataformas foi concluída em janeiro.',
    colaboradores: [
      { nome: 'João Silva', porcentagem: 70, função: 'Compositor' },
      { nome: 'Maria Oliveira', porcentagem: 30, função: 'Interprete' }
    ],
    pagamentos: [
      { data: '2025-04-15', valorBruto: 780.50, descontos: 78.05, valorLiquido: 702.45, forma: 'PIX', status: 'Recebido' },
      { data: '2025-03-15', valorBruto: 650.20, descontos: 65.02, valorLiquido: 585.18, forma: 'PIX', status: 'Recebido' },
      { data: '2025-02-15', valorBruto: 520.10, descontos: 52.01, valorLiquido: 468.09, forma: 'Transferência', status: 'Recebido' },
      { data: '2025-01-15', valorBruto: 710.30, descontos: 71.03, valorLiquido: 639.27, forma: 'PIX', status: 'Recebido' },
      { data: '2025-05-15', valorBruto: 820.00, descontos: 82.00, valorLiquido: 738.00, forma: 'PIX', status: 'Agendado' }
    ],
    comprovantes: [
      { id: 'comp1', nome: 'comprovante-abr-2025.pdf', data: '2025-04-15' },
      { id: 'comp2', nome: 'comprovante-mar-2025.pdf', data: '2025-03-15' },
      { id: 'comp3', nome: 'comprovante-fev-2025.pdf', data: '2025-02-15' }
    ],
    dadosMensais: [
      { mes: 'Jan', spotify: 220, youtube: 180, appleMusic: 75 },
      { mes: 'Fev', spotify: 280, youtube: 150, appleMusic: 90 },
      { mes: 'Mar', spotify: 320, youtube: 210, appleMusic: 120 },
      { mes: 'Abr', spotify: 380, youtube: 240, appleMusic: 160 }
    ]
  },
  '2': {
    id: '2',
    nome: 'Lua Cheia',
    plataformas: [
      { nome: 'Spotify', valor: 820.45 },
      { nome: 'Deezer', valor: 458.45 }
    ],
    participacao: 50,
    valorTotal: 1278.90,
    ultimoPagamento: '2025-04-10',
    status: 'ativo',
    observacoes: 'Acordada distribuição 50/50 com parceiro de composição.',
    colaboradores: [
      { nome: 'Carlos Mendes', porcentagem: 50, função: 'Compositor' },
      { nome: 'Ana Souza', porcentagem: 50, função: 'Compositora' }
    ],
    pagamentos: [
      { data: '2025-04-10', valorBruto: 320.50, descontos: 32.05, valorLiquido: 288.45, forma: 'PIX', status: 'Recebido' },
      { data: '2025-03-10', valorBruto: 290.20, descontos: 29.02, valorLiquido: 261.18, forma: 'PIX', status: 'Recebido' },
      { data: '2025-05-10', valorBruto: 340.00, descontos: 34.00, valorLiquido: 306.00, forma: 'PIX', status: 'Agendado' }
    ],
    comprovantes: [
      { id: 'comp4', nome: 'comprovante-abr-2025-lua.pdf', data: '2025-04-10' },
      { id: 'comp5', nome: 'comprovante-mar-2025-lua.pdf', data: '2025-03-10' }
    ],
    dadosMensais: [
      { mes: 'Jan', spotify: 180, deezer: 120 },
      { mes: 'Fev', spotify: 220, deezer: 140 },
      { mes: 'Mar', spotify: 200, deezer: 160 },
      { mes: 'Abr', spotify: 250, deezer: 190 }
    ]
  }
};

const chartConfig = {
  spotify: {
    label: "Spotify",
    theme: {
      light: "#1DB954",
      dark: "#1DB954",
    },
  },
  youtube: {
    label: "YouTube",
    theme: {
      light: "#FF0000",
      dark: "#FF0000",
    },
  },
  appleMusic: {
    label: "Apple Music",
    theme: {
      light: "#FB5BC5",
      dark: "#FB5BC5",
    },
  },
  deezer: {
    label: "Deezer",
    theme: {
      light: "#7740BD",
      dark: "#7740BD",
    },
  }
};

const DetalhesObra: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('visaoGeral');
  const [observacoes, setObservacoes] = useState(mockObras[id as keyof typeof mockObras]?.observacoes || '');
  
  if (!id || !mockObras[id as keyof typeof mockObras]) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Obra não encontrada</h1>
        <p className="mb-6">A obra que você está procurando não existe ou foi removida.</p>
        <Button asChild>
          <Link to="/distribuicao">Voltar para a lista de obras</Link>
        </Button>
      </div>
    );
  }
  
  const obra = mockObras[id as keyof typeof mockObras];
  const totalPorcentagem = obra.colaboradores.reduce((total, col) => total + col.porcentagem, 0);
  
  const renderValorComParticipacao = (valor: number) => {
    const participacaoProporcional = valor * (obra.participacao / 100);
    return participacaoProporcional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const proximoPagamento = obra.pagamentos.find(p => p.status === 'Agendado');
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/distribuicao">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{obra.nome}</h1>
        <Badge variant={obra.status === 'ativo' ? 'default' : 'outline'} className={obra.status === 'ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
          {obra.status === 'ativo' ? 'Ativo' : 'Pendente'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rendimento Total
            </CardTitle>
            <CardDescription>Todas as plataformas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {obra.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Sua parte: {renderValorComParticipacao(obra.valorTotal)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Último Pagamento
            </CardTitle>
            <CardDescription>Recebido em {new Date(obra.ultimoPagamento).toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {obra.pagamentos.filter(p => p.status === 'Recebido')[0]?.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Via {obra.pagamentos.filter(p => p.status === 'Recebido')[0]?.forma}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Pagamento
            </CardTitle>
            <CardDescription>
              Previsto para {proximoPagamento ? new Date(proximoPagamento.data).toLocaleDateString('pt-BR') : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proximoPagamento 
                ? proximoPagamento.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'Não agendado'}
            </div>
            {proximoPagamento && <p className="text-xs text-muted-foreground">Via {proximoPagamento.forma}</p>}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="visaoGeral" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="visaoGeral">Visão Geral</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visaoGeral" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimentos por Mês</CardTitle>
              <CardDescription>Valores por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <LineChart data={obra.dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  {Object.keys(obra.dadosMensais[0])
                    .filter(key => key !== 'mes')
                    .map((key) => (
                      <Line 
                        key={key}
                        type="monotone" 
                        dataKey={key} 
                        stroke={chartConfig[key as keyof typeof chartConfig]?.theme?.light} 
                        activeDot={{ r: 8 }} 
                      />
                    ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Sua Parte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {obra.plataformas.map((plat) => (
                      <TableRow key={plat.nome}>
                        <TableCell className="font-medium">{plat.nome}</TableCell>
                        <TableCell className="text-right">
                          {plat.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderValorComParticipacao(plat.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {obra.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderValorComParticipacao(obra.valorTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>Divisão de rendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {obra.colaboradores.map((col, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{col.nome}</p>
                        <p className="text-sm text-muted-foreground">{col.função}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{col.porcentagem}%</p>
                        <p className="text-sm text-muted-foreground">
                          {(obra.valorTotal * (col.porcentagem / totalPorcentagem)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Total</p>
                    <div className="text-right">
                      <p className="font-semibold">{totalPorcentagem}%</p>
                      <p className="text-sm">
                        {obra.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta obra..."
                className="min-h-[120px]"
              />
              <div className="mt-4 flex justify-end">
                <Button>Salvar Observações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pagamentos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>Todos os pagamentos relacionados a esta obra</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obra.pagamentos.sort((a, b) => 
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                  ).map((pagamento, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(pagamento.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        {pagamento.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {pagamento.descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {pagamento.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>{pagamento.forma}</TableCell>
                      <TableCell>
                        <Badge variant={pagamento.status === 'Recebido' ? 'default' : pagamento.status === 'Agendado' ? 'outline' : 'secondary'} 
                          className={pagamento.status === 'Recebido' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {pagamento.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {obra.pagamentos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum pagamento registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comprovantes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Comprovantes</span>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovante
                </Button>
              </CardTitle>
              <CardDescription>Documentos relacionados aos pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {obra.comprovantes.length > 0 ? (
                <div className="space-y-4">
                  {obra.comprovantes.map((comp) => (
                    <div key={comp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <p className="font-medium">{comp.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Adicionado em {new Date(comp.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum comprovante</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça o upload de comprovantes de pagamento para esta obra.
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Primeiro Comprovante
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetalhesObra;
