import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { getAdminDashboardStats } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';

// Cores para os gráficos
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export const AdminAnalytics: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 30000,
  });

  // Dados para gráfico de crescimento (últimos 7 dias)
  const { data: growthData } = useQuery({
    queryKey: ['admin-growth-data'],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const results = await Promise.all(
        last7Days.map(async (date) => {
          const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .lte('created_at', `${date}T23:59:59`);
          
          const { data: songs } = await supabase
            .from('songs')
            .select('id')
            .lte('created_at', `${date}T23:59:59`)
            .is('deleted_at', null);

          return {
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            usuarios: users?.length || 0,
            musicas: songs?.length || 0
          };
        })
      );

      return results;
    },
    refetchInterval: 300000, // 5 minutos
  });

  // Dados para distribuição por gêneros
  const { data: genreData } = useQuery({
    queryKey: ['admin-genre-data'],
    queryFn: async () => {
      const { data: registrations } = await supabase
        .from('author_registrations')
        .select('genre');

      const genreCounts = (registrations || []).reduce((acc, reg) => {
        const genre = reg.genre || 'Não informado';
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(genreCounts).map(([genre, count]) => ({
        name: genre,
        value: count
      }));
    },
    refetchInterval: 300000,
  });

  // Dados de atividade por dia da semana
  const { data: activityData } = useQuery({
    queryKey: ['admin-activity-data'],
    queryFn: async () => {
      const { data: activities } = await supabase
        .from('user_activity_logs')
        .select('timestamp')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayCounts = Array(7).fill(0);

      (activities || []).forEach(activity => {
        const dayOfWeek = new Date(activity.timestamp).getDay();
        dayCounts[dayOfWeek]++;
      });

      return dayNames.map((day, index) => ({
        dia: day,
        atividades: dayCounts[index]
      }));
    },
    refetchInterval: 60000, // 1 minuto
  });

  return (
    <div className="space-y-6">
      {/* Gráfico de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle>Crescimento da Plataforma</CardTitle>
          <CardDescription>Usuários e músicas registrados nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="usuarios" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Area type="monotone" dataKey="musicas" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Gêneros */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Gêneros</CardTitle>
            <CardDescription>Gêneros musicais mais populares</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genreData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atividade por Dia da Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
            <CardDescription>Atividades dos usuários por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="atividades" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.totalDrafts || 0}</p>
              <p className="text-sm text-muted-foreground">Rascunhos Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.totalPartnerships || 0}</p>
              <p className="text-sm text-muted-foreground">Parcerias Criadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.totalRegisteredWorks || 0}</p>
              <p className="text-sm text-muted-foreground">Obras Registradas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.totalFolders || 0}</p>
              <p className="text-sm text-muted-foreground">Pastas Organizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};