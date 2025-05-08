import React from 'react';
import { Button } from '@/components/ui/button';

interface ChordPaletteProps {
  onChordClick: (chord: string) => void;
}

export const ChordPalette: React.FC<ChordPaletteProps> = ({ onChordClick }) => {
  // Common chords organized by type
  const chords = [
    // Major chords
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'E', value: 'E' },
    { label: 'F', value: 'F' },
    { label: 'G', value: 'G' },
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    
    // Minor chords
    { label: 'Cm', value: 'Cm' },
    { label: 'Dm', value: 'Dm' },
    { label: 'Em', value: 'Em' },
    { label: 'Fm', value: 'Fm' },
    { label: 'Gm', value: 'Gm' },
    { label: 'Am', value: 'Am' },
    { label: 'Bm', value: 'Bm' },
    
    // 7th chords
    { label: 'C7', value: 'C7' },
    { label: 'D7', value: 'D7' },
    { label: 'E7', value: 'E7' },
    { label: 'G7', value: 'G7' },
    { label: 'A7', value: 'A7' },
    
    // Other common chords
    { label: 'F#', value: 'F#' },
    { label: 'G#', value: 'G#' },
    { label: 'Bb', value: 'Bb' },
    { label: 'C#m', value: 'C#m' },
    { label: 'F#m', value: 'F#m' },
    { label: 'A9', value: 'A9' },
  ];

  return (
    <div className="p-2">
      <h3 className="text-sm font-semibold mb-2">Acordes</h3>
      <div className="grid grid-cols-4 gap-2">
        {chords.map((chord) => (
          <Button
            key={chord.value}
            variant="outline"
            className="text-sm px-2 py-1 h-auto chord-button"
            onClick={() => onChordClick(chord.value)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', `[${chord.value}]`);
            }}
          >
            {chord.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
