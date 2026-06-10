import { supabase } from "@/integrations/supabase/client";

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL = 3600; // 1h
const CACHE_TTL_MS = 50 * 60 * 1000; // 50min

/**
 * Generate a signed URL for a private bucket object, cached in-memory.
 * Falls back to public URL when signing fails (e.g. bucket still public during transition).
 */
export async function getSignedUrl(
  bucket: string,
  path: string | null | undefined,
  ttlSeconds: number = DEFAULT_TTL
): Promise<string> {
  if (!path) return "";
  const key = `${bucket}:${path}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds);

  if (error || !data?.signedUrl) {
    // Fallback to public URL (safe — if bucket is private, this just won't load)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return pub.publicUrl;
  }

  cache.set(key, { url: data.signedUrl, expiresAt: now + CACHE_TTL_MS });
  return data.signedUrl;
}

/** Convenience wrapper for the author-registrations bucket. */
export const getAuthorRegistrationUrl = (path: string | null | undefined, ttl?: number) =>
  getSignedUrl("author-registrations", path, ttl);
