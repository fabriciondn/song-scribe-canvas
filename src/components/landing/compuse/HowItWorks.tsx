import React from 'react';
import { Reveal } from './Reveal';

const steps = [
  { n: '01', title: 'Envie sua obra', desc: 'Letra, áudio ou ambos. Em poucos cliques.' },
  { n: '02', title: 'Organizamos os dados', desc: 'Nossa equipe valida e prepara o registro.' },
  { n: '03', title: 'Hash + Timestamp', desc: 'Geramos a impressão digital única da obra.' },
  { n: '04', title: 'Certificado em PDF', desc: 'Você recebe a prova jurídica em minutos.' },
  { n: '05', title: 'Distribuição (opcional)', desc: 'Levamos sua música para as plataformas.' },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="py-24" style={{ background: 'var(--c-bg-deep)' }}>
      <div className="c-container">
        <Reveal>
          <div className="max-w-3xl">
            <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>Como funciona</div>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              Da ideia ao certificado em 5 minutos.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 relative">
          {/* horizontal line desktop */}
          <div className="hidden md:block absolute left-0 right-0 top-6 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--c-border), transparent)' }} />
          {/* vertical line mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px"
            style={{ background: 'var(--c-border)' }} />

          <div className="grid md:grid-cols-5 gap-10 md:gap-6 relative">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="flex md:flex-col gap-4 md:gap-5">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm relative z-10"
                      style={{
                        background: 'var(--c-bg-deep)',
                        border: '1px solid var(--c-primary)',
                        color: 'var(--c-primary)',
                        boxShadow: '0 0 24px var(--c-primary-glow)',
                      }}
                    >
                      {s.n}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="mt-2 text-sm" style={{ color: 'var(--c-text-muted)' }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
