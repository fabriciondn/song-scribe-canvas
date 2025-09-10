import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type MusicPartType = 'solo' | 'verse' | 'pre_chorus' | 'chorus' | 'bridge' | 'ending';

interface MusicPartSelectorProps {
  value: MusicPartType;
  onChange: (value: MusicPartType) => void;
}

const partLabels: Record<MusicPartType, string> = {
  solo: 'Solo',
  verse: 'Verso',
  pre_chorus: 'Pré-refrão',
  chorus: 'Refrão',
  bridge: 'Ponte',
  ending: 'Finalização'
};

export const MusicPartSelector: React.FC<MusicPartSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="part-selector">Parte da música</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a parte da música" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(partLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};