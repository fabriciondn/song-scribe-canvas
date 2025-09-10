import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, MessageCircle } from 'lucide-react';

interface PendingPart {
  id: string;
  part_type: string;
  content: string;
  user_id: string;
  user_name?: string;
  created_at: string;
}

interface PendingPartCardProps {
  part: PendingPart;
  onApprove: (partId: string) => void;
  onComment: (partId: string) => void;
  currentUserId: string;
}

const partLabels: Record<string, string> = {
  solo: 'Solo',
  verse: 'Verso',
  pre_chorus: 'Pré-refrão',
  chorus: 'Refrão',
  bridge: 'Ponte',
  ending: 'Finalização'
};

export const PendingPartCard: React.FC<PendingPartCardProps> = ({
  part,
  onApprove,
  onComment,
  currentUserId
}) => {
  const isOwnPart = part.user_id === currentUserId;

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {partLabels[part.part_type] || part.part_type}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pendente</Badge>
            {!isOwnPart && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onComment(part.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Opinar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(part.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          Por: {part.user_name || 'Usuário'} • {new Date(part.created_at).toLocaleDateString()}
        </p>
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm whitespace-pre-wrap">{part.content}</p>
        </div>
      </CardContent>
    </Card>
  );
};