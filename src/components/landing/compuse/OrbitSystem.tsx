import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  onPrimary?: () => void;
  onSecondary?: () => void;
}

interface OrbitItem {
  id: string;
  label: string;
  tooltip: string;
  /** angle in degrees around the center */
  angle: number;
  /** base radius from center, in % of stage min-dimension */
  radius: number;
  /** circle size in px */
  size: number;
  /** parallax depth layer */
  depth: 1 | 2 | 3;
  /** when (0..1 scroll) the item reveals */
  revealAt: number;
  /** font size for label */
  fontSize?: number;
}

// 24 items distributed around the center
const items: OrbitItem[] = [
  // inner ring (depth 1, small radius)
  { id: 'letra',  label: 'LETRA',       tooltip: 'Sua letra protegida juridicamente.',           angle: 0,   radius: 22, size: 72, depth: 1, revealAt: 0.00 },
  { id: 'audio',  label: 'ÁUDIO',       tooltip: 'Áudio com hash único e timestamp.',            angle: 60,  radius: 24, size: 72, depth: 1, revealAt: 0.05 },
  { id: 'hash',   label: 'HASH',        tooltip: 'Impressão digital única da obra.',             angle: 120, radius: 22, size: 76, depth: 1, revealAt: 0.10 },
  { id: 'time',   label: 'TIMESTAMP',   tooltip: 'Data e hora certificadas.',                    angle: 180, radius: 24, size: 84, depth: 1, revealAt: 0.15, fontSize: 11 },
  { id: 'cert',   label: 'CERTIFICADO', tooltip: 'PDF jurídico em até 5 minutos.',               angle: 240, radius: 22, size: 92, depth: 1, revealAt: 0.20, fontSize: 10 },
  { id: 'dist',   label: 'DISTRIBUIÇÃO',tooltip: 'Spotify, YouTube e mais.',                     angle: 300, radius: 24, size: 96, depth: 1, revealAt: 0.25, fontSize: 9 },

  // middle ring (depth 2)
  { id: 'isrc',   label: 'ISRC',  tooltip: 'Código do fonograma.',                  angle: 20,  radius: 36, size: 68, depth: 2, revealAt: 0.30 },
  { id: 'iswc',   label: 'ISWC',  tooltip: 'Código da composição.',                 angle: 70,  radius: 38, size: 68, depth: 2, revealAt: 0.32 },
  { id: 'ismn',   label: 'ISMN',  tooltip: 'Código de publicação musical.',         angle: 110, radius: 36, size: 68, depth: 2, revealAt: 0.34 },
  { id: 'isan',   label: 'ISAN',  tooltip: 'Identificador audiovisual.',            angle: 160, radius: 38, size: 68, depth: 2, revealAt: 0.36 },
  { id: 'ipi',    label: 'IPI',   tooltip: 'Identificador de autor.',               angle: 200, radius: 36, size: 64, depth: 2, revealAt: 0.38 },
  { id: 'ean',    label: 'EAN',   tooltip: 'Código de barras internacional.',       angle: 250, radius: 38, size: 64, depth: 2, revealAt: 0.40 },
  { id: 'istc',   label: 'ISTC',  tooltip: 'Identificador de obras textuais.',      angle: 290, radius: 36, size: 64, depth: 2, revealAt: 0.42 },
  { id: 'ddex',   label: 'DDEX',  tooltip: 'Padrão de metadados musicais.',         angle: 330, radius: 38, size: 64, depth: 2, revealAt: 0.44 },

  // outer ring (depth 3)
  { id: 'royal',  label: 'ROYALTIES', tooltip: 'Direitos de execução pública.',      angle: 10,  radius: 50, size: 76, depth: 3, revealAt: 0.50, fontSize: 10 },
  { id: 'pdf',    label: 'PDF',       tooltip: 'Certificado oficial em PDF.',        angle: 55,  radius: 52, size: 60, depth: 3, revealAt: 0.52 },
  { id: 'ecad',   label: 'ECAD',      tooltip: 'Arrecadação no Brasil.',             angle: 95,  radius: 50, size: 68, depth: 3, revealAt: 0.54 },
  { id: 'upc',    label: 'UPC',       tooltip: 'Código universal de produto.',       angle: 140, radius: 52, size: 60, depth: 3, revealAt: 0.56 },
  { id: 'da',     label: 'DA',        tooltip: 'Direitos autorais.',                 angle: 185, radius: 50, size: 56, depth: 3, revealAt: 0.58 },
  { id: 'mlc',    label: 'MLC',       tooltip: 'Mechanical Licensing Collective.',   angle: 225, radius: 52, size: 60, depth: 3, revealAt: 0.60 },
  { id: 'bmi',    label: 'BMI',       tooltip: 'Sociedade de direitos EUA.',         angle: 265, radius: 50, size: 60, depth: 3, revealAt: 0.62 },
  { id: 'pro',    label: 'PRO',       tooltip: 'Performing Rights Org.',             angle: 305, radius: 52, size: 60, depth: 3, revealAt: 0.64 },
  { id: 'wipo',   label: 'WIPO',      tooltip: 'Organização mundial da propriedade.', angle: 345, radius: 50, size: 68, depth: 3, revealAt: 0.66 },
  { id: 'labels', label: '9 LABELS',  tooltip: 'Distribuímos para 9 grandes labels.', angle: 35,  radius: 60, size: 76, depth: 3, revealAt: 0.70, fontSize: 11 },
];

const depthOffset = { 1: 8, 2: 16, 3: 28 } as const;

export const OrbitSystem: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ dx: 0, dy: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const m = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      const el = stageRef.current;
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // normalize to roughly [-1, 1] using viewport so movement is broad
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)));
        setMouse({ dx, dy });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 at hero in view, 1 once fully scrolled past
      const raw = (vh - r.top) / (vh + r.height);
      setScrollProgress(Math.max(0, Math.min(1, raw)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // easeInOut
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // 0..0.5 → items collapse toward center, 0.5..1 → return to organized base
  // Following spec: start spread, middle approaches center, end organized network.
  const p = scrollProgress;
  const convergeT = p < 0.5 ? easeInOut(p / 0.5) : easeInOut(1 - (p - 0.5) / 0.5);
  // convergeT: 0 at start/end, 1 at middle

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: 'var(--c-bg)',
        paddingTop: isMobile ? 96 : 120,
        paddingBottom: isMobile ? 80 : 120,
      }}
    >
      {/* ambient radial glow + side reds (matches reference) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(0,177,140,0.22) 0%, rgba(0,177,140,0.05) 40%, transparent 70%), radial-gradient(ellipse 30% 80% at 0% 50%, rgba(180,30,40,0.18), transparent 60%), radial-gradient(ellipse 30% 80% at 100% 50%, rgba(180,30,40,0.18), transparent 60%)',
        }}
      />

      <div className="c-container relative">
        <div
          ref={stageRef}
          className="relative mx-auto"
          style={{
            width: '100%',
            maxWidth: 1200,
            height: isMobile ? 600 : 760,
          }}
        >
          {/* faint orbit rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border"
                style={{
                  borderColor: 'rgba(255,251,235,0.04)',
                  width: `${28 + i * 22}%`,
                  aspectRatio: '1',
                }}
              />
            ))}
          </div>

          {/* center hero */}
          <div
            className="absolute left-1/2 top-1/2 text-center px-6"
            style={{ transform: 'translate(-50%, -50%)', zIndex: 10, maxWidth: 520 }}
          >
            <div className="flex justify-center mb-6">
              <img
                src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
                alt="Compuse"
                style={{ height: isMobile ? 44 : 56, filter: 'drop-shadow(0 0 40px rgba(0,177,140,0.5))' }}
              />
            </div>
            <h1
              className="font-display font-bold leading-[1.02]"
              style={{ fontSize: isMobile ? 'clamp(1.8rem, 8vw, 2.6rem)' : 'clamp(2.4rem, 4.2vw, 3.6rem)' }}
            >
              Proteja sua música<br />
              <span style={{ color: 'var(--c-primary)' }}>com você no controle.</span>
            </h1>
            <p
              className="mt-5 text-sm md:text-base"
              style={{ color: 'var(--c-text-muted)' }}
            >
              Registro autoral, hash, timestamp e certificado em minutos.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onPrimary} className="c-btn c-btn-primary">
                Registrar agora <ArrowRight size={16} />
              </button>
              <button onClick={onSecondary} className="c-btn c-btn-secondary">
                Como funciona
              </button>
            </div>
          </div>

          {/* orbit items */}
          {items.map((it) => {
            const rad = (it.angle * Math.PI) / 180;
            // stage is wider than tall — use width fraction for X, scaled for Y
            const baseX = 50 + Math.cos(rad) * it.radius;
            const baseY = 50 + Math.sin(rad) * it.radius * 0.85;

            // collapse toward center based on convergeT
            const collapseFactor = 1 - convergeT * 0.55;
            const cx = 50 + (baseX - 50) * collapseFactor;
            const cy = 50 + (baseY - 50) * collapseFactor;

            // mouse parallax (opposite direction for depth feel)
            const off = isMobile ? 0 : depthOffset[it.depth];
            const tx = -mouse.dx * off;
            const ty = -mouse.dy * off;

            // scroll reveal
            const visible = mounted && p >= it.revealAt - 0.02;
            const opacity = visible ? 1 : 0.0;
            const scaleIn = visible ? 1 : 0.7;
            const hoverScale = hovered === it.id ? 1.12 : 1;

            const size = isMobile ? Math.max(44, it.size * 0.72) : it.size;
            const fontSize = it.fontSize ?? (size > 70 ? 13 : 11);

            // continuous float via inline keyframe vars
            const floatDur = 6 + it.depth * 2;
            const floatDelay = (it.angle / 360) * 4;

            return (
              <div
                key={it.id}
                className="orbit-item"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: size,
                  height: size,
                  opacity,
                  transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scaleIn * hoverScale})`,
                  transition:
                    'transform .65s var(--ease-premium), opacity .9s var(--ease-premium), box-shadow .35s ease, border-color .35s ease, background .35s ease',
                  fontSize,
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: 'var(--c-text-muted)',
                  animation: `orbit-float ${floatDur}s ease-in-out ${floatDelay}s infinite`,
                  zIndex: it.depth,
                }}
                onMouseEnter={() => setHovered(it.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span style={{ pointerEvents: 'none' }}>{it.label}</span>

                {hovered === it.id && (
                  <div
                    className="absolute whitespace-nowrap text-xs px-3 py-2 rounded-lg pointer-events-none"
                    style={{
                      bottom: 'calc(100% + 10px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--c-bg-deep)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text)',
                      maxWidth: 240,
                      whiteSpace: 'normal',
                      width: 'max-content',
                      zIndex: 50,
                      letterSpacing: 0,
                      fontWeight: 400,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {it.tooltip}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
