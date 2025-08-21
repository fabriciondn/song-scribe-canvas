import React from 'react';

type LyricsTextareaProps = {
  value: string;
  onChange: (val: string) => void;
};

export const LyricsTextarea: React.FC<LyricsTextareaProps> = ({ value, onChange }) => (
  <div>
    <label className="block mb-2 font-semibold">Letra da música (sem acordes)</label>
    <textarea
      className="w-full min-h-[180px] font-mono p-2 rounded bg-background border border-muted"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Digite a letra da música aqui..."
    />
  </div>
);
