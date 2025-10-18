const AUTH_TOKEN_KEY = 'studi-jo:auth-token';

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getStorage = (): Storage | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const getAuthToken = (): string | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return storage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (token && token.length > 0) {
    storage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  storage.removeItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  setAuthToken(null);
};

export const hasAuthToken = (): boolean => Boolean(getAuthToken());
