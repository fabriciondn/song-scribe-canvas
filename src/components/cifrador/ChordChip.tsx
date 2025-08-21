import React from 'react';

interface ChordChipProps {
  symbol: string;
  selected?: boolean;
  error?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const ChordChip: React.FC<ChordChipProps> = ({
  symbol,
  selected,
  error,
  style,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => (
  <div
    className={`
      flex items-center justify-center select-none
      rounded-full shadow-md font-bold text-base
      transition-all duration-100
      ${selected ? 'ring-2 ring-primary' : ''}
      ${error ? 'border-2 border-red-500 text-red-500' : 'bg-background border border-muted'}
    `}
    style={{
      width: 32,
      height: 32,
      cursor: 'grab',
      position: 'absolute',
      ...style,
    }}
    tabIndex={0}
    draggable
    onClick={onClick}
    onContextMenu={onContextMenu}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    aria-label={`Acorde ${symbol}`}
  >
    {symbol}
  </div>
);
