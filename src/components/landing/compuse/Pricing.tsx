import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props { onCTA: () => void; }

const plans = [
  {
    name: 'Registro unitário',
    description: 'Ideal para registrar uma música pontual com segurança jurídica e certificado oficial.',
    price: 29.90,
    priceHint: '1 registro',
    buttonText: 'Registrar minha música',
    popular: false,
    includes: [
      'Inclui:',
      'Certificado digital em PDF',
      'Hash criptográfico da obra',
      'Comprovante de autoria com data/hora',
      'Suporte via WhatsApp',
    ],
  },
  {
    name: 'Plano Padrão',
    description: 'Oferta especial de lançamento: proteja até 50 músicas por mês com certificado imediato e sem burocracia.',
    price: 97.00,
    originalPrice: 127.00,
    priceHint: 'por mês · Até 50 registros a cada 30 dias',
    buttonText: 'Assinar Plano Padrão',
    popular: true,
    includes: [
      'Tudo do Registro unitário, mais:',
      'Até 50 registros autorais por ciclo de 30 dias',
      'Certificados digitais em PDF com hash criptográfico',
      'Comprovante de autoria com data e hora oficial',
      'Sem fidelidade, cancele quando quiser',
      'Prioridade máxima no suporte WhatsApp',
    ],
  },
];

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Pricing: React.FC<Props> = ({ onCTA }) => {
  return (
    <section
      id="pacotes"
      className="relative py-24 overflow-hidden"
      style={{ background: 'var(--c-bg-deep)' }}
    >
      {/* Glow de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(0,177,140,0.18), transparent 70%)',
        }}
      />

      <div className="c-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-5"
            style={{
              background: 'var(--c-primary-soft)',
              color: 'var(--c-primary)',
              border: '1px solid rgba(0,177,140,0.25)',
            }}
          >
            <Sparkles size={14} /> Pacotes
          </div>
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05 }}
          >
            Escolha o que faz sentido pro{' '}
            <span style={{ color: 'var(--c-primary)' }}>seu catálogo</span>.
          </h2>
          <p
            className="mt-5 text-base md:text-lg"
            style={{ color: 'var(--c-text-muted)' }}
          >
            Registre uma música pontual ou assine o Plano Padrão para proteger até 50 composições por mês com o melhor custo-benefício.
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative rounded-2xl p-8 flex flex-col h-full"
              style={
                plan.popular
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(0,177,140,0.18) 0%, rgba(0,177,140,0.04) 60%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(0,177,140,0.45)',
                      boxShadow:
                        '0 0 0 1px rgba(0,177,140,0.15), 0 20px 60px -20px rgba(0,177,140,0.45)',
                    }
                  : {
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }
              }
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 right-6 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: 'var(--c-primary)', color: '#06130B' }}
                >
                  Oferta de lançamento
                </div>
              )}

              <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--c-text-muted)' }}
              >
                {plan.description}
              </p>

              {'originalPrice' in plan && plan.originalPrice != null && (
                <p className="mt-6 text-sm" style={{ color: 'var(--c-text-muted)' }}>
                  De <span className="line-through opacity-50">R$ {formatBRL(plan.originalPrice)}</span> por
                </p>
              )}
              <div className={`${plan.popular ? 'mt-1' : 'mt-6'} flex items-baseline gap-2`}>
                <span
                  className="font-display font-bold"
                  style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: 'var(--c-text)' }}
                >
                  R$ {formatBRL(plan.price)}
                </span>
                {'originalPrice' in plan && plan.originalPrice != null && (
                  <span className="text-sm" style={{ color: 'var(--c-text-muted)' }}>/mês</span>
                )}
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--c-text-soft)' }}>
                {plan.priceHint}
              </div>

              <button
                onClick={onCTA}
                className={`c-btn mt-7 w-full ${plan.popular ? 'c-btn-primary' : ''}`}
                style={
                  !plan.popular
                    ? {
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                      }
                    : undefined
                }
              >
                {plan.buttonText}
              </button>

              <div className="mt-8 flex-1">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {plan.includes[0]}
                </p>
                <ul className="space-y-3">
                  {plan.includes.slice(1).map((feature, fi) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.1 + fi * 0.06 }}
                      className="flex items-start gap-3 text-sm"
                      style={{ color: 'var(--c-text)' }}
                    >
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          marginTop: 1,
                          background: plan.popular
                            ? 'var(--c-primary)'
                            : 'rgba(0,177,140,0.15)',
                          color: plan.popular ? '#06130B' : 'var(--c-primary)',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
