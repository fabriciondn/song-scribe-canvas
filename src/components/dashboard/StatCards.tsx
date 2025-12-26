import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Music, Users, Eye, Edit, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { DashboardStats } from '@/services/dashboardService';
import { ProUpgradeModal } from '@/components/ui/pro-upgrade-modal';

interface StatCardsProps {
  stats: DashboardStats;
  isPro: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, isPro }) => {
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);

  const handlePartnershipsClick = () => {
    if (isPro) {
      navigate('/partnerships');
    } else {
      setShowProModal(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Obras Registradas */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer group"
          onClick={() => navigate('/dashboard/registered-works')}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              {stats.registeredWorks.total > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-500 border-0 text-[10px]">
                  {stats.registeredWorks.total} {stats.registeredWorks.total === 1 ? 'obra' : 'obras'}
                </Badge>
              )}
            </div>
            
            <div className="space-y-0.5 mb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{stats.registeredWorks.total}</h3>
              <p className="text-muted-foreground text-xs">Obras Registradas</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-foreground text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/dashboard/registered-works');
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver Certificados
            </Button>
          </CardContent>
        </Card>

        {/* Composições */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer group"
          onClick={() => {
            if (isPro) {
              navigate('/drafts');
            } else {
              setShowProModal(true);
            }
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
          
          {/* Badge PRO no canto superior direito */}
          {!isPro && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] z-10 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PRO
            </Badge>
          )}
          
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Music className="h-5 w-5 text-blue-500" />
              </div>
              {isPro && stats.compositions.drafts > 0 && (
                <Badge className="bg-blue-500/20 text-blue-500 border-0 text-[10px]">
                  {stats.compositions.drafts} rascunhos
                </Badge>
              )}
            </div>
            
            <div className="space-y-0.5 mb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{stats.compositions.total}</h3>
              <p className="text-muted-foreground text-xs">Composições</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 text-foreground text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPro) {
                    navigate('/drafts');
                  } else {
                    setShowProModal(true);
                  }
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPro) {
                    navigate('/drafts');
                  } else {
                    setShowProModal(true);
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nova
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parcerias Ativas - sempre visível, com badge PRO se não for Pro */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer group sm:col-span-2 lg:col-span-1"
          onClick={handlePartnershipsClick}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
          
          {/* Badge PRO no canto superior direito */}
          {!isPro && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] z-10 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PRO
            </Badge>
          )}
          
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              {/* Avatars sobrepostos */}
              <div className="flex -space-x-1.5">
                {[...Array(Math.min(3, stats.partnerships.active || 1))].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {stats.partnerships.active > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{stats.partnerships.active - 3}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-0.5 mb-3">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{stats.partnerships.active}</h3>
              <p className="text-muted-foreground text-xs">Parcerias Ativas</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 text-foreground text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                handlePartnershipsClick();
              }}
            >
              Gerenciar Parcerias
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <ProUpgradeModal 
        open={showProModal} 
        onOpenChange={setShowProModal} 
      />
    </>
  );
};