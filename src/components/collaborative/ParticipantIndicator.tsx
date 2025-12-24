import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CollaborativeParticipant } from '@/services/collaborativeSessionService';
import { Crown, Wifi, WifiOff } from 'lucide-react';

interface ParticipantIndicatorProps {
  participants: CollaborativeParticipant[];
  hostUserId: string;
  currentUserId?: string;
}

export const ParticipantIndicator: React.FC<ParticipantIndicatorProps> = ({
  participants,
  hostUserId,
  currentUserId
}) => {
  const onlineParticipants = participants.filter(p => p.is_online);
  const offlineParticipants = participants.filter(p => !p.is_online);

  const getInitials = (participant: CollaborativeParticipant): string => {
    const name = participant.profile?.artistic_name || participant.profile?.name || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const getName = (participant: CollaborativeParticipant): string => {
    return participant.profile?.artistic_name || participant.profile?.name || 'Usuário';
  };

  const isHost = (participant: CollaborativeParticipant): boolean => {
    return participant.user_id === hostUserId;
  };

  const isCurrentUser = (participant: CollaborativeParticipant): boolean => {
    return participant.user_id === currentUserId;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <Wifi className="h-3 w-3 text-green-500" />
        {onlineParticipants.length} online
      </Badge>

      <div className="flex -space-x-2">
        <TooltipProvider>
          {onlineParticipants.map((participant) => (
            <Tooltip key={participant.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-green-500">
                    <AvatarImage src={participant.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(participant)}
                    </AvatarFallback>
                  </Avatar>
                  {isHost(participant) && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {getName(participant)}
                  {isCurrentUser(participant) && ' (você)'}
                  {isHost(participant) && ' • Anfitrião'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}

          {offlineParticipants.map((participant) => (
            <Tooltip key={participant.id}>
              <TooltipTrigger asChild>
                <div className="relative opacity-50">
                  <Avatar className="h-8 w-8 border-2 border-background grayscale">
                    <AvatarImage src={participant.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(participant)}
                    </AvatarFallback>
                  </Avatar>
                  {isHost(participant) && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  {getName(participant)} • Offline
                  {isHost(participant) && ' • Anfitrião'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};
