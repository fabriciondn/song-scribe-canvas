import React, { useState } from 'react';

type ChordInsertPopoverProps = {
  onInsert: (symbol: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
  suggestions?: string[];
};

export const ChordInsertPopover: React.FC<ChordInsertPopoverProps> = ({
  onInsert,
  onClose,
  position,
  suggestions = [],
}) => {
  const [value, setValue] = useState('');

  return (
    <div
      className="absolute z-50 bg-background border border-muted rounded shadow-lg p-3 flex flex-col gap-2"
      style={{ left: position.x, top: position.y }}
    >
      <input
        className="input input-sm font-mono"
        autoFocus
        placeholder="Acorde (ex: C, Am)"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onInsert(value.trim());
            setValue('');
            onClose();
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map(s => (
            <button
              key={s}
              className="btn btn-xs btn-outline"
              onClick={() => {
                onInsert(s);
                setValue('');
                onClose();
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <button className="btn btn-xs mt-1" onClick={onClose}>Cancelar</button>
    </div>
  );
};
