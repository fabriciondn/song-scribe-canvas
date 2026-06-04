import React from 'react';
import { Reveal } from './Reveal';

const items = [
  {
    q: 'Mas registro autoral não é muito caro e complicado?',
    a: 'A maioria das pessoas pensa nisso e desiste antes de tentar. A Compuse foi criada exatamente pra tirar essa barreira — o processo é feito pela nossa plataforma, custa a partir de R$ 19,99 e leva minutos, não meses.',
  },
  {
    q: 'Esse certificado tem validade jurídica?',
    a: 'O certificado digital com hash criptográfico gera uma evidência da existência da obra numa data específica — e essa é a base de qualquer prova de autoria. Para casos que exigem processo judicial completo, nosso time pode te orientar pelos próximos passos.',
  },
  {
    q: 'E se eu não souber preencher ou tiver dúvidas?',
    a: 'Sem problema. Tem um ser humano de verdade no nosso WhatsApp pra te ajudar em cada etapa. Você não vai ficar sozinho no processo.',
  },
  {
    q: 'Eu tenho muitas músicas — registrar tudo vai ser um trabalho enorme.',
    a: 'É por isso que o pacote 10+2 existe. Você registra o seu catálogo de uma vez, com preço menor por música e ainda ganha 2 registros de bônus.',
  },
  {
    q: 'Nunca ouvi falar da Compuse — como sei que é confiável?',
    a: 'Compositores em todo o Brasil já registraram suas obras pela plataforma. E nosso suporte é por WhatsApp com pessoas reais — não é um sistema automático sem rosto.',
  },
];

export const Objections: React.FC = () => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg-deep)' }}>
      <div className="c-container max-w-4xl">
        <Reveal>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>
            ​
          </div>
          <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            As dúvidas mais comuns antes de registrar.
          </h2>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="c-card h-full">
                <h3 className="font-display font-semibold text-lg leading-tight">{it.q}</h3>
                <p className="mt-3 text-sm" style={{ color: 'var(--c-text-muted)' }}>{it.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
