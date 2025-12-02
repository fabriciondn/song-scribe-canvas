import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Sparkles, TrendingUp, Filter, DollarSign, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Update {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix';
  date: string;
  icon: React.ReactNode;
}

const STORAGE_KEY = 'moderator-updates-seen';

// Lista de atualizações recentes
const updates: Update[] = [
  {
    id: 'update-6',
    title: 'Seção de Atualizações',
    description: 'Nova seção de atualizações com sino animado para notificar sobre novas funcionalidades e melhorias do sistema.',
    type: 'feature',
    date: '2025-12-02',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: 'update-5',
    title: 'Faturamento Detalhado',
    description: 'Painel de transações agora mostra o faturamento total considerando R$30 por crédito e R$30 por registro de obra, com resumo completo e histórico unificado.',
    type: 'feature',
    date: '2025-12-02',
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: 'update-4',
    title: 'Correção do Filtro de Créditos',
    description: 'Corrigido problema no dropdown de filtro por créditos que causava tela preta ao clicar. Aumentado z-index para melhor funcionamento.',
    type: 'fix',
    date: '2025-12-02',
    icon: <Filter className="h-5 w-5" />,
  },
  {
    id: 'update-3',
    title: 'Status de Créditos Melhorado',
    description: 'Painel de visão geral agora exibe corretamente os créditos distribuídos (histórico total) e créditos atuais dos usuários gerenciados.',
    type: 'improvement',
    date: '2025-12-02',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'update-2',
    title: 'Top 10 Usuários com Mais Obras',
    description: 'Adicionado ranking dos top 10 clientes que mais registram obras na seção de usuários gerenciados.',
    type: 'feature',
    date: '2025-12-02',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    id: 'update-1',
    title: 'Filtros de Usuários',
    description: 'Novos filtros para buscar usuários gerenciados por nome, email e faixa de créditos.',
    type: 'feature',
    date: '2025-12-02',
    icon: <Filter className="h-5 w-5" />,
  },
];

export const ModeratorUpdates = () => {
  const [seenUpdates, setSeenUpdates] = useState<string[]>([]);

  useEffect(() => {
    // Carregar atualizações já vistas do localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSeenUpdates(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Marcar todas as atualizações como vistas quando o componente é montado
    const allIds = updates.map(u => u.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    setSeenUpdates(allIds);
  }, []);

  const getTypeBadge = (type: Update['type']) => {
    switch (type) {
      case 'feature':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Nova Funcionalidade</Badge>;
      case 'improvement':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Melhoria</Badge>;
      case 'fix':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Correção</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Atualizações do Sistema
        </h2>
        <p className="text-muted-foreground">
          Novidades, melhorias e correções do painel do moderador
        </p>
      </div>

      <div className="grid gap-4">
        {updates.map((update) => (
          <Card key={update.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {update.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {update.title}
                      {getTypeBadge(update.type)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(update.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{update.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Fique atento!</p>
              <p className="text-sm text-muted-foreground">
                Sempre que houver novas atualizações, o ícone de sino ficará animado no menu lateral.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook para verificar se há atualizações não vistas
export const useHasUnseenUpdates = () => {
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const seenIds = saved ? JSON.parse(saved) : [];
    const unseenCount = updates.filter(u => !seenIds.includes(u.id)).length;
    setHasUnseen(unseenCount > 0);
  }, []);

  return hasUnseen;
};
