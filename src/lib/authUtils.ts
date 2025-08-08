import { supabase } from '@/integrations/supabase/client';

// Rate limiting control
interface RateLimitState {
  lastCall: number;
  callCount: number;
  isBlocked: boolean;
  blockUntil: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<T>;

  const debounced = ((...args: Parameters<T>): void => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...lastArgs);
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}

// Rate limiting wrapper for Supabase calls
export async function withRateLimit<T>(
  key: string,
  operation: () => Promise<T>,
  maxCalls = 5,
  windowMs = 60000 // 1 minute
): Promise<T | null> {
  const now = Date.now();
  const state = rateLimitStates.get(key) || {
    lastCall: 0,
    callCount: 0,
    isBlocked: false,
    blockUntil: 0
  };

  // Check if we're still blocked
  if (state.isBlocked && now < state.blockUntil) {
    console.warn(`Rate limited operation '${key}' blocked until ${new Date(state.blockUntil)}`);
    return null;
  }

  // Reset block if time has passed
  if (state.isBlocked && now >= state.blockUntil) {
    state.isBlocked = false;
    state.callCount = 0;
  }

  // Reset call count if window has passed
  if (now - state.lastCall > windowMs) {
    state.callCount = 0;
  }

  // Check if we're exceeding rate limit
  if (state.callCount >= maxCalls) {
    state.isBlocked = true;
    state.blockUntil = now + windowMs;
    rateLimitStates.set(key, state);
    console.warn(`Rate limit exceeded for '${key}', blocking for ${windowMs}ms`);
    return null;
  }

  try {
    state.callCount++;
    state.lastCall = now;
    rateLimitStates.set(key, state);

    const result = await operation();
    return result;
  } catch (error: any) {
    // If it's a rate limit error, block future calls
    if (error?.message?.includes('429') || error?.status === 429) {
      state.isBlocked = true;
      state.blockUntil = now + (windowMs * 2); // Block for longer on 429
      rateLimitStates.set(key, state);
      console.error(`Rate limit error for '${key}':`, error);
    }
    throw error;
  }
}

// Enhanced cleanup function
export const cleanupAuthState = () => {
  try {
    // Remove standard auth tokens
    const keysToRemove = [
      'supabase.auth.token',
      'sb-auth-token',
      'sb-refresh-token'
    ];

    // Remove specific known keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage keys too
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    console.log('🧹 Auth state cleaned up');
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};

// Safer Supabase operations with retry
export async function safeSupabaseCall<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      const isLastAttempt = attempt === maxRetries;

      if (isRateLimit && !isLastAttempt) {
        const waitTime = delay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (isLastAttempt) {
        console.error('Final attempt failed:', error);
        return null;
      }

      throw error;
    }
  }
  return null;
}

// Singleton to prevent multiple auth listeners
let authListenerInitialized = false;

export const ensureSingleAuthListener = () => {
  if (authListenerInitialized) {
    return false; // Already initialized
  }
  authListenerInitialized = true;
  return true; // First initialization
};

export const resetAuthListener = () => {
  authListenerInitialized = false;
};