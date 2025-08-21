import React, { useState } from 'react';
import { LyricsTextarea } from '@/components/cifrador/LyricsTextarea';
import { ChordVisualGrid } from '@/components/cifrador/ChordVisualGrid';
import { ActionBar } from '@/components/cifrador/ActionBar';
import { ChordSheetMetaModal } from '@/components/cifrador/ChordSheetMetaModal';

export type Placement = { charIndex: number; symbol: string };
export type PlacementLine = { text: string; chords: Placement[] };
export type Placements = { lines: PlacementLine[] };

export default function CifradorNeoPage() {
  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<Placements>({ lines: [] });
  const [key, setKey] = useState('C');
  const [newKey, setNewKey] = useState('C');
  const [enarmonia, setEnarmonia] = useState<'auto' | '#' | 'b'>('auto');
  const [showMetaModal, setShowMetaModal] = useState(false);

  // TODO: Importar TXT, limpar, transpor, exportar, salvar, etc.

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-muted bg-background/80 sticky top-0 z-10">
        <div className="text-lg font-bold tracking-tight">Cifrador Neo</div>
        <button className="btn btn-success" onClick={() => setShowMetaModal(true)}>Salvar</button>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-row gap-8 px-6 py-8">
        {/* Coluna Esquerda: Letra */}
        <section className="w-1/2 flex flex-col gap-4">
          <LyricsTextarea value={lyrics} onChange={setLyrics} />
          <div className="flex gap-2">
            <button className="btn btn-xs">Importar TXT</button>
            <button className="btn btn-xs" onClick={() => setLyrics('')}>Limpar</button>
          </div>
        </section>
        {/* Coluna Direita: Visual */}
        <section className="w-1/2">
          <ChordVisualGrid
            lyrics={lyrics}
            placements={placements}
            setPlacements={setPlacements}
            mode="auto-grid" // ou "free-snap"
            keySignature={key}
          />
        </section>
      </main>
      {/* Barra Inferior de Ações */}
      <ActionBar
        keySignature={key}
        setKeySignature={setKey}
        newKey={newKey}
        setNewKey={setNewKey}
        enarmonia={enarmonia}
        setEnarmonia={setEnarmonia}
        onTranspose={() => {}}
        onExport={() => {}}
        onCopy={() => {}}
      />
      {/* Modal de Metadados */}
      {showMetaModal && (
        <ChordSheetMetaModal onClose={() => setShowMetaModal(false)} />
      )}
    </div>
  );
}
