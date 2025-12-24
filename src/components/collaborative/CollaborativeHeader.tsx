import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParticipantIndicator } from './ParticipantIndicator';
import { CollaborativeSession, CollaborativeParticipant } from '@/services/collaborativeSessionService';
import { Copy, LogOut, X, Check, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CollaborativeHeaderProps {
  session: CollaborativeSession;
  participants: CollaborativeParticipant[];
  isHost: boolean;
  isConnected: boolean;
  currentUserId?: string;
  onEndSession: () => void;
  onLeaveSession: () => void;
}

export const CollaborativeHeader: React.FC<CollaborativeHeaderProps> = ({
  session,
  participants,
  isHost,
  isConnected,
  currentUserId,
  onEndSession,
  onLeaveSession
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(session.session_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Token copiado!',
        description: 'Compartilhe com seu parceiro.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border border-primary/20">
      <div className="flex items-center gap-4">
        <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              Conectado
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Reconectando...
            </>
          )}
        </Badge>

        <ParticipantIndicator
          participants={participants}
          hostUserId={session.host_user_id}
          currentUserId={currentUserId}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToken}
          className="gap-1"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Copiado!' : 'Copiar Token'}
        </Button>

        {isHost ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndSession}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Encerrar Sessão
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onLeaveSession}
            className="gap-1"
          >
            <LogOut className="h-4 w-4" />
            Sair da Sessão
          </Button>
        )}
      </div>
    </div>
  );
};
