import React, { useEffect, useRef, useState } from 'react';
import { Shield, Music, FileCheck, MessageCircle, Cloud, Radio, Award, Globe } from 'lucide-react';
import { Reveal } from './Reveal';

interface OrbitItem {
  id: string;
  type: 'label' | 'icon';
  text?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  tooltip: string;
  // base position in percent of container
  x: number;
  y: number;
  size: number;
  depth: 1 | 2 | 3;
}

const items: OrbitItem[] = [
  { id: 'isrc', type: 'label', text: 'ISRC', tooltip: 'Código do fonograma para distribuição musical.', x: 18, y: 22, size: 76, depth: 2 },
  { id: 'upc', type: 'label', text: 'UPC', tooltip: 'Código do lançamento musical.', x: 82, y: 28, size: 70, depth: 1 },
  { id: 'hash', type: 'label', text: 'HASH', tooltip: 'Identificador digital único da sua obra.', x: 12, y: 60, size: 84, depth: 3 },
  { id: 'pdf', type: 'label', text: 'PDF', tooltip: 'Certificado de registro autoral.', x: 88, y: 64, size: 68, depth: 2 },
  { id: 'ecad', type: 'label', text: 'ECAD', tooltip: 'Gestão de direitos e arrecadação.', x: 28, y: 84, size: 72, depth: 1 },
  { id: 'da', type: 'label', text: 'DA', tooltip: 'Direitos autorais protegidos.', x: 72, y: 86, size: 64, depth: 3 },
  { id: 'shield', type: 'icon', icon: Shield, tooltip: 'Proteção jurídica completa.', x: 32, y: 12, size: 64, depth: 3 },
  { id: 'music', type: 'icon', icon: Music, tooltip: 'Letra e áudio registrados.', x: 64, y: 14, size: 60, depth: 1 },
  { id: 'cert', type: 'icon', icon: FileCheck, tooltip: 'Certificado emitido em minutos.', x: 8, y: 40, size: 60, depth: 2 },
  { id: 'whats', type: 'icon', icon: MessageCircle, tooltip: 'Atendimento humano pelo WhatsApp.', x: 92, y: 44, size: 60, depth: 3 },
  { id: 'cloud', type: 'icon', icon: Cloud, tooltip: 'Armazenamento seguro na nuvem.', x: 48, y: 6, size: 56, depth: 2 },
  { id: 'radio', type: 'icon', icon: Radio, tooltip: 'Distribuição em plataformas digitais.', x: 50, y: 94, size: 56, depth: 1 },
  { id: 'award', type: 'icon', icon: Award, tooltip: 'Autoria reconhecida.', x: 22, y: 48, size: 56, depth: 1 },
  { id: 'globe', type: 'icon', icon: Globe, tooltip: 'Validade internacional em 175+ países.', x: 78, y: 50, size: 56, depth: 2 },
];

const depthOffset = { 1: 8, 2: 16, 3: 28 } as const;

export const OrbitSystem: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ dx: 0, dy: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
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
    const onMove = (e: MouseEvent) => {
      if (isMobile) return;
      const el = stageRef.current;
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        setMouse({ dx: (e.clientX - cx) / r.width, dy: (e.clientY - cy) / r.height });
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
      const start = vh;
      const end = -r.height;
      const total = start - end;
      const raw = (start - r.top) / total;
      const p = Math.max(0, Math.min(1, raw));
      setScrollProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ease in-out for converge: items pull toward center at mid-scroll then redistribute
  const convergeAmount = (() => {
    const p = scrollProgress;
    // peak at 0.5, returns 0 at extremes, 1 at middle
    return Math.sin(Math.PI * p) * 0.55;
  })();

  return (
    <section
      id="registro"
      ref={sectionRef}
      className="relative py-24 md:py-32"
      style={{ background: 'var(--c-bg-deep)' }}
    >
      {/* circular pattern bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(0,177,140,0.06) 0%, transparent 60%), repeating-radial-gradient(circle at 50% 50%, rgba(255,251,235,0.025) 0px, rgba(255,251,235,0.025) 1px, transparent 1px, transparent 90px)',
        }}
      />

      <div className="c-container relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
              style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface-soft)', color: 'var(--c-text-muted)' }}>
              Da letra ao certificado
            </div>
            <h2 className="font-display font-bold leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Tudo que protege sua música em{' '}
              <span style={{ color: 'var(--c-primary)' }}>um só lugar</span>
            </h2>
            <p className="mt-6 text-lg" style={{ color: 'var(--c-text-muted)' }}>
              Uma rede viva conectando autoria, prova digital e distribuição.
            </p>
          </div>
        </Reveal>

        <div
          ref={stageRef}
          className="relative mx-auto"
          style={{
            width: '100%',
            maxWidth: 980,
            height: isMobile ? 560 : 720,
          }}
        >
          {/* orbit rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border"
                style={{
                  borderColor: 'rgba(255,251,235,0.06)',
                  width: `${30 + i * 18}%`,
                  aspectRatio: '1',
                }}
              />
            ))}
          </div>

          {/* center */}
          <div className="orbit-center font-display">
            <div className="text-center">
              <div style={{ fontSize: 14, color: 'var(--c-primary)', letterSpacing: 2, fontWeight: 500 }}>COMPUSE</div>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4, fontWeight: 400 }}>rede de proteção</div>
            </div>
          </div>

          {items.map((it) => {
            // base position
            const baseX = it.x;
            const baseY = it.y;
            // converge toward 50,50
            const cx = baseX + (50 - baseX) * convergeAmount;
            const cy = baseY + (50 - baseY) * convergeAmount;
            const off = isMobile ? depthOffset[it.depth] * 0.3 : depthOffset[it.depth];
            const tx = mouse.dx * off;
            const ty = mouse.dy * off;

            const Icon = it.icon;
            const size = isMobile ? it.size * 0.75 : it.size;

            return (
              <div
                key={it.id}
                className="orbit-item"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: size,
                  height: size,
                  transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${hovered === it.id ? 1.08 : 1})`,
                  transition: 'transform .65s var(--ease-premium), box-shadow .35s ease, border-color .35s ease, background .35s ease',
                  fontSize: it.type === 'label' ? (size > 70 ? 14 : 12) : undefined,
                  fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: it.type === 'label' ? 1 : undefined,
                  animation: `orbit-float ${6 + (it.depth * 2)}s ease-in-out infinite`,
                  animationDelay: `${it.id.charCodeAt(0) * 0.05}s`,
                }}
                onMouseEnter={() => setHovered(it.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {it.type === 'label' ? (
                  <span>{it.text}</span>
                ) : (
                  Icon && <Icon size={size * 0.4} style={{ color: 'var(--c-primary)' }} />
                )}

                {hovered === it.id && (
                  <div
                    className="absolute whitespace-nowrap text-xs px-3 py-2 rounded-lg pointer-events-none"
                    style={{
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--c-bg-deep)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text)',
                      maxWidth: 220,
                      whiteSpace: 'normal',
                      width: 'max-content',
                      zIndex: 20,
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
