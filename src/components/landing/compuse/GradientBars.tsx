import React from 'react';

interface GradientBarsProps {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
  /** If true, bars hang from the top instead of standing from the bottom */
  inverted?: boolean;
}

const GradientBars: React.FC<GradientBarsProps> = ({
  numBars = 15,
  gradientFrom = 'rgb(0, 177, 140)',
  gradientTo = 'transparent',
  animationDuration = 2,
  className = '',
  inverted = false,
}) => {
  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;

    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);

    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  const gradientDirection = inverted ? 'to bottom' : 'to top';
  const transformOrigin = inverted ? 'top' : 'bottom';

  return (
    <>
      <style>{`
        @keyframes pulseBar {
          0% { transform: scaleY(var(--initial-scale)); }
          100% { transform: scaleY(calc(var(--initial-scale) * 0.7)); }
        }
      `}</style>

      <div
        className={`absolute inset-0 flex justify-between items-${inverted ? 'start' : 'end'} ${className}`}
        style={{ pointerEvents: 'none' }}
      >
        {Array.from({ length: numBars }).map((_, index) => {
          const height = calculateHeight(index, numBars);
          return (
            <div
              key={index}
              className="flex-1 h-full"
              style={{
                background: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`,
                transformOrigin,
                transform: `scaleY(${height / 100})`,
                animation: `pulseBar ${animationDuration}s ease-in-out ${(index * 0.1).toFixed(2)}s infinite alternate`,
                // @ts-ignore
                '--initial-scale': height / 100,
                opacity: 0.85,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    </>
  );
};

export default GradientBars;
