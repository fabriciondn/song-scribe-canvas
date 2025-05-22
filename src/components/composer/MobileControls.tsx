
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';

interface MobileControlsProps {
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInsertBase }) => {
  return (
    <div className="flex gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <Plus size={14} className="mr-1" /> Bases
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] sm:max-w-none pt-10">
          <div className="p-2 max-h-[70vh] overflow-auto">
            <h3 className="text-lg font-medium mb-3">Bases Musicais</h3>
            <MusicBases onInsertBase={onInsertBase} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <Plus size={14} className="mr-1" /> Ferramentas
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] sm:max-w-none pt-10">
          <div className="p-2 max-h-[70vh] overflow-auto space-y-6">
            <ThemeGenerator />
            <RhymeAssistant />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
