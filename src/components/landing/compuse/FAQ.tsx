import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Reveal } from './Reveal';

const faqs = [
  {
    q: 'O registro da Compuse substitui o registro no ECAD?',
    a: 'Não — são coisas diferentes. O certificado da Compuse é uma evidência digital de autoria da obra. O ECAD cuida da arrecadação de direitos de execução pública. Os dois se complementam. Nosso time pode te explicar a diferença e o próximo passo certo pra sua situação.',
  },
  {
    q: 'Posso registrar se nunca fiz isso antes?',
    a: 'Sim — a Compuse foi criada exatamente pra quem está fazendo isso pela primeira vez. O processo é simples e tem suporte humano via WhatsApp em cada etapa.',
  },
  {
    q: 'Quanto tempo leva pra receber o certificado?',
    a: 'Minutos. Assim que o registro for processado, você recebe o certificado digital em PDF com todos os dados da obra.',
  },
  {
    q: 'Como funciona o acesso à plataforma?',
    a: 'Você acessa pelo site da Compuse, preenche os dados da música e o sistema gera o certificado. Simples, sem download e sem instalação.',
  },
  {
    q: 'E se eu não gostar ou tiver algum problema?',
    a: 'Nosso time está no WhatsApp pra resolver. Garantimos que você vai sair com sua obra registrada e protegida.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Cartão de crédito, Pix e boleto bancário.',
  },
  {
    q: 'Posso registrar músicas em parceria com outro compositor?',
    a: 'Sim. O certificado inclui o nome de todos os autores da obra.',
  },
  {
    q: 'Tem suporte? Como funciona?',
    a: 'Suporte humano direto via WhatsApp — pessoas reais, não bots. Você pode tirar dúvidas antes, durante e depois do registro.',
  },
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
                      maxHeight: isOpen ? 360 : 0,
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
