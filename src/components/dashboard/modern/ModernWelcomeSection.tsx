
import React from 'react';
import { Card, CardBody, Avatar, Button, Chip } from '@nextui-org/react';
import { Settings, Sparkles } from 'lucide-react';
import { CardSelector } from '../CardSelector';
import { useProfile } from '@/hooks/useProfile';

interface ModernWelcomeSectionProps {
  expandedSections: string[];
  onToggleSection: (section: string) => void;
}

export const ModernWelcomeSection: React.FC<ModernWelcomeSectionProps> = ({
  expandedSections,
  onToggleSection
}) => {
  const { profile } = useProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const displayName = profile?.name || profile?.artistic_name || 'Usuário';

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
      <CardBody className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={displayName}
              size="lg"
              className="ring-4 ring-primary/20"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {getGreeting()}, {displayName}!
                </h1>
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <p className="text-foreground/70">
                Bem-vindo ao seu estúdio criativo
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip size="sm" color="primary" variant="flat">
                  Compositor
                </Chip>
                <Chip size="sm" color="secondary" variant="flat">
                  Ativo hoje
                </Chip>
              </div>
            </div>
          </div>
          
          <CardSelector expandedSections={expandedSections} onToggleSection={onToggleSection}>
            <Button
              variant="flat"
              color="primary"
              startContent={<Settings className="h-4 w-4" />}
              className="backdrop-blur-sm"
            >
              Personalizar
            </Button>
          </CardSelector>
        </div>
      </CardBody>
    </Card>
  );
};
