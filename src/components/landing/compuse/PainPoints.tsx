import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Reveal } from './Reveal';

const pains = [
  'Você cria uma música incrível — mas tem medo de mostrar porque alguém pode roubar a ideia antes de você lançar.',
  'Já tentou entender como funciona o registro autoral — e desistiu depois de 10 minutos lendo texto de lei.',
  'Tem dezenas de músicas espalhadas em cadernos, áudios no WhatsApp e bloco de notas — sem nenhuma organização.',
  'Já ouviu falar em ECAD, ISRC e direitos conexos — mas não sabe a diferença entre nenhum deles.',
  'Quer proteger suas obras — mas acha que esse processo é caro, demorado e cheio de burocracia.',
];

export const PainPoints: React.FC = () => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg-deep)' }}>
      <div className="c-container max-w-4xl">
        <Reveal>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>
            Se você é compositor, conhece essa sensação
          </div>
          <h2 className="font-display font-bold leading-[1.1]" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Você reconhece alguma dessas situações?
          </h2>
        </Reveal>

        <div className="mt-12 space-y-4">
          {pains.map((p, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="c-card flex items-start gap-4">
                <AlertCircle size={22} style={{ color: 'var(--c-primary)', flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
