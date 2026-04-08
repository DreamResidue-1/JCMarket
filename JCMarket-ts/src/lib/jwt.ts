import type { GoogleIdentityPayload, AuthResponse } from '../types/auth';

const decodeBase64Url = (value: string) => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizedValue.length % 4;
  const paddedValue = padding === 0
    ? normalizedValue
    : normalizedValue.padEnd(normalizedValue.length + (4 - padding), '=');

  return atob(paddedValue);
};

export type JwtPayload = GoogleIdentityPayload | AuthResponse | Record<string, unknown>;

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
};

export const isExpired = (expiresAt: number | null) => (
  typeof expiresAt === 'number' && Date.now() >= expiresAt
);
