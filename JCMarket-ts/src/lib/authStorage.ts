import type { AuthSession } from '../types/auth';

const STORAGE_KEY = 'jcmarket.auth.session';

export const loadAuthSession = (): AuthSession | null => {
  const storedValue = sessionStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthSession;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveAuthSession = (session: AuthSession) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
