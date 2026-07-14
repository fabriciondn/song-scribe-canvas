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
            Você criou algo único. <span style={{ color: 'var(--c-primary)' }}>Agora prove que é seu.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 text-lg" style={{ color: 'var(--c-text-muted)' }}>
            Não deixa sua música desprotegida nem mais um dia. Centenas de compositores já garantiram
            a prova de autoria das suas obras com a Compuse. Agora é a sua vez.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onCTA} className="c-btn c-btn-primary">
              Proteger minha música agora <ArrowRight size={18} />
            </button>
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--c-text-soft)' }}>
            Certificado digital em minutos · Suporte via WhatsApp · A partir de R$ 29,90
          </p>
        </Reveal>

        <Reveal delay={280}>
          <div
            className="mt-16 text-left mx-auto max-w-2xl pl-5"
            style={{ borderLeft: '3px solid var(--c-primary)' }}
          >
            <p className="text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>
              <strong style={{ color: 'var(--c-text)' }}>PS:</strong> Lembra que sua música ainda
              não está protegida. Qualquer pessoa pode ouvir, adaptar e lançar antes de você — e sem
              o registro, provar autoria fica muito mais difícil. A Compuse resolve isso em minutos,
              por menos de R$ 20. Não deixa pra depois o que pode proteger sua obra hoje.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
