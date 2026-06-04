import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

interface Props { onCTA: () => void; }

export const FinalCTA: React.FC<Props> = ({ onCTA }) => {
  return (
    <section className="py-32 relative overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,177,140,0.20) 0%, transparent 65%)',
        }}
      />
      <div className="c-container relative text-center max-w-3xl">
        <Reveal>
          <h2 className="font-display font-bold leading-[1.05]" style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
            Quantas músicas suas ainda <span style={{ color: 'var(--c-primary)' }}>estão sem proteção?</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 text-lg" style={{ color: 'var(--c-text-muted)' }}>
            Comece em poucos minutos. Receba certificado digital, hash e timestamp da sua obra.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onCTA} className="c-btn c-btn-primary">
              Começar agora <ArrowRight size={18} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
