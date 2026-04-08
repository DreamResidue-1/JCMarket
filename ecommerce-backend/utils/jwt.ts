import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface JWTPayload {
  userId: string;
  role: string;
  permissions: string[];
}

export interface RefreshPayload {
  userId: string;
  type: 'refresh';
}

const getAccessTokenSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
};

const getRefreshTokenSecret = (): string => {
  return process.env.REFRESH_TOKEN_SECRET || getAccessTokenSecret();
};

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getAccessTokenSecret(), { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: RefreshPayload): string => {
  return jwt.sign(payload, getRefreshTokenSecret(), { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as JWTPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  return jwt.verify(token, getRefreshTokenSecret()) as RefreshPayload;
};

export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

export const compareRefreshToken = async (token: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(token, hash);
};
