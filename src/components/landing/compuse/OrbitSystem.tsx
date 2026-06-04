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
  size: number;
}

interface Ring {
  /** ring diameter as % of stage square size */
  diameter: number;
  /** rotation duration in seconds */
  duration: number;
  /** rotation direction */
  direction: 'cw' | 'ccw';
  items: OrbitItem[];
}

// Three concentric rings — outer CW, middle CCW, inner CW (per spec)
const rings: Ring[] = [
  {
    diameter: 135, // outer extends past hero edges
    duration: 110,
    direction: 'cw',
    items: [
      { id: 'isrc',   label: 'ISRC',        tooltip: 'Código do fonograma.',              size: 84 },
      { id: 'iswc',   label: 'ISWC',        tooltip: 'Código da composição.',             size: 76 },
      { id: 'ismn',   label: 'ISMN',        tooltip: 'Código de publicação musical.',     size: 80 },
      { id: 'isan',   label: 'ISAN',        tooltip: 'Identificador audiovisual.',        size: 84 },
      { id: 'ipi',    label: 'IPI',         tooltip: 'Identificador de autor.',           size: 72 },
      { id: 'ean',    label: 'EAN',         tooltip: 'Código de barras internacional.',   size: 78 },
      { id: 'istc',   label: 'ISTC',        tooltip: 'Identificador de obras textuais.',  size: 76 },
      { id: 'ddex',   label: 'DDEX',        tooltip: 'Padrão de metadados musicais.',     size: 80 },
      { id: 'wipo',   label: 'WIPO',        tooltip: 'Propriedade intelectual mundial.',  size: 84 },
      { id: 'mlc',    label: 'MLC',         tooltip: 'Mechanical Licensing Collective.',  size: 72 },
      { id: 'bmi',    label: 'BMI',         tooltip: 'Sociedade de direitos EUA.',        size: 72 },
      { id: 'upc',    label: 'UPC',         tooltip: 'Código universal de produto.',      size: 76 },
    ],
  },
  {
    diameter: 95,
    duration: 85,
    direction: 'ccw',
    items: [
      { id: 'hash',   label: 'HASH',        tooltip: 'Impressão digital única da obra.',  size: 78 },
      { id: 'time',   label: 'TIMESTAMP',   tooltip: 'Data e hora certificadas.',         size: 88 },
      { id: 'cert',   label: 'CERTIFICADO', tooltip: 'PDF jurídico em até 5 minutos.',    size: 92 },
      { id: 'dist',   label: 'DISTRIBUIÇÃO',tooltip: 'Spotify, YouTube e mais.',          size: 96 },
      { id: 'ecad',   label: 'ECAD',        tooltip: 'Arrecadação no Brasil.',            size: 76 },
      { id: 'royal',  label: 'ROYALTIES',   tooltip: 'Direitos de execução pública.',     size: 86 },
      { id: 'pro',    label: 'PRO',         tooltip: 'Performing Rights Org.',            size: 70 },
      { id: 'da',     label: 'DA',          tooltip: 'Direitos autorais.',                size: 70 },
      { id: 'pdf',    label: 'PDF',         tooltip: 'Certificado oficial em PDF.',       size: 70 },
      { id: 'labels', label: '9 LABELS',    tooltip: 'Distribuímos para 9 grandes labels.', size: 82 },
    ],
  },
  {
    diameter: 58,
    duration: 60,
    direction: 'cw',
    items: [
      { id: 'letra',  label: 'LETRA',     tooltip: 'Sua letra protegida juridicamente.', size: 74 },
      { id: 'audio',  label: 'ÁUDIO',     tooltip: 'Áudio com hash único e timestamp.',  size: 74 },
      { id: 'autor',  label: 'AUTOR',     tooltip: 'Titularidade registrada.',           size: 72 },
      { id: 'obra',   label: 'OBRA',      tooltip: 'Obra original protegida.',           size: 72 },
      { id: 'blockc', label: 'BLOCKCHAIN',tooltip: 'Selo imutável em blockchain.',       size: 88, },
      { id: 'meta',   label: 'METADATA',  tooltip: 'Metadados completos da obra.',       size: 82 },
    ],
  },
];

export const OrbitSystem: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ dx: 0, dy: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)));
        setMouse({ dx, dy });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  const stageSize = isMobile ? 'min(140vw, 700px)' : 'min(110vmin, 1100px)';

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: 'var(--c-bg)',
        minHeight: isMobile ? '100svh' : '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(0,177,140,0.22) 0%, rgba(0,177,140,0.05) 40%, transparent 70%), radial-gradient(ellipse 30% 80% at 0% 50%, rgba(180,30,40,0.18), transparent 60%), radial-gradient(ellipse 30% 80% at 100% 50%, rgba(180,30,40,0.18), transparent 60%)',
        }}
      />

      {/* Stage: centered square containing rings */}
      <div
        ref={stageRef}
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: stageSize,
          height: stageSize,
          transform: `translate(-50%, -50%) translate(${-mouse.dx * 18}px, ${-mouse.dy * 18}px)`,
          transition: 'transform .8s var(--ease-premium)',
        }}
      >
        {/* faint guide rings */}
        {rings.map((r, i) => (
          <div
            key={`g${i}`}
            className="absolute rounded-full border"
            style={{
              left: '50%',
              top: '50%',
              width: `${r.diameter}%`,
              height: `${r.diameter}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: 'rgba(255,251,235,0.04)',
            }}
          />
        ))}

        {/* Rotating rings */}
        {rings.map((ring, ri) => {
          const spinAnim = ring.direction === 'cw' ? 'orbit-spin-cw' : 'orbit-spin-ccw';
          const counterAnim = ring.direction === 'cw' ? 'orbit-counter-cw' : 'orbit-counter-ccw';
          const radiusPct = ring.diameter / 2; // % from center
          return (
            <div
              key={`ring-${ri}`}
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                width: `${ring.diameter}%`,
                height: `${ring.diameter}%`,
                transform: 'translate(-50%, -50%)',
                animation: `${spinAnim} ${ring.duration}s linear infinite`,
              }}
            >
              {ring.items.map((it, idx) => {
                const angle = (idx / ring.items.length) * 360;
                const rad = (angle * Math.PI) / 180;
                // Position relative to ring container (which is ring.diameter sized).
                // Center of ring container is at 50%,50%. Items sit on its edge → offset = 50%.
                const x = 50 + 50 * Math.cos(rad);
                const y = 50 + 50 * Math.sin(rad);
                const size = isMobile ? Math.max(48, it.size * 0.7) : it.size;
                const fontSize = size > 80 ? 12 : 11;
                const isH = hovered === it.id;
                return (
                  <div
                    key={it.id}
                    className="orbit-item pointer-events-auto"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      // Counter-rotation keeps label upright while ring spins
                      animation: `${counterAnim} ${ring.duration}s linear infinite`,
                      transformOrigin: 'center',
                      // We need to also offset by -50%,-50% to center on point.
                      // Achieved via margin trick:
                      marginLeft: -size / 2,
                      marginTop: -size / 2,
                      fontSize,
                      fontFamily: 'Space Grotesk, sans-serif',
                      letterSpacing: 1,
                      color: 'var(--c-text-muted)',
                      zIndex: 3 - ri,
                      scale: isH ? '1.12' : '1',
                    }}
                    onMouseEnter={() => setHovered(it.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span style={{ pointerEvents: 'none' }}>{it.label}</span>
                    {isH && (
                      <div
                        className="absolute whitespace-nowrap text-xs px-3 py-2 rounded-lg pointer-events-none"
                        style={{
                          bottom: 'calc(100% + 10px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--c-bg-deep)',
                          border: '1px solid var(--c-border)',
                          color: 'var(--c-text)',
                          whiteSpace: 'normal',
                          width: 'max-content',
                          maxWidth: 220,
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
          );
        })}
      </div>

      {/* center hero content (above rings) */}
      <div className="relative w-full" style={{ zIndex: 10 }}>
        <div className="c-container">
          <div className="text-center mx-auto px-6" style={{ maxWidth: 620 }}>
            <div className="flex justify-center mb-6">
              <img
                src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
                alt="Compuse"
                style={{ height: isMobile ? 48 : 64, filter: 'drop-shadow(0 0 40px rgba(0,177,140,0.55))' }}
              />
            </div>
            <h1
              className="font-display font-bold leading-[1.02]"
              style={{ fontSize: isMobile ? 'clamp(2rem, 9vw, 2.8rem)' : 'clamp(2.6rem, 4.6vw, 4rem)' }}
            >
              Proteja sua música<br />
              <span style={{ color: 'var(--c-primary)' }}>com você no controle.</span>
            </h1>
            <p className="mt-5 text-sm md:text-base" style={{ color: 'var(--c-text-muted)' }}>
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
        </div>
      </div>
    </section>
  );
};
