import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AnimatedGradient from './AnimatedGradient';

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
        background: 'var(--c-bg)',
        minHeight: isMobile ? '100svh' : '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Animated WebGL gradient — Compuse greens */}
      <AnimatedGradient
        config={{
          preset: 'custom',
          color1: '#000000',
          color2: '#00B18C',
          color3: '#050505',
          rotation: -35,
          proportion: 45,
          scale: 0.55,
          speed: 18,
          distortion: 8,
          swirl: 70,
          swirlIterations: 8,
          softness: 100,
          offset: -180,
          shape: 'Edge',
          shapeSize: 38,
        }}
        noise={{ opacity: 0.18, scale: 1 }}
        style={{ zIndex: 0 }}
      />

      {/* Vignette + bottom fade for premium contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          zIndex: 2,
          height: isMobile ? 180 : 260,
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.95) 85%, #0a0a0a 100%)',
        }}
      />

      {/* Hero content */}
      <div className="relative w-full" style={{ zIndex: 10 }}>
        <div className="c-container">
          <div className="text-center mx-auto px-6" style={{ maxWidth: 760 }}>
            <div className="flex justify-center mb-8">
              <img
                src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
                alt="Compuse"
                style={{
                  height: isMobile ? 48 : 64,
                  filter: 'drop-shadow(0 0 50px rgba(0,177,140,0.6))',
                }}
              />
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(8px)',
                color: 'var(--c-text-muted)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--c-primary)', boxShadow: '0 0 12px var(--c-primary)' }}
              />
              Registro autoral com validade jurídica
            </div>

            <h1
              className="font-display font-bold leading-[1.02]"
              style={{
                fontSize: isMobile ? 'clamp(2rem, 9vw, 2.8rem)' : 'clamp(2.8rem, 5.2vw, 4.5rem)',
                textShadow: '0 4px 40px rgba(0,0,0,0.55)',
              }}
            >
              Proteja sua música sem burocracia,
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(90deg, var(--c-primary) 0%, #4ade80 50%, var(--c-primary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                sem advogado e sem complicação.
              </span>
            </h1>

            <p
              className="mt-6 text-base md:text-lg mx-auto"
              style={{ color: 'var(--c-text-muted)', maxWidth: 620 }}
            >
              Registre sua obra em minutos, receba certificado digital com hash criptográfico
              e garanta a prova de autoria — com suporte humano no WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onPrimary} className="c-btn c-btn-primary">
                Registrar minha música agora <ArrowRight size={16} />
              </button>
              <button onClick={onSecondary} className="c-btn c-btn-secondary">
                Como funciona
              </button>
            </div>

            <p className="mt-5 text-xs" style={{ color: 'var(--c-text-soft)' }}>
              Certificado emitido em minutos · Suporte via WhatsApp · A partir de R$ 19,99
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
