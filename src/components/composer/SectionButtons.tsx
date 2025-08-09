
import React from 'react';
import { Button } from '@/components/ui/button';
import { useMobileDetection } from '@/hooks/use-mobile';

interface SectionButtonsProps {
  onSectionClick: (section: string) => void;
}

export const SectionButtons: React.FC<SectionButtonsProps> = ({ onSectionClick }) => {
  const { isMobile } = useMobileDetection();
  const sections = [
    { label: 'Introdução', value: '# Introdução\n\n', short: 'Intro' },
    { label: 'Verso', value: '# Verso\n\n', short: 'Verso' },
    { label: 'Pré-refrão', value: '# Pré-refrão\n\n', short: 'Pré' },
    { label: 'Refrão', value: '# Refrão\n\n', short: 'Refrão' },
    { label: 'Ponte', value: '# Ponte\n\n', short: 'Ponte' },
    { label: 'Finalização', value: '# Finalização\n\n', short: 'Final' }
  ];

  return (
    <div className="mb-4">
      {/* Mobile Grid Layout - exactly 3x2 as shown in reference image */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {sections.map((section) => (
          <Button
            key={section.label}
            variant="outline"
            className="h-12 text-sm font-medium border-2 hover:bg-muted transition-colors"
            onClick={() => onSectionClick(section.value)}
          >
            {section.short}
          </Button>
        ))}
      </div>

      {/* Desktop Flex Layout */}
      <div className="hidden sm:flex flex-wrap gap-2 justify-center">
        {sections.map((section) => (
          <Button
            key={section.label}
            variant="secondary"
            className="song-section text-xs md:text-sm"
            size="default"
            onClick={() => onSectionClick(section.value)}
          >
            {section.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
