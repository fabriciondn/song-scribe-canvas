import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Music, Camera, UserPlus, FileText, Star, Loader2, ChevronRight } from 'lucide-react';
import { useAcordes } from '@/hooks/useAcordes';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ComponentType<any>> = {
  Camera,
  UserPlus,
  FileText,
  Star,
  Music,
};

export function AcordesProgress() {
  const navigate = useNavigate();
  const { progress, isLoading } = useAcordes();

  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-card border border-purple-500/20 rounded-lg cursor-pointer hover:border-purple-500/40 transition-colors"
      >
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const nextObjective = progress.available_actions?.find(a => a.can_complete);

  if (!nextObjective) {
    return null;
  }

  const IconComponent = iconMap[nextObjective.icon || 'Star'] || Star;

  return (
    <div 
      onClick={() => navigate('/dashboard/acordes')}
      className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-purple-500/10 to-card border border-purple-500/20 rounded-lg cursor-pointer hover:border-purple-500/40 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
          <Music className="h-4 w-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{progress.available_acordes}/30 acordes</span>
            <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-xs">
              +{nextObjective.acordes_reward}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconComponent className="h-3 w-3" />
            <span className="truncate">{nextObjective.name}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
    </div>
  );
}
