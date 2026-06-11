import { supabase } from '@/integrations/supabase/client';

export function slugifyPart(s?: string | null): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export function buildPreviewSlugBase(clientName?: string | null, projectTitle?: string | null): string {
  const music = slugifyPart(projectTitle);
  const client = slugifyPart(clientName);
  const parts = ['previa', music, client].filter(Boolean);
  const base = parts.join('-');
  return base || 'previa';
}

/**
 * Ensures slug is unique in music_previews; if taken, appends -2, -3...
 * Pass excludeId to ignore the current row when updating.
 */
export async function generateUniquePreviewSlug(
  clientName?: string | null,
  projectTitle?: string | null,
  excludeId?: string,
): Promise<string> {
  const base = buildPreviewSlugBase(clientName, projectTitle);
  let candidate = base;
  let n = 2;
  // try a few times
  while (true) {
    let q = supabase.from('music_previews').select('id').eq('slug', candidate).limit(1);
    if (excludeId) q = q.neq('id', excludeId);
    const { data, error } = await q;
    if (error) return candidate;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${n++}`;
    if (n > 50) return `${base}-${Date.now()}`;
  }
}
