import React from 'react';
import { ShieldCheck, Radio, FileText, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

interface Props { onCTA: () => void; }

const cards = [
  { icon: ShieldCheck, title: 'Registro autoral', desc: 'Proteja letra, melodia e composição com certificado digital.', cta: 'Registrar agora' },
  { icon: Radio, title: 'Distribuição musical', desc: 'Lance sua música em plataformas digitais com suporte da equipe.', cta: 'Quero distribuir' },
  { icon: FileText, title: 'Certificado digital', desc: 'Receba um PDF com dados da obra, autor, hash e data de emissão.', cta: 'Ver exemplo' },
];

export const ServiceCards: React.FC<Props> = ({ onCTA }) => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg)' }}>
      <div className="c-container">
        <Reveal>
          <h2 className="font-display font-bold max-w-3xl" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Soluções pensadas para quem vive de música.
          </h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 100}>
              <div className="c-card h-full flex flex-col">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                  style={{ background: 'var(--c-primary-soft)' }}>
                  <c.icon size={22} style={{ color: 'var(--c-primary)' }} />
                </div>
                <h3 className="font-display text-2xl font-semibold">{c.title}</h3>
                <p className="mt-3 text-base flex-1" style={{ color: 'var(--c-text-muted)' }}>{c.desc}</p>
                <button onClick={onCTA} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold self-start"
                  style={{ color: 'var(--c-primary)' }}>
                  {c.cta} <ArrowRight size={16} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
