import React from 'react';
import { ArrowRight, FileCheck, Fingerprint, Clock, Music } from 'lucide-react';
import { Reveal } from './Reveal';
import { AwardBadge } from '@/components/ui/award-badge';

interface Props {
  onPrimary: () => void;
  onSecondary: () => void;
}

const proofCards = [
  { icon: Fingerprint, title: 'Hash da obra', desc: 'Impressão digital única' },
  { icon: Clock, title: 'Timestamp', desc: 'Data e hora registradas' },
  { icon: FileCheck, title: 'Certificado PDF', desc: 'Documento jurídico' },
  { icon: Music, title: 'Letra protegida', desc: 'Sua autoria garantida' },
];

export const CompuseHero: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  return (
    <section id="top" className="relative pt-32 pb-20 overflow-hidden">
      {/* radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,177,140,0.18) 0%, transparent 60%)',
        }}
      />

      <div className="c-container relative">
        <Reveal>
          <div className="mb-6">
            <AwardBadge
              type="golden-kitty"
              customEyebrow="COMPUSE"
              customTitle="Registro autoral com validade jurídica"
              width={420}
            />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="font-display font-bold leading-[1.02] max-w-5xl"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}>
            Proteja suas músicas{' '}
            <span style={{ color: 'var(--c-primary)' }}>antes que alguém</span>{' '}
            faça isso por você.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-8 max-w-2xl text-lg md:text-xl" style={{ color: 'var(--c-text-muted)' }}>
            Registro autoral com certificado digital, hash da obra e emissão rápida
            para compositores independentes.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button onClick={onPrimary} className="c-btn c-btn-primary">
              Registrar minha música <ArrowRight size={18} />
            </button>
            <button onClick={onSecondary} className="c-btn c-btn-secondary">
              Ver como funciona
            </button>
          </div>
        </Reveal>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {proofCards.map((c, i) => (
            <Reveal key={c.title} delay={300 + i * 80}>
              <div className="c-card h-full">
                <c.icon size={28} style={{ color: 'var(--c-primary)' }} />
                <h3 className="mt-4 font-semibold text-base">{c.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--c-text-soft)' }}>{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
