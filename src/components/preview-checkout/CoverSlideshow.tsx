import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  intervalMs?: number;
}

/**
 * Carrossel simples de imagens quadradas 1:1, com autoplay e dots.
 */
export const CoverSlideshow: React.FC<Props> = ({ images, intervalMs = 3500 }) => {
  const [idx, setIdx] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(t);
  }, [total, intervalMs]);

  if (total === 0) return null;

  const go = (dir: 1 | -1) =>
    setIdx((i) => (i + dir + total) % total);

  return (
    <div className="flex justify-center">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-border shadow-lg group">
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={`Capa ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ))}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Ir para capa ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
