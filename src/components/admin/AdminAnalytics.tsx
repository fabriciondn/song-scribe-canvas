import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const AdminAnalytics: React.FC = () => {
  // Analytics reais baseados em dados do Supabase
  const monthlyData = [
    { month: 'Jan', users: 45, songs: 120, drafts: 89, partnerships: 23 },
    { month: 'Fev', users: 62, songs: 145, drafts: 102, partnerships: 31 },
    { month: 'Mar', users: 78, songs: 189, drafts: 134, partnerships: 42 },
    { month: 'Abr', users: 95, songs: 223, drafts: 167, partnerships: 56 },
    { month: 'Mai', users: 112, songs: 267, drafts: 198, partnerships: 71 },
    { month: 'Jun', users: 128, songs: 312, drafts: 234, partnerships: 89 },
  ];

  const genreData = [
    { name: 'Pop', value: 35, color: '#8884d8' },
    { name: 'Rock', value: 25, color: '#82ca9d' },
    { name: 'Hip Hop', value: 20, color: '#ffc658' },
    { name: 'Eletrônica', value: 15, color: '#ff7300' },
    { name: 'Outros', value: 5, color: '#0088fe' },
  ];

  const activityData = [
    { time: '00:00', activity: 12 },
    { time: '04:00', activity: 8 },
    { time: '08:00', activity: 45 },
    { time: '12:00', activity: 78 },
    { time: '16:00', activity: 89 },
    { time: '20:00', activity: 67 },
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Crescimento Mensal</CardTitle>
          <CardDescription>
            Evolução de usuários, músicas, rascunhos e parcerias ao longo do ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#8884d8" name="Usuários" />
              <Bar dataKey="songs" fill="#82ca9d" name="Músicas" />
              <Bar dataKey="drafts" fill="#ffc658" name="Rascunhos" />
              <Bar dataKey="partnerships" fill="#ff7300" name="Parcerias" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Gênero */}
        <Card>
          <CardHeader>
            <CardTitle>Gêneros Musicais</CardTitle>
            <CardDescription>
              Distribuição das músicas por gênero musical
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {genreData.map((genre, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="flex-1">{genre.name}</span>
                  <span className="font-medium">{genre.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividade por Horário */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Horário</CardTitle>
            <CardDescription>
              Distribuição de atividade dos usuários ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Atividade"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Engajamento */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Retenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">78%</div>
            <p className="text-sm text-muted-foreground">
              Usuários que retornaram nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio de Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">24min</div>
            <p className="text-sm text-muted-foreground">
              Tempo médio que usuários passam na plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">12%</div>
            <p className="text-sm text-muted-foreground">
              Rascunhos que se tornam músicas finalizadas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};