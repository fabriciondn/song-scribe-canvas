// Configuração de checkout personalizada para prévias musicais.

export type BlockId = 'tracks' | 'bonus' | 'upsell' | `custom:${string}`;

export interface CustomTextBlock {
  id: string;
  title?: string;
  text?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export interface CheckoutConfig {
  primary?: string;        // cor primária (hex)
  bg?: string;             // cor de fundo (hex)
  fg?: string;             // cor do texto (hex)
  headline?: string;       // {client_name} e {project_title} são substituídos
  subheadline?: string;
  ctaLabel?: string;

  bonusEnabled?: boolean;
  bonusTitle?: string;
  bonusText?: string;

  upsellEnabled?: boolean;
  upsellTitle?: string;
  upsellText?: string;
  upsellBadge?: string;
  upsellPriceLabel?: string;      // ex: "R$ 19,99"
  upsellOldPriceLabel?: string;   // ex: "R$ 40,00"

  customBlocks?: CustomTextBlock[];
  order?: BlockId[];       // ordem dos blocos exibidos na etapa de checkout
}

export const DEFAULT_CONFIG: Required<Omit<CheckoutConfig, 'customBlocks' | 'order'>> & {
  customBlocks: CustomTextBlock[];
  order: BlockId[];
} = {
  primary: '#22c55e',
  bg: '#0a0a0a',
  fg: '#fafafa',
  headline: 'Prévia para {client_name}',
  subheadline: '{project_title}',
  ctaLabel: 'Gerar PIX e liberar download',
  bonusEnabled: true,
  bonusTitle: 'Bônus grátis: Playback da sua faixa',
  bonusText:
    'Você ganha o playback de cada faixa escolhida sem custo. Nossa equipe envia diretamente no seu WhatsApp após a confirmação do pagamento.',
  upsellEnabled: true,
  upsellTitle: '🎉 Uau, sua música ficou incrível!',
  upsellText:
    'Aproveite e proteja sua música com nosso Registro Autoral com validade jurídica — só nesta página por R$ 19,99 (de R$ 40,00).',
  upsellBadge: 'Oferta exclusiva',
  upsellPriceLabel: 'R$ 19,99',
  upsellOldPriceLabel: 'R$ 40,00',
  customBlocks: [],
  order: ['tracks', 'bonus', 'upsell'],
};

export function mergeConfig(
  template: CheckoutConfig | null | undefined,
  override: CheckoutConfig | null | undefined,
): typeof DEFAULT_CONFIG {
  const t = template || {};
  const o = override || {};
  const merged: any = { ...DEFAULT_CONFIG, ...t, ...o };
  // customBlocks: override wins se definido, senão template, senão default
  merged.customBlocks =
    o.customBlocks ?? t.customBlocks ?? DEFAULT_CONFIG.customBlocks;
  merged.order = o.order ?? t.order ?? DEFAULT_CONFIG.order;
  return merged;
}

export function interpolate(
  str: string,
  vars: { client_name?: string; project_title?: string | null },
): string {
  return (str || '')
    .replaceAll('{client_name}', vars.client_name || '')
    .replaceAll('{project_title}', vars.project_title || '');
}

export function ensureOrderIntegrity(
  order: BlockId[],
  customBlocks: CustomTextBlock[],
): BlockId[] {
  const base: BlockId[] = ['tracks', 'bonus', 'upsell'];
  const customIds: BlockId[] = customBlocks.map((c) => `custom:${c.id}` as BlockId);
  const known = new Set<BlockId>([...base, ...customIds]);
  const cleaned = order.filter((id) => known.has(id));
  // adiciona os que não estavam na ordem no fim
  for (const id of [...base, ...customIds]) {
    if (!cleaned.includes(id)) cleaned.push(id);
  }
  return cleaned;
}
