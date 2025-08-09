
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MobileSheet } from '@/components/ui/mobile-sheet';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';

interface MobileControlsProps {
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInsertBase }) => {
  return (
    <div className="flex gap-3">
      <MobileSheet
        trigger={
          <Button variant="outline" size="sm" className="text-sm px-4 py-2 h-10 rounded-full">
            <Plus size={14} className="mr-2" /> Bases Musicais
          </Button>
        }
        title="Bases Musicais"
      >
        <MusicBases onInsertBase={onInsertBase} />
      </MobileSheet>

      <MobileSheet
        trigger={
          <Button variant="outline" size="sm" className="text-sm px-4 py-2 h-10 rounded-full">
            <Plus size={14} className="mr-2" /> IA Tools
          </Button>
        }
        title="Ferramentas de IA"
      >
        <div className="space-y-6">
          <ThemeGenerator />
          <RhymeAssistant />
        </div>
      </MobileSheet>
    </div>
  );
};
