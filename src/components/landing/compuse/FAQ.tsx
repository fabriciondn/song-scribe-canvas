import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Reveal } from './Reveal';

const faqs = [
  { q: 'O registro vale juridicamente?', a: 'Sim. O certificado é emitido com hash, timestamp e dados do autor, servindo como prova de anterioridade aceita em mais de 175 países.' },
  { q: 'Posso registrar letra sem áudio?', a: 'Sim. Você pode registrar apenas a letra, apenas o áudio ou ambos juntos.' },
  { q: 'Quanto tempo demora?', a: 'O certificado é emitido em até 5 minutos após a confirmação do envio.' },
  { q: 'Recebo certificado em PDF?', a: 'Sim. Você recebe um PDF com dados da obra, autoria, hash e data/hora de emissão.' },
  { q: 'Posso registrar várias músicas?', a: 'Sim, com pacotes promocionais para compositores ativos.' },
  { q: 'O que é hash?', a: 'É a impressão digital única da sua obra, gerada a partir do conteúdo enviado. Qualquer alteração muda o hash.' },
  { q: 'Qual a diferença entre registro, ISRC e distribuição?', a: 'Registro protege a autoria. ISRC identifica o fonograma. Distribuição leva sua música para plataformas como Spotify e YouTube.' },
];

export const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24" style={{ background: 'var(--c-bg-deep)' }}>
      <div className="c-container max-w-3xl">
        <Reveal>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>Dúvidas</div>
          <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Perguntas frequentes
          </h2>
        </Reveal>

        <div className="mt-12 divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div className="py-2" style={{ borderTop: i === 0 ? '1px solid var(--c-border)' : 'none', borderBottom: '1px solid var(--c-border)' }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <span className="text-base md:text-lg font-medium pr-6">{f.q}</span>
                    {isOpen ? <Minus size={20} style={{ color: 'var(--c-primary)' }} /> : <Plus size={20} style={{ color: 'var(--c-text-muted)' }} />}
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 300 : 0,
                      overflow: 'hidden',
                      transition: 'max-height .52s var(--ease-premium), opacity .52s ease',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="pb-6 pr-10 text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
