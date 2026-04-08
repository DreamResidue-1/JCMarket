import crypto from 'crypto';
import { AppError } from './http.js';

const encodeBase64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decodeBase64Url = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, 'JWT secret is not configured on the server.');
  }
  return secret;
};

export const signSessionToken = (payload, expiresInSeconds = 3600) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = encodeBase64Url(header);
  const encodedPayload = encodeBase64Url(tokenPayload);
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token) => {
  if (!token) {
    throw new AppError(401, 'Session token is required.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AppError(401, 'Invalid session token format.');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new AppError(401, 'Invalid session token signature.');
  }

  const payload = decodeBase64Url(encodedPayload);

  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, 'Session token has expired.');
  }

  return payload;
};
