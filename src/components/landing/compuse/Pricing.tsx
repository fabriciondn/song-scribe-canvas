import React from 'react';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';

interface Props { onCTA: () => void; }

const plans = [
  {
    name: 'Avulso',
    tag: 'Para começar',
    price: 'sob consulta',
    features: ['1 música', 'Certificado em PDF', 'Hash da obra', 'Suporte pelo WhatsApp'],
    featured: false,
  },
  {
    name: 'Pacote Compositor',
    tag: 'Mais escolhido',
    price: '10 obras',
    features: ['10 músicas', '2 registros bônus', 'Atendimento prioritário', 'Bônus: lançamento digital'],
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
              Escolha o que faz sentido pra sua obra.
            </h2>
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
                <h3 className="font-display text-3xl font-bold mt-6">{p.name}</h3>
                <div className="mt-2 text-lg" style={{ color: 'var(--c-text-muted)' }}>{p.price}</div>

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
                  Quero esse plano
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
