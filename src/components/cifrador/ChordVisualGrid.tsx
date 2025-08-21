import React, { useState } from 'react';
import { ChordChip } from './ChordChip';
import { ChordInsertPopover } from './ChordInsertPopover';
import type { Placements } from '@/pages/CifradorNeoPage';

interface ChordVisualGridProps {
  lyrics: string;
  placements: Placements;
  setPlacements: React.Dispatch<React.SetStateAction<Placements>>;
  mode: 'auto-grid' | 'free-snap';
  keySignature: string;
}

const CHAR_WIDTH = 10; // px, ajuste conforme fonte
const LINE_HEIGHT = 28; // px, ajuste conforme design


export const ChordVisualGrid: React.FC<ChordVisualGridProps> = ({
  lyrics,
  placements,
  setPlacements,
  mode,
  keySignature,
}) => {
  const [popover, setPopover] = useState<null | { lineIdx: number; charIdx: number; x: number; y: number }>(null);
  const [editChip, setEditChip] = useState<null | { lineIdx: number; chordIdx: number }>(null);
  const [editValue, setEditValue] = useState('');
  // Drag state: { lineIdx, chordIdx, symbol }
  const [dragging, setDragging] = useState<null | { lineIdx: number; chordIdx: number; symbol: string }>(null);
  // Track drag-over position
  const [dragOver, setDragOver] = useState<null | { lineIdx: number; charIdx: number }>(null);

  const lines = lyrics.split('\n');

  // Inserir acorde
  const handleInsertChord = (symbol: string) => {
    if (!popover) return;
    setPlacements(prev => {
      const newLines = [...(prev.lines || [])];
      while (newLines.length <= popover.lineIdx) {
        newLines.push({ text: lines[newLines.length] || '', chords: [] });
      }
      const line = { ...newLines[popover.lineIdx] };
      line.chords = [...(line.chords || []), { charIndex: popover.charIdx, symbol }];
      newLines[popover.lineIdx] = line;
      return { ...prev, lines: newLines };
    });
  };

  // Excluir acorde
  const handleDeleteChord = (lineIdx: number, chordIdx: number) => {
    setPlacements(prev => {
      const newLines = [...(prev.lines || [])];
      if (!newLines[lineIdx]) return prev;
      const line = { ...newLines[lineIdx] };
      line.chords = line.chords.filter((_, i) => i !== chordIdx);
      newLines[lineIdx] = line;
      return { ...prev, lines: newLines };
    });
  };

  // Editar acorde
  const handleEditChord = (lineIdx: number, chordIdx: number, symbol: string) => {
    setPlacements(prev => {
      const newLines = [...(prev.lines || [])];
      if (!newLines[lineIdx]) return prev;
      const line = { ...newLines[lineIdx] };
      line.chords = line.chords.map((c, i) => i === chordIdx ? { ...c, symbol } : c);
      newLines[lineIdx] = line;
      return { ...prev, lines: newLines };
    });
  };

  return (
    <div>
      <label className="block mb-2 font-semibold">Visualização</label>
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
              <React.Fragment key={i}>
                <div
                  style={{
                    position: 'absolute',
                    left: chord.charIndex * CHAR_WIDTH,
                    top: 0,
                    zIndex: 2,
                    opacity: dragging && dragging.lineIdx === lineIdx && dragging.chordIdx === i ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                  draggable
                  onDragStart={e => {
                    setDragging({ lineIdx, chordIdx: i, symbol: chord.symbol });
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={e => {
                    setDragging(null);
                    setDragOver(null);
                  }}
                  onClick={() => {
                    setEditChip({ lineIdx, chordIdx: i });
                    setEditValue(chord.symbol);
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    handleDeleteChord(lineIdx, i);
                  }}
                >
                  <ChordChip symbol={chord.symbol} />
                </div>
                {/* Mini menu de edição inline */}
                {editChip && editChip.lineIdx === lineIdx && editChip.chordIdx === i && (
                  <div style={{ position: 'absolute', left: chord.charIndex * CHAR_WIDTH, top: 36, zIndex: 10 }} className="bg-background border border-muted rounded shadow p-2 flex gap-2">
                    <input
                      className="input input-xs font-mono"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleEditChord(lineIdx, i, editValue);
                          setEditChip(null);
                        } else if (e.key === 'Escape') {
                          setEditChip(null);
                        }
                      }}
                      autoFocus
                    />
                    <button className="btn btn-xs" onClick={() => { handleEditChord(lineIdx, i, editValue); setEditChip(null); }}>OK</button>
                    <button className="btn btn-xs" onClick={() => setEditChip(null)}>Cancelar</button>
                    <button className="btn btn-xs btn-destructive" onClick={() => { handleDeleteChord(lineIdx, i); setEditChip(null); }}>Excluir</button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
        {/* Drag-over target for snapping chips */}
        {dragging && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 100,
            }}
          >
            {/* Overlay for drag-and-drop snap logic */}
            {lines.map((line, lineIdx) => (
              <div
                key={lineIdx}
                style={{ position: 'absolute', top: lineIdx * LINE_HEIGHT, left: 0, height: LINE_HEIGHT, width: '100%' }}
              >
                {Array.from(line || '\u00A0').map((char, charIdx) => (
                  <span
                    key={charIdx}
                    style={{
                      display: 'inline-block',
                      width: CHAR_WIDTH,
                      height: LINE_HEIGHT,
                      background:
                        dragOver && dragOver.lineIdx === lineIdx && dragOver.charIdx === charIdx
                          ? 'rgba(0,0,0,0.08)'
                          : 'transparent',
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOver({ lineIdx, charIdx });
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      if (!dragging) return;
                      setPlacements(prev => {
                        const newLines = [...(prev.lines || [])];
                        // Remove from old position
                        const oldLine = { ...newLines[dragging.lineIdx] };
                        const [moved] = oldLine.chords.splice(dragging.chordIdx, 1);
                        newLines[dragging.lineIdx] = oldLine;
                        // Insert at new position
                        while (newLines.length <= lineIdx) {
                          newLines.push({ text: lines[newLines.length] || '', chords: [] });
                        }
                        const newLine = { ...newLines[lineIdx] };
                        newLine.chords = [...(newLine.chords || []), { charIndex: charIdx, symbol: moved.symbol }];
                        newLines[lineIdx] = newLine;
                        return { ...prev, lines: newLines };
                      });
                      setDragging(null);
                      setDragOver(null);
                    }}
                  >
                    {/* empty span for DnD target */}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
        {/* Drag-over target for snapping chips */}
        {dragging && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            {/* Optionally, add a visual indicator for drop position */}
          </div>
        )}
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
