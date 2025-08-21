import React, { useState } from 'react';
import { LyricsTextarea } from './LyricsTextarea';
import { ChordPreview } from './ChordPreview';
import { ChordSheetMetaModal } from './ChordSheetMetaModal';
// ...outros imports necessários

// Tipos
export type Placement = { charIndex: number; symbol: string };
export type Placements = { lines: { text: string; chords: Placement[] }[] };

  const [lyrics, setLyrics] = useState('');
  const [placements, setPlacements] = useState<Placements>({ lines: [] });
  const [key, setKey] = useState('C');
  const [newKey, setNewKey] = useState('C');
  const [showMetaModal, setShowMetaModal] = useState(false);

  // TODO: Funções para inserir, arrastar, editar, duplicar, excluir chips
  // TODO: Função para transpor
  // TODO: Função para exportar/copiar
  // TODO: Função para salvar (Supabase)

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button className="tab tab-active">Posicionamento Visual</button>
        <button className="tab">Modo Simples</button>
      </div>
      <div className="flex flex-1 gap-6">
        <div className="w-1/2">
          <LyricsTextarea value={lyrics} onChange={setLyrics} />
        </div>
        <div className="w-1/2">
          <ChordPreview lyrics={lyrics} placements={placements} setPlacements={setPlacements as any} />
        </div>
      </div>
      {/* Barra inferior */}
      <div className="flex items-center gap-4 mt-6">
        <select value={key} onChange={e => setKey(e.target.value)}>
          {/* ...opções de tonalidade */}
        </select>
        <select value={newKey} onChange={e => setNewKey(e.target.value)}>
          {/* ...opções de tonalidade */}
        </select>
        <button className="btn btn-primary">Transpor</button>
        <button className="btn">Exportar TXT</button>
        <button className="btn">Exportar PDF</button>
        <button className="btn">Copiar Resultado</button>
        <button className="btn btn-success" onClick={() => setShowMetaModal(true)}>Salvar cifra</button>
      </div>
      {showMetaModal && (
        <ChordSheetMetaModal onClose={() => setShowMetaModal(false)} />
      )}
    </div>
  );
}
