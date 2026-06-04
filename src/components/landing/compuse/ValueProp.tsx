import React from 'react';
import { Reveal } from './Reveal';

export const ValueProp: React.FC = () => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg)' }}>
      <div className="c-container max-w-3xl">
        <Reveal>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>
            Por que isso importa
          </div>
          <h2 className="font-display font-bold leading-[1.1]" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Você criou uma música. <span style={{ color: 'var(--c-primary)' }}>Mas ela ainda não está protegida.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 space-y-5 text-base md:text-lg" style={{ color: 'var(--c-text-muted)' }}>
            <p>
              Passou horas escrevendo, ajustando cada palavra, cada acorde. Mas enquanto não estiver
              registrada, qualquer pessoa pode lançar antes de você.
            </p>
            <p>
              A Compuse existe pra resolver isso — de forma simples, rápida e sem precisar entender de lei.
            </p>
            <p style={{ color: 'var(--c-text)' }}>
              Registro autoral profissional, certificado digital e suporte via WhatsApp. Tudo em um só lugar.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
