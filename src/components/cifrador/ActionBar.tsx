import React from 'react';

interface ActionBarProps {
  keySignature: string;
  setKeySignature: (k: string) => void;
  newKey: string;
  setNewKey: (k: string) => void;
  enarmonia: 'auto' | '#' | 'b';
  setEnarmonia: (e: 'auto' | '#' | 'b') => void;
  onTranspose: () => void;
  onExport: () => void;
  onCopy: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  keySignature,
  setKeySignature,
  newKey,
  setNewKey,
  enarmonia,
  setEnarmonia,
  onTranspose,
  onExport,
  onCopy,
}) => (
  <footer className="w-full px-6 py-4 border-t border-muted bg-background/80 flex items-center gap-4 sticky bottom-0 z-10">
    <select value={keySignature} onChange={e => setKeySignature(e.target.value)} className="input input-sm">
      {/* ...opções de tonalidade */}
      <option value="C">C</option>
      <option value="G">G</option>
      <option value="D">D</option>
      <option value="A">A</option>
      <option value="E">E</option>
      <option value="B">B</option>
      <option value="F#">F#</option>
      <option value="C#">C#</option>
      <option value="F">F</option>
      <option value="Bb">Bb</option>
      <option value="Eb">Eb</option>
      <option value="Ab">Ab</option>
      <option value="Db">Db</option>
      <option value="Gb">Gb</option>
      <option value="Cb">Cb</option>
    </select>
    <span>→</span>
    <select value={newKey} onChange={e => setNewKey(e.target.value)} className="input input-sm">
      {/* ...opções de tonalidade */}
      <option value="C">C</option>
      <option value="G">G</option>
      <option value="D">D</option>
      <option value="A">A</option>
      <option value="E">E</option>
      <option value="B">B</option>
      <option value="F#">F#</option>
      <option value="C#">C#</option>
      <option value="F">F</option>
      <option value="Bb">Bb</option>
      <option value="Eb">Eb</option>
      <option value="Ab">Ab</option>
      <option value="Db">Db</option>
      <option value="Gb">Gb</option>
      <option value="Cb">Cb</option>
    </select>
    <select value={enarmonia} onChange={e => setEnarmonia(e.target.value as any)} className="input input-sm">
      <option value="auto">Automático</option>
      <option value="#">#</option>
      <option value="b">b</option>
    </select>
    <button className="btn btn-primary" onClick={onTranspose}>Transpor</button>
    <button className="btn" onClick={onExport}>Exportar</button>
    <button className="btn" onClick={onCopy}>Copiar Resultado</button>
  </footer>
);
