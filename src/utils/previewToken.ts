const PREVIEW_TOKEN_PARAM = '__lovable_token';
const PREVIEW_TOKEN_STORAGE_KEY = 'lovable_preview_token';

const isBrowser = typeof window !== 'undefined';

const isLovablePreview = () => {
  if (!isBrowser) return false;
  return window.location.hostname.includes('lovableproject.com');
};

const safelyAccessSessionStorage = <T>(callback: (storage: Storage) => T): T | null => {
  if (!isBrowser) return null;

  try {
    return callback(window.sessionStorage);
  } catch {
    return null;
  }
};

export const getPreviewTokenFromSearch = (search = isBrowser ? window.location.search : '') => {
  if (!search) return null;
  return new URLSearchParams(search).get(PREVIEW_TOKEN_PARAM);
};

export const cachePreviewToken = (token: string | null) => {
  if (!token || !isLovablePreview()) return;

  safelyAccessSessionStorage((storage) => {
    storage.setItem(PREVIEW_TOKEN_STORAGE_KEY, token);
  });
};

export const getCachedPreviewToken = () => {
  if (!isLovablePreview()) return null;

  return safelyAccessSessionStorage((storage) => storage.getItem(PREVIEW_TOKEN_STORAGE_KEY));
};

export const buildPreviewSafePath = (targetPath: string, currentSearch = isBrowser ? window.location.search : '') => {
  if (!targetPath || !isLovablePreview()) {
    return targetPath;
  }

  const [pathWithQuery, hash = ''] = targetPath.split('#');
  const [pathname, rawQuery = ''] = pathWithQuery.split('?');
  const params = new URLSearchParams(rawQuery);
  const previewToken = getPreviewTokenFromSearch(currentSearch) || getCachedPreviewToken();

  if (previewToken) {
    params.set(PREVIEW_TOKEN_PARAM, previewToken);
    cachePreviewToken(previewToken);
  }

  const queryString = params.toString();
  const nextPath = queryString ? `${pathname}?${queryString}` : pathname;

  return hash ? `${nextPath}#${hash}` : nextPath;
};

export const primePreviewTokenCache = () => {
  const previewToken = getPreviewTokenFromSearch();
  if (previewToken) {
    cachePreviewToken(previewToken);
  }
};
