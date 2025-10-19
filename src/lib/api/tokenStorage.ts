const AUTH_TOKEN_KEY = 'studi-jo:auth-token';
const ADMIN_AUTH_TOKEN_KEY = 'studi-jo:admin-auth-token';
const ADMIN_AUTH_USER_KEY = 'studi-jo:admin-auth-user';

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

const getNamespacedToken = (key: string): string | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return storage.getItem(key);
};

const setNamespacedToken = (key: string, token: string | null): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (token && token.length > 0) {
    storage.setItem(key, token);
    return;
  }

  storage.removeItem(key);
};

export const getAdminAuthToken = (): string | null => getNamespacedToken(ADMIN_AUTH_TOKEN_KEY);

export const setAdminAuthToken = (token: string | null): void => {
  setNamespacedToken(ADMIN_AUTH_TOKEN_KEY, token);
};

export const clearAdminAuthToken = (): void => {
  setAdminAuthToken(null);
};

export interface StoredAdminUser {
  email: string;
  full_name?: string;
}

export const getStoredAdminUser = (): StoredAdminUser | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(ADMIN_AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { email, full_name } = parsed as Record<string, unknown>;
    const emailValue = typeof email === 'string' ? email : null;
    const full_nameValue = typeof full_name === 'string' ? full_name : undefined;

    if (!emailValue) {
      return null;
    }

    return {
      email: emailValue,
      full_name: full_nameValue,
    };
  } catch {
    return null;
  }
};

export const setStoredAdminUser = (user: StoredAdminUser | null): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!user) {
    storage.removeItem(ADMIN_AUTH_USER_KEY);
    return;
  }

  const payload = JSON.stringify(user);
  storage.setItem(ADMIN_AUTH_USER_KEY, payload);
};

export const clearStoredAdminUser = (): void => {
  setStoredAdminUser(null);
};
