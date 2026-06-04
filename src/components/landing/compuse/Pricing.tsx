import React from 'react';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';

interface Props { onCTA: () => void; }

const plans = [
  {
    name: 'Registro unitário',
    tag: 'Pra começar',
    price: 'R$ 19,99',
    priceHint: '1 registro',
    features: [
      'Certificado digital em PDF',
      'Hash criptográfico da obra',
      'Comprovante de autoria com data/hora',
      'Suporte via WhatsApp',
    ],
    cta: 'Registrar minha música',
    featured: false,
  },
  {
    name: 'Pacote 10 + 2',
    tag: 'Melhor valor',
    price: 'R$ 179,99',
    priceHint: '12 registros · R$ 14,99 por obra · economia de R$ 60',
    features: [
      '10 registros de obras',
      '+2 registros bônus grátis',
      'Certificados digitais em PDF',
      'Hash criptográfico de cada obra',
      'Suporte via WhatsApp',
    ],
    cta: 'Quero o pacote',
    featured: true,
  },
];

export const Pricing: React.FC<Props> = ({ onCTA }) => {
  return (
    <section id="pacotes" className="py-24" style={{ background: 'var(--c-bg)' }}>
      <div className="c-container">
        <Reveal>
          <div className="max-w-3xl">
            <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>Pacotes</div>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              Escolha o que faz sentido pro seu catálogo.
            </h2>
            <p className="mt-5 text-base md:text-lg" style={{ color: 'var(--c-text-muted)' }}>
              Registre uma música hoje ou proteja o catálogo inteiro de uma vez — com 2 registros
              de bônus quando você fecha em pacote.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <div
                className="c-card h-full flex flex-col"
                style={
                  p.featured
                    ? {
                        borderColor: 'rgba(0,177,140,0.5)',
                        background: 'linear-gradient(180deg, rgba(0,177,140,0.10), rgba(255,255,255,0.02))',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      background: p.featured ? 'var(--c-primary)' : 'var(--c-surface-soft)',
                      color: p.featured ? '#06130B' : 'var(--c-text-muted)',
                    }}>
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold mt-6">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold" style={{ color: 'var(--c-text)' }}>{p.price}</span>
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--c-text-soft)' }}>{p.priceHint}</div>

                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={18} style={{ color: 'var(--c-primary)', marginTop: 2 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onCTA}
                  className={`c-btn mt-8 w-full ${p.featured ? 'c-btn-primary' : ''}`}
                >
                  {p.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
