import React, { useState } from 'react';
import type { Placements } from '@/types/cifrador';
import { ChordChip } from './ChordChip';
import { ChordInsertPopover } from './ChordInsertPopover';

type ChordPreviewProps = {
  lyrics: string;
  placements: Placements;
  setPlacements: React.Dispatch<React.SetStateAction<Placements>>;
};

const CHAR_WIDTH = 10; // px, ajuste conforme a fonte
const LINE_HEIGHT = 28; // px, ajuste conforme o design

export const ChordPreview: React.FC<ChordPreviewProps> = ({ lyrics, placements, setPlacements }) => {
  const [popover, setPopover] = useState<null | { lineIdx: number; charIdx: number; x: number; y: number }>(null);
  const lines = lyrics.split('\n');

  // Handler para inserir acorde
  const handleInsertChord = (symbol: string) => {
    if (!popover) return;
    setPlacements(prev => {
      const newLines = [...(prev.lines || [])];
      // Garante que a linha existe
      while (newLines.length <= popover.lineIdx) {
        newLines.push({ text: lines[newLines.length] || '', chords: [] });
      }
      const line = { ...newLines[popover.lineIdx] };
      line.chords = [...(line.chords || []), { charIndex: popover.charIdx, symbol }];
      newLines[popover.lineIdx] = line;
      return { ...prev, lines: newLines };
    });
  };

  return (
    <div>
      <label className="block mb-2 font-semibold">Resultado final</label>
      <div className="bg-muted rounded p-2 min-h-[180px] font-mono whitespace-pre relative" style={{fontFamily: 'ui-monospace, monospace'}}>
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} style={{ position: 'relative', height: LINE_HEIGHT }}>
            {/* Renderiza cada caractere como span clicável */}
            {Array.from(line || '\u00A0').map((char, charIdx) => (
              <span
                key={charIdx}
                style={{ display: 'inline-block', width: CHAR_WIDTH, cursor: 'pointer', position: 'relative' }}
                onClick={e => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setPopover({
                    lineIdx,
                    charIdx,
                    x: rect.left - e.currentTarget.parentElement!.getBoundingClientRect().left + CHAR_WIDTH / 2,
                    y: lineIdx * LINE_HEIGHT,
                  });
                }}
              >
                {char}
              </span>
            ))}
            {/* Renderiza chips dessa linha */}
            {placements.lines[lineIdx]?.chords.map((chord, i) => (
              <ChordChip
                key={i}
                symbol={chord.symbol}
                style={{
                  left: chord.charIndex * CHAR_WIDTH,
                  top: 0,
                  zIndex: 2,
                }}
              />
            ))}
          </div>
        ))}
        {popover && (
          <ChordInsertPopover
            position={{ x: popover.x, y: popover.y }}
            onInsert={handleInsertChord}
            onClose={() => setPopover(null)}
          />
        )}
      </div>
    </div>
  );
};
