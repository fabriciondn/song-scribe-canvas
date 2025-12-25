import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Music, Users, Eye, Edit, Plus, ChevronRight } from 'lucide-react';
import { DashboardStats } from '@/services/dashboardService';

interface StatCardsProps {
  stats: DashboardStats;
  isPro: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, isPro }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Obras Registradas */}
      <Card 
        className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer group"
        onClick={() => navigate('/dashboard/registered-works')}
      >
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
            </div>
            {stats.registeredWorks.total > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-500 border-0 text-[10px] sm:text-xs">
                {stats.registeredWorks.total} {stats.registeredWorks.total === 1 ? 'obra' : 'obras'}
              </Badge>
            )}
          </div>
          
          <div className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{stats.registeredWorks.total}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Obras Registradas</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-foreground text-xs sm:text-sm h-8 sm:h-9"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/registered-works');
            }}
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Ver Certificados
          </Button>
        </CardContent>
      </Card>

      {/* Composições */}
      <Card 
        className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer group"
        onClick={() => navigate('/drafts')}
      >
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Music className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            {stats.compositions.drafts > 0 && (
              <Badge className="bg-blue-500/20 text-blue-500 border-0 text-[10px] sm:text-xs">
                {stats.compositions.drafts} rascunhos
              </Badge>
            )}
          </div>
          
          <div className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{stats.compositions.total}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Composições</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 text-foreground text-xs sm:text-sm h-8 sm:h-9"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/drafts');
              }}
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Editar
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm h-8 sm:h-9"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/composer');
              }}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Nova
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parcerias Ativas */}
      {isPro && (
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer group sm:col-span-2 lg:col-span-1"
          onClick={() => navigate('/partnerships')}
        >
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              {/* Avatars sobrepostos */}
              <div className="flex -space-x-1.5 sm:-space-x-2">
                {[...Array(Math.min(3, stats.partnerships.active || 1))].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-card flex items-center justify-center text-[10px] sm:text-xs font-bold text-white"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {stats.partnerships.active > 3 && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                    +{stats.partnerships.active - 3}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{stats.partnerships.active}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Parcerias Ativas</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 text-foreground text-xs sm:text-sm h-8 sm:h-9"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/partnerships');
              }}
            >
              Gerenciar Parcerias
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
