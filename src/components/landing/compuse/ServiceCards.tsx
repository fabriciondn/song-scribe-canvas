import React from 'react';
import { ShieldCheck, FileCheck2, MessageCircle, Headphones, Layers, Zap } from 'lucide-react';
import { Reveal } from './Reveal';

interface Props { onCTA: () => void; }

const cards = [
  {
    icon: ShieldCheck,
    title: 'Autoria provada e documentada',
    desc: 'Mostre sua música pra qualquer produtor ou artista sem medo — a autoria já está registrada com hash, data e seu nome.',
  },
  {
    icon: FileCheck2,
    title: 'Certificado profissional em PDF',
    desc: 'Documento com seu nome, data exata e dados da obra. Pronto pra usar onde você precisar.',
  },
  {
    icon: Layers,
    title: 'Seu catálogo organizado',
    desc: 'Nunca mais perca uma música no caos de áudios e cadernos. Tudo acessível em um só lugar.',
  },
  {
    icon: Zap,
    title: 'Resolvido em minutos',
    desc: 'Sem fila, sem cartório, sem processo complicado. Você registra agora e recebe o certificado em seguida.',
  },
  {
    icon: MessageCircle,
    title: 'Suporte humano no WhatsApp',
    desc: 'Pessoa de verdade pra te ajudar — não é bot, não é FAQ. Tira dúvidas antes, durante e depois.',
  },
  {
    icon: Headphones,
    title: 'Catálogo inteiro registrado',
    desc: 'Com o pacote 10+2 você protege seu repertório de uma vez e ainda ganha 2 registros de bônus.',
  },
];

export const ServiceCards: React.FC<Props> = ({ onCTA }) => {
  return (
    <section className="py-24" style={{ background: 'var(--c-bg)' }}>
      <div className="c-container">
        <Reveal>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--c-primary)' }}>Por que a Compuse</div>
          <h2 className="font-display font-bold max-w-3xl" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Você criou. Agora prove que é seu.
          </h2>
          <p className="mt-5 max-w-2xl text-base md:text-lg" style={{ color: 'var(--c-text-muted)' }}>
            Sem entender de lei, sem advogado, sem esperar meses. O sistema gera um certificado
            digital com hash criptográfico — a impressão digital única da sua obra — que comprova
            que ela existia naquela data, com o seu nome como autor.
          </p>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="c-card h-full flex flex-col">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                  style={{ background: 'var(--c-primary-soft)' }}>
                  <c.icon size={22} style={{ color: 'var(--c-primary)' }} />
                </div>
                <h3 className="font-display text-xl font-semibold leading-tight">{c.title}</h3>
                <p className="mt-3 text-sm flex-1" style={{ color: 'var(--c-text-muted)' }}>{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 flex justify-center">
            <button onClick={onCTA} className="c-btn c-btn-primary">
              Quero proteger minha obra
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
