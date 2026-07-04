import React from 'react';
import { Music, Lock } from 'lucide-react';
import {
  CheckoutConfig,
  DEFAULT_CONFIG,
  CustomTextBlock,
  BlockId,
  interpolate,
  ensureOrderIntegrity,
} from '@/lib/previewCheckoutConfig';
import { CoverSlideshow } from './CoverSlideshow';

/**
 * Renderer visual do checkout de prévia. Recebe uma config já mesclada
 * (template + override) e um conjunto de "slots" a serem exibidos nas
 * posições dos blocos dinâmicos (tracks / bonus / upsell / custom:*).
 *
 * Usado tanto na página pública quanto no preview do editor.
 */
export interface CheckoutRendererProps {
  clientName: string;
  projectTitle?: string | null;
  bannerUrl?: string | null;
  config: typeof DEFAULT_CONFIG | CheckoutConfig;
  slots: Partial<Record<'tracks' | 'bonus' | 'upsell', React.ReactNode>>;
  footer?: React.ReactNode;
  contentBefore?: React.ReactNode; // ex: player de faixas antes do checkout
  showCover?: boolean; // controla exibição da capa quadrada (single/slide)
}

const variantClasses: Record<NonNullable<CustomTextBlock['variant']>, string> = {
  default: 'border-border bg-card',
  highlight: 'border-primary/40 bg-primary/10',
  success: 'border-green-500/40 bg-green-500/10',
  warning: 'border-yellow-500/40 bg-yellow-500/10',
};

function CustomBlockCard({ block }: { block: CustomTextBlock }) {
  const cls = variantClasses[block.variant || 'default'];
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      {block.title && <div className="font-semibold mb-1">{block.title}</div>}
      {block.text && (
        <div className="text-sm whitespace-pre-wrap opacity-90">{block.text}</div>
      )}
    </div>
  );
}

export const CheckoutRenderer: React.FC<CheckoutRendererProps> = ({
  clientName,
  projectTitle,
  bannerUrl,
  config,
  slots,
  footer,
  contentBefore,
  showCover = true,
}) => {
  const cfg = { ...DEFAULT_CONFIG, ...config } as typeof DEFAULT_CONFIG;
  const order = ensureOrderIntegrity(cfg.order || [], cfg.customBlocks || []);
  const headline = interpolate(cfg.headline || '', {
    client_name: clientName,
    project_title: projectTitle ?? '',
  });
  const subheadline = interpolate(cfg.subheadline || '', {
    client_name: clientName,
    project_title: projectTitle ?? '',
  });

  const cssVars: React.CSSProperties = {};
  if (cfg.primary) (cssVars as any)['--pcx-primary'] = cfg.primary;
  if (cfg.bg) {
    (cssVars as any)['--pcx-bg'] = cfg.bg;
    cssVars.backgroundColor = cfg.bg;
  }
  if (cfg.fg) {
    (cssVars as any)['--pcx-fg'] = cfg.fg;
    cssVars.color = cfg.fg;
  }

  const renderBlock = (id: BlockId) => {
    if (id === 'tracks') return slots.tracks ?? null;
    if (id === 'bonus') return slots.bonus ?? null;
    if (id === 'upsell') return slots.upsell ?? null;
    if (id.startsWith('custom:')) {
      const cid = id.slice('custom:'.length);
      const block = (cfg.customBlocks || []).find((b) => b.id === cid);
      return block ? <CustomBlockCard block={block} /> : null;
    }
    return null;
  };

  // Se o admin não configurou cores, usa fundo claro fixo (independente do tema do app)
  const baseClass = cfg.bg
    ? 'min-h-full py-6 px-4 select-none'
    : 'min-h-full py-6 px-4 select-none bg-white text-slate-900';

  return (
    <div className={baseClass} style={cssVars}>
      <div className="max-w-2xl mx-auto space-y-5">
        {bannerUrl ? (
          <div className="rounded-2xl overflow-hidden border border-border">
            <img
              src={bannerUrl}
              alt="Banner"
              className="w-full h-auto object-cover max-h-64"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ) : null}

        {(() => {
          const isSlide = cfg.coverType === 'slide';
          const slideImgs = (cfg.coverUrls || []).filter(Boolean);
          if (isSlide && slideImgs.length > 0) {
            return <CoverSlideshow images={slideImgs} />;
          }
          if (cfg.coverUrl) {
            return (
              <div className="flex justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-border shadow-lg">
                  <img
                    src={cfg.coverUrl}
                    alt="Capa da música"
                    className="w-full h-full object-cover"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              </div>
            );
          }
          if (!bannerUrl) {
            return (
              <div className="flex justify-center">
                <div
                  className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary"
                  style={cfg.primary ? { background: `${cfg.primary}22`, color: cfg.primary } : undefined}
                >
                  <Music className="h-7 w-7" />
                </div>
              </div>
            );
          }
          return null;
        })()}

        <header className="text-center space-y-1">
          {headline && (
            <h1 className="text-2xl sm:text-3xl font-bold">{headline}</h1>
          )}
          {subheadline && (
            <p className="opacity-70">{subheadline}</p>
          )}
        </header>

        {contentBefore}

        <div className="space-y-4">
          {order.map((id) => (
            <React.Fragment key={id}>{renderBlock(id)}</React.Fragment>
          ))}
        </div>

        {footer ?? (
          <footer className="text-center text-xs opacity-60 pt-4">
            <Lock className="inline h-3 w-3 mr-1" />
            Reprodução limitada nas prévias. Download apenas após pagamento.
          </footer>
        )}
      </div>
    </div>
  );
};
