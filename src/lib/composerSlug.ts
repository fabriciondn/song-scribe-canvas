export function slugifyFirstName(fullName?: string | null): string {
  if (!fullName) return '';
  const first = fullName.trim().split(/\s+/)[0] || '';
  return first
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export function buildComposerSlug(fullName?: string | null, cpf?: string | null): string | null {
  const name = slugifyFirstName(fullName);
  const digits = (cpf || '').replace(/\D/g, '');
  if (!name || digits.length < 4) return null;
  return `${name}-${digits.slice(-4)}`;
}

export function buildComposerPublicUrl(fullName?: string | null, cpf?: string | null): string | null {
  const slug = buildComposerSlug(fullName, cpf);
  if (!slug) return null;
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://compuse.com.br';
  return `${origin}/${slug}`;
}
