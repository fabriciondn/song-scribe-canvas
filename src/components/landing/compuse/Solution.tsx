import React from 'react';
import { Fingerprint } from 'lucide-react';
import { Reveal } from './Reveal';

export const Solution: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,177,140,0.10) 0%, transparent 65%)',
        }}
      />
      <div className="c-container max-w-3xl relative">
        <Reveal>
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--c-primary-soft)' }}
            >
              <Fingerprint size={32} style={{ color: 'var(--c-primary)' }} />
            </div>
          </div>
          <h2
            className="font-display font-bold text-center leading-[1.1]"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            A Compuse foi criada <span style={{ color: 'var(--c-primary)' }}>exatamente pra isso.</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 space-y-5 text-base md:text-lg text-center" style={{ color: 'var(--c-text-muted)' }}>
            <p>
              Você não precisa entender de legislação. Não precisa contratar advogado. Não precisa esperar meses.
            </p>
            <p>
              Nosso sistema gera um certificado digital com hash criptográfico — uma{' '}
              <strong style={{ color: 'var(--c-text)' }}>"impressão digital" única da sua obra</strong> — que
              comprova que ela existia naquela data, com aquela letra, com aquele arranjo, com o seu nome como autor.
            </p>
            <p>
              É a evidência digital que qualquer processo judicial ou negociação vai exigir. Simples assim.
            </p>
            <p style={{ color: 'var(--c-text)' }}>
              E se você tiver qualquer dúvida, nosso time está no WhatsApp pra resolver junto com você.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
