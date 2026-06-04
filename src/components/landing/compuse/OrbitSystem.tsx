import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onPrimary?: () => void;
  onSecondary?: () => void;
}

type ItemKind = 'label' | 'avatar';

interface OrbitItem {
  id: string;
  kind: ItemKind;
  label: string;
  tooltip: string;
  size: number;
  avatarUrl?: string;
}

interface RingConfig {
  diameter: number;          // % of stage size
  baseDuration: number;      // seconds for full rotation at speed 1
  direction: 'cw' | 'ccw';
  labels: Omit<OrbitItem, 'kind' | 'avatarUrl'>[];
  /** how many slots in this ring should host composer avatars */
  avatarSlots: number;
}

const ringsConfig: RingConfig[] = [
  {
    diameter: 145,
    baseDuration: 140,
    direction: 'cw',
    avatarSlots: 5,
    labels: [
      { id: 'isrc',  label: 'ISRC',  tooltip: 'Código do fonograma.',              size: 112 },
      { id: 'iswc',  label: 'ISWC',  tooltip: 'Código da composição.',             size: 70 },
      { id: 'ismn',  label: 'ISMN',  tooltip: 'Código de publicação musical.',     size: 96 },
      { id: 'isan',  label: 'ISAN',  tooltip: 'Identificador audiovisual.',        size: 62 },
      { id: 'ipi',   label: 'IPI',   tooltip: 'Identificador de autor.',           size: 124 },
      { id: 'ean',   label: 'EAN',   tooltip: 'Código de barras internacional.',   size: 68 },
      { id: 'istc',  label: 'ISTC',  tooltip: 'Identificador de obras textuais.',  size: 88 },
      { id: 'ddex',  label: 'DDEX',  tooltip: 'Padrão de metadados musicais.',     size: 104 },
      { id: 'wipo',  label: 'WIPO',  tooltip: 'Propriedade intelectual mundial.',  size: 76 },
      { id: 'mlc',   label: 'MLC',   tooltip: 'Mechanical Licensing Collective.',  size: 94 },
      { id: 'bmi',   label: 'BMI',   tooltip: 'Sociedade de direitos EUA.',        size: 60 },
      { id: 'upc',   label: 'UPC',   tooltip: 'Código universal de produto.',      size: 100 },
    ],
  },
  {
    diameter: 102,
    baseDuration: 105,
    direction: 'ccw',
    avatarSlots: 4,
    labels: [
      { id: 'hash',   label: 'HASH',         tooltip: 'Impressão digital única da obra.',  size: 82 },
      { id: 'time',   label: 'TIMESTAMP',    tooltip: 'Data e hora certificadas.',         size: 108 },
      { id: 'cert',   label: 'CERTIFICADO',  tooltip: 'PDF jurídico em até 5 minutos.',    size: 68 },
      { id: 'dist',   label: 'DISTRIBUIÇÃO', tooltip: 'Spotify, YouTube e mais.',          size: 116 },
      { id: 'ecad',   label: 'ECAD',         tooltip: 'Arrecadação no Brasil.',            size: 60 },
      { id: 'royal',  label: 'ROYALTIES',    tooltip: 'Direitos de execução pública.',     size: 98 },
      { id: 'pro',    label: 'PRO',          tooltip: 'Performing Rights Org.',            size: 78 },
      { id: 'da',     label: 'DA',           tooltip: 'Direitos autorais.',                size: 56 },
      { id: 'pdf',    label: 'PDF',          tooltip: 'Certificado oficial em PDF.',       size: 86 },
      { id: 'labels', label: '9 LABELS',     tooltip: 'Distribuímos para 9 grandes labels.', size: 92 },
    ],
  },
  {
    diameter: 62,
    baseDuration: 85,
    direction: 'cw',
    avatarSlots: 2,
    labels: [
      { id: 'letra',  label: 'LETRA',     tooltip: 'Sua letra protegida juridicamente.', size: 68 },
      { id: 'audio',  label: 'ÁUDIO',     tooltip: 'Áudio com hash único e timestamp.',  size: 90 },
      { id: 'autor',  label: 'AUTOR',     tooltip: 'Titularidade registrada.',           size: 58 },
      { id: 'obra',   label: 'OBRA',      tooltip: 'Obra original protegida.',           size: 82 },
      { id: 'blockc', label: 'BLOCKCHAIN', tooltip: 'Selo imutável em blockchain.',      size: 100 },
      { id: 'meta',   label: 'METADATA',  tooltip: 'Metadados completos da obra.',       size: 70 },
    ],
  },
];

interface Composer { name: string; avatar_url: string; }

export const OrbitSystem: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const [mouse, setMouse] = useState({ dx: 0, dy: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [composers, setComposers] = useState<Composer[]>([]);

  // mobile detect
  useEffect(() => {
    const m = window.matchMedia('(max-width: 768px)');
    const u = () => setIsMobile(m.matches);
    u(); m.addEventListener('change', u);
    return () => m.removeEventListener('change', u);
  }, []);

  // fetch composer avatars
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_landing_composer_avatars', { limit_count: 24 });
        if (!error && alive && Array.isArray(data)) {
          const filtered = (data as Composer[]).filter(
            (c) => c.avatar_url && /^https?:\/\//.test(c.avatar_url),
          );
          setComposers(filtered);
        }
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, []);

  // Build ring items mixing avatars in pre-defined slots
  const rings = useMemo(() => {
    let pool = [...composers];
    return ringsConfig.map((ring) => {
      const items: OrbitItem[] = ring.labels.map((l) => ({ ...l, kind: 'label' }));
      const slots = Math.min(ring.avatarSlots, pool.length);
      // Distribute avatars evenly across the ring
      const step = items.length / Math.max(1, slots);
      for (let i = 0; i < slots; i++) {
        const composer = pool.shift();
        if (!composer) break;
        const idx = Math.floor(i * step + step / 2) % items.length;
        items[idx] = {
          id: `composer-${composer.avatar_url}`,
          kind: 'avatar',
          label: composer.name,
          tooltip: `Compositor(a) ${composer.name} — registrado(a) na Compuse.`,
          size: ring.diameter > 100 ? 84 : ring.diameter > 80 ? 80 : 74,
          avatarUrl: composer.avatar_url,
        };
      }
      return { ...ring, items };
    });
  }, [composers]);

  // refs for mouse parallax target (no React state — avoids re-renders)
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // normalized -1..1, gentle range
      mouseTargetRef.current.x = (e.clientX / w) * 2 - 1;
      mouseTargetRef.current.y = (e.clientY / h) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  // JS-driven rotation + parallax in a single RAF for buttery smoothness
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const angles = rings.map(() => 0);
    let lastScrollY = window.scrollY;
    let scrollBoost = 1;
    let targetBoost = 1;
    const MAX_PARALLAX = 10; // px — subtle premium feel

    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      // small impulses; clamp gently. Down speeds up, up slows down.
      const impulse = Math.max(-0.8, Math.min(0.8, dy / 60));
      targetBoost = Math.max(0.55, Math.min(1.85, targetBoost + impulse));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      // very gentle easing of boost toward target, target decays slowly to 1
      scrollBoost += (targetBoost - scrollBoost) * Math.min(1, dt * 2.2);
      targetBoost += (1 - targetBoost) * Math.min(1, dt * 0.9);

      // smooth mouse parallax (low-pass filter) — premium float
      const ease = Math.min(1, dt * 3.2);
      mouseCurrentRef.current.x += (mouseTargetRef.current.x - mouseCurrentRef.current.x) * ease;
      mouseCurrentRef.current.y += (mouseTargetRef.current.y - mouseCurrentRef.current.y) * ease;
      const px = -mouseCurrentRef.current.x * MAX_PARALLAX;
      const py = -mouseCurrentRef.current.y * MAX_PARALLAX;
      const stage = stageRef.current;
      if (stage) {
        stage.style.transform = `translate(-50%, -50%) translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
      }

      rings.forEach((ring, i) => {
        const dirSign = ring.direction === 'cw' ? 1 : -1;
        const speedDegPerSec = (360 / ring.baseDuration) * scrollBoost * dirSign;
        angles[i] = (angles[i] + speedDegPerSec * dt) % 360;
        const el = ringRefs.current[i];
        if (el) el.style.transform = `translate(-50%, -50%) rotate(${angles[i]}deg)`;
        const counters = counterRefs.current[i];
        if (counters) {
          const inv = -angles[i];
          for (const c of counters) {
            if (c) c.style.transform = `rotate(${inv}deg)`;
          }
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [rings]);

  const stageSize = isMobile ? 'min(170vw, 820px)' : 'min(125vmin, 1400px)';

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
            'radial-gradient(ellipse 45% 55% at 50% 50%, rgba(0,177,140,0.45) 0%, rgba(0,140,110,0.20) 35%, rgba(0,90,70,0.08) 60%, transparent 78%), radial-gradient(ellipse 60% 90% at 0% 50%, rgba(4,40,32,0.85), transparent 65%), radial-gradient(ellipse 60% 90% at 100% 50%, rgba(4,40,32,0.85), transparent 65%), radial-gradient(circle at 50% 100%, rgba(5,20,16,0.9), transparent 70%)',
        }}
      />

      {/* Stage */}
      <div
        ref={stageRef}
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: stageSize,
          height: stageSize,
          transform: `translate(-50%, -50%) translate(${-mouse.dx * 16}px, ${-mouse.dy * 16}px)`,
          transition: 'transform .8s var(--ease-premium)',
        }}
      >
        {/* guide rings */}
        {rings.map((r, i) => (
          <div
            key={`g${i}`}
            className="absolute rounded-full border"
            style={{
              left: '50%', top: '50%',
              width: `${r.diameter}%`, height: `${r.diameter}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: 'rgba(255,251,235,0.04)',
            }}
          />
        ))}

        {rings.map((ring, ri) => {
          counterRefs.current[ri] = counterRefs.current[ri] || [];
          return (
            <div
              key={`ring-${ri}`}
              ref={(el) => (ringRefs.current[ri] = el)}
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                width: `${ring.diameter}%`,
                height: `${ring.diameter}%`,
                transform: 'translate(-50%, -50%)',
                willChange: 'transform',
              }}
            >
              {ring.items.map((it, idx) => {
                const angle = (idx / ring.items.length) * 360;
                const rad = (angle * Math.PI) / 180;
                const x = 50 + 50 * Math.cos(rad);
                const y = 50 + 50 * Math.sin(rad);
                const size = isMobile ? Math.max(48, it.size * 0.7) : it.size;
                const fontSize = size > 80 ? 12 : 11;
                const isH = hovered === it.id;
                const isAvatar = it.kind === 'avatar';
                return (
                  <div
                    key={it.id}
                    ref={(el) => {
                      const arr = counterRefs.current[ri]!;
                      arr[idx] = el;
                    }}
                    className="orbit-item pointer-events-auto"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      marginLeft: -size / 2,
                      marginTop: -size / 2,
                      fontSize,
                      fontFamily: 'Space Grotesk, sans-serif',
                      letterSpacing: isAvatar ? 0 : 1,
                      color: 'var(--c-text-muted)',
                      zIndex: 3 - ri,
                      overflow: 'hidden',
                      padding: 0,
                      background: isAvatar
                        ? 'rgba(255,255,255,0.04)'
                        : undefined,
                      borderColor: isAvatar ? 'rgba(0,177,140,0.35)' : undefined,
                      boxShadow: isAvatar ? '0 0 18px rgba(0,177,140,0.18)' : undefined,
                    }}
                    onMouseEnter={() => setHovered(it.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {isAvatar ? (
                      <img
                        src={it.avatarUrl}
                        alt={it.label}
                        loading="lazy"
                        draggable={false}
                        onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          borderRadius: '999px', pointerEvents: 'none',
                          filter: 'grayscale(15%) contrast(1.05)',
                        }}
                      />
                    ) : (
                      <span style={{ pointerEvents: 'none' }}>{it.label}</span>
                    )}
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

      {/* Bottom fade — blends hero into next section without a hard edge */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          height: isMobile ? 180 : 260,
          background:
            'linear-gradient(to bottom, rgba(21,21,21,0) 0%, rgba(21,21,21,0.55) 45%, rgba(10,10,10,0.95) 85%, #0a0a0a 100%)',
          zIndex: 5,
        }}
      />

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
