import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';

interface WorkCardProps {
  work: {
    id: string;
    title: string;
    author: string;
    genre: string;
    created_at: string;
    status: string;
  };
  onViewDetails: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ work, onViewDetails }) => {
  const { getStatusText, getStatusVariant } = useRegistrationStatus();

  return (
    <Card className="hover:shadow-md transition-all duration-200 bg-card border border-border/50">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base font-semibold">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate">{work.title}</span>
          </CardTitle>
          <Badge variant={getStatusVariant(work.status)} className="text-xs">
            {getStatusText(work.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Registrado em: {new Date(work.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Gênero:</span> {work.genre}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewDetails}
            className="text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            Ver mais <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};