import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAcordes } from '@/hooks/useAcordes';
import { Camera, UserPlus, FileText, Star, Music, ArrowRight } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Camera,
  UserPlus,
  FileText,
  Star,
  Music,
};

const actionRoutes: Record<string, string> = {
  'add_profile_photo': '/profile',
  'register_work': '/author-registration',
  'refer_friend_purchase': '/dashboard/acordes',
  'create_draft': '/drafts',
};

export const NextAcordeObjective: React.FC = () => {
  const navigate = useNavigate();
  const { progress, isLoading } = useAcordes();

  if (isLoading) return null;

  // Encontrar a próxima ação disponível (que o usuário ainda pode completar)
  const nextAction = progress?.available_actions?.find(a => a.can_complete);

  if (!nextAction) return null;

  const IconComponent = iconMap[nextAction.icon || 'Star'] || Star;
  const route = actionRoutes[nextAction.action_key] || '/dashboard/acordes';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Próximo Objetivo</h2>
        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
          <Music className="h-3 w-3 mr-1" />
          +{nextAction.acordes_reward} acordes
        </Badge>
      </div>
      
      <Card className="border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 shrink-0">
            <IconComponent className="h-4 w-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm truncate">{nextAction.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{nextAction.description}</p>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => navigate(route)}
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white gap-1 h-8 px-3"
          >
            <span className="text-xs">Fazer agora</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
