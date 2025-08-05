import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3 } from 'lucide-react';

interface ChordPosition {
  id: string;
  chord: string;
  x: number;
  y: number;
  lineIndex: number;
  charIndex: number;
}

interface ChordPositionerProps {
  text: string;
  onTextWithChordsChange: (textWithChords: string) => void;
}

export const ChordPositioner: React.FC<ChordPositionerProps> = ({
  text,
  onTextWithChordsChange
}) => {
  const [chords, setChords] = useState<ChordPosition[]>([]);
  const [currentChord, setCurrentChord] = useState('');
  const [draggedChord, setDraggedChord] = useState<string | null>(null);
  const [editingChord, setEditingChord] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = text.split('\n');

  const handleTextClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentChord.trim()) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcular em qual linha e posição o clique aconteceu
    const lineHeight = 24; // altura estimada da linha
    const lineIndex = Math.floor(y / lineHeight);
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const charWidth = 8; // largura estimada de um caractere
      const charIndex = Math.min(Math.floor(x / charWidth), line.length);

      const newChord: ChordPosition = {
        id: Date.now().toString(),
        chord: currentChord,
        x,
        y,
        lineIndex,
        charIndex
      };

      setChords(prev => [...prev, newChord]);
      setCurrentChord('');
      
      // Atualizar o texto com os acordes
      updateTextWithChords([...chords, newChord]);
    }
  }, [currentChord, chords, lines]);

  const updateTextWithChords = (chordsArray: ChordPosition[]) => {
    const linesWithChords = [...lines];
    
    // Agrupar acordes por linha
    const chordsByLine: { [key: number]: ChordPosition[] } = {};
    chordsArray.forEach(chord => {
      if (!chordsByLine[chord.lineIndex]) {
        chordsByLine[chord.lineIndex] = [];
      }
      chordsByLine[chord.lineIndex].push(chord);
    });

    // Ordenar acordes por posição na linha e inserir
    Object.keys(chordsByLine).forEach(lineIndexStr => {
      const lineIndex = parseInt(lineIndexStr);
      const lineChords = chordsByLine[lineIndex].sort((a, b) => a.charIndex - b.charIndex);
      
      let offset = 0;
      lineChords.forEach(chord => {
        const position = chord.charIndex + offset;
        const chordText = `[${chord.chord}]`;
        linesWithChords[lineIndex] = 
          linesWithChords[lineIndex].slice(0, position) + 
          chordText + 
          linesWithChords[lineIndex].slice(position);
        offset += chordText.length;
      });
    });

    onTextWithChordsChange(linesWithChords.join('\n'));
  };

  const handleChordDrag = (chord: ChordPosition, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedChord(chord.id);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const lineHeight = 24;
      const lineIndex = Math.max(0, Math.min(Math.floor(y / lineHeight), lines.length - 1));
      const charWidth = 8;
      const charIndex = Math.min(Math.floor(x / charWidth), lines[lineIndex]?.length || 0);
      
      setChords(prev => prev.map(c => 
        c.id === chord.id 
          ? { ...c, x, y, lineIndex, charIndex }
          : c
      ));
    };
    
    const handleMouseUp = () => {
      setDraggedChord(null);
      updateTextWithChords(chords);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const deleteChord = (chordId: string) => {
    const newChords = chords.filter(c => c.id !== chordId);
    setChords(newChords);
    updateTextWithChords(newChords);
  };

  const startEditChord = (chord: ChordPosition) => {
    setEditingChord(chord.id);
    setEditingValue(chord.chord);
  };

  const saveEditChord = () => {
    if (!editingChord || !editingValue.trim()) return;
    
    const newChords = chords.map(c => 
      c.id === editingChord 
        ? { ...c, chord: editingValue }
        : c
    );
    setChords(newChords);
    updateTextWithChords(newChords);
    setEditingChord(null);
    setEditingValue('');
  };

  const clearAllChords = () => {
    setChords([]);
    onTextWithChordsChange(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Posicionamento de Acordes</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Digite o acorde (ex: C, Am, F7)"
            value={currentChord}
            onChange={(e) => setCurrentChord(e.target.value)}
            className="w-48"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <Button 
            variant="outline" 
            onClick={clearAllChords}
            disabled={chords.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Digite um acorde e clique no texto onde deseja posicioná-lo. Arraste os acordes para reposicioná-los.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            ref={containerRef}
            className="relative p-4 bg-muted/20 rounded-md min-h-[200px] cursor-crosshair select-none"
            onClick={handleTextClick}
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '14px',
              lineHeight: '24px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {lines.map((line, index) => (
              <div key={index} className="relative">
                {line || '\u00A0'}
              </div>
            ))}
            
            {/* Renderizar acordes posicionados */}
            {chords.map((chord) => (
              <div
                key={chord.id}
                className={`absolute bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold cursor-move shadow-md border-2 ${
                  draggedChord === chord.id ? 'border-accent z-20' : 'border-transparent'
                }`}
                style={{
                  left: chord.x,
                  top: chord.y - 25,
                  transform: 'translateX(-50%)'
                }}
                onMouseDown={(e) => handleChordDrag(chord, e)}
              >
                {editingChord === chord.id ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEditChord();
                      }
                      if (e.key === 'Escape') {
                        setEditingChord(null);
                        setEditingValue('');
                      }
                    }}
                    onBlur={saveEditChord}
                    className="h-6 w-12 text-xs p-1"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{chord.chord}</span>
                    <div className="flex gap-1 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditChord(chord);
                        }}
                        className="hover:bg-primary-foreground/20 p-0.5 rounded"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChord(chord.id);
                        }}
                        className="hover:bg-destructive/20 p-0.5 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};