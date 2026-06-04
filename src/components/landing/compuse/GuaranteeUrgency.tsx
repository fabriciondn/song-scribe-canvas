import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { Reveal } from './Reveal';

export const GuaranteeUrgency: React.FC = () => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg)' }}>
      <div className="c-container grid md:grid-cols-2 gap-6 max-w-5xl">
        <Reveal>
          <div
            className="c-card h-full"
            style={{
              borderColor: 'rgba(0,177,140,0.4)',
              background: 'linear-gradient(180deg, rgba(0,177,140,0.08), rgba(255,255,255,0.02))',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'var(--c-primary-soft)' }}
            >
              <ShieldCheck size={24} style={{ color: 'var(--c-primary)' }} />
            </div>
            <h3 className="font-display text-xl font-bold">Garantia de satisfação</h3>
            <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>
              Se por qualquer motivo você não ficar satisfeito com o processo, entre em contato com
              nosso time no WhatsApp e resolvemos juntos — sem burocracia, sem enrolação.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="c-card h-full" style={{ borderColor: 'rgba(255,90,90,0.35)' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'rgba(255,90,90,0.12)' }}
            >
              <Clock size={24} style={{ color: '#ff7a7a' }} />
            </div>
            <h3 className="font-display text-xl font-bold">Atenção</h3>
            <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>
              Cada dia sem registro é um dia que sua música fica exposta. Não existe "vou fazer depois"
              quando alguém decide lançar a sua música antes de você.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
