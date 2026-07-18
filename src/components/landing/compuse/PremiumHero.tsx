import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import GradientBars from './GradientBars';
import { AwardBadge } from '@/components/ui/award-badge';
import { LogoMarquee } from './LogoMarquee';

interface Props {
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export const PremiumHero: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(max-width: 768px)');
    const u = () => setIsMobile(m.matches);
    u();
    m.addEventListener('change', u);
    return () => m.removeEventListener('change', u);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{
        background: '#000',
        minHeight: isMobile ? '100svh' : '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Inverted animated gradient bars — Compuse greens, hanging from top */}
      <GradientBars
        numBars={20}
        gradientFrom="rgb(0, 177, 140)"
        gradientTo="transparent"
        animationDuration={2.5}
        inverted
        className="z-0"
      />

      {/* Soft top glow to reinforce the hanging-bars feel */}
      <div
        className="absolute left-0 right-0 top-0 pointer-events-none"
        style={{
          zIndex: 1,
          height: isMobile ? 220 : 320,
          background:
            'linear-gradient(to bottom, rgba(0,177,140,0.18) 0%, rgba(0,177,140,0.05) 50%, transparent 100%)',
        }}
      />

      {/* Vignette for premium contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 70% 80% at 50% 60%, transparent 0%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Bottom smoke fade into pure black — long, soft, no hard cut */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          zIndex: 3,
          height: isMobile ? 340 : 480,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.95) 85%, #000 100%)',
        }}
      />



      {/* Hero content */}
      <div className="relative w-full" style={{ zIndex: 10 }}>
        <div className="c-container">
          <div className="text-center mx-auto px-6" style={{ maxWidth: 760 }}>
            <div className="mb-6 flex justify-center">
              <AwardBadge
                type="golden-kitty"
                customEyebrow="COMPUSE"
                customTitle="Registro autoral com validade jurídica"
                width={300}
              />
            </div>

            <h1
              className="font-display font-bold leading-[1.02]"
              style={{
                fontSize: isMobile ? 'clamp(2rem, 9vw, 2.8rem)' : 'clamp(2.8rem, 5.2vw, 4.5rem)',
                textShadow: '0 4px 40px rgba(0,0,0,0.55)',
              }}
            >
              Mostrar sua música sem registrar é arriscar seus direitos
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(90deg, var(--c-primary) 0%, #4ade80 50%, var(--c-primary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '0.5em',
                  display: 'inline-block',
                }}
              >
                {"\n"}Proteja sua composição e receba o certificado de registro autoral na hora
              </span>
            </h1>

            <p
              className="mt-6 text-base md:text-lg mx-auto"
              style={{ color: 'var(--c-text-muted)', maxWidth: 620 }}
            >
              {"\n"}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onPrimary} className="c-btn c-btn-primary">
                Registrar minha música agora <ArrowRight size={16} />
              </button>
              <button onClick={onSecondary} className="c-btn c-btn-secondary">
                Como funciona
              </button>
            </div>

            <p className="mt-5 text-xs whitespace-pre-line" style={{ color: 'var(--c-text-soft)' }}>
              {"\n\n"}Também oferecemos o serviço adicional de lançamento em todas as plataformas
            </p>

            <div className="mt-8">
              <LogoMarquee />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
