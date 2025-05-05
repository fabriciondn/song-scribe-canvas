
import React from 'react';
import { Button } from '@/components/ui/button';

interface SectionButtonsProps {
  onSectionClick: (section: string) => void;
}

export const SectionButtons: React.FC<SectionButtonsProps> = ({ onSectionClick }) => {
  const sections = [
    { label: 'Introdução', value: '# Introdução\n\n' },
    { label: 'Verso', value: '# Verso\n\n' },
    { label: 'Pré-refrão', value: '# Pré-refrão\n\n' },
    { label: 'Refrão', value: '# Refrão\n\n' },
    { label: 'Ponte', value: '# Ponte\n\n' },
    { label: 'Finalização', value: '# Finalização\n\n' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {sections.map((section) => (
        <Button
          key={section.label}
          variant="secondary"
          className="song-section"
          onClick={() => onSectionClick(section.value)}
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
};
