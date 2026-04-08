import crypto from 'crypto';
import { AppError } from './http.js';

const encodeBase64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decodeBase64Url = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const getJwtSecret = (secretName) => {
  const secret = process.env[secretName];
  if (!secret) {
    throw new AppError(500, `${secretName} is not configured on the server.`);
  }
  return secret;
};

export const signJwt = (payload, secretName, expiresInSeconds) => {
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
    .createHmac('sha256', getJwtSecret(secretName))
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyJwt = (token, secretName) => {
  if (!token) {
    throw new AppError(401, 'Authentication token is required.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AppError(401, 'Invalid authentication token format.');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret(secretName))
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new AppError(401, 'Invalid or expired authentication token.');
  }

  const payload = decodeBase64Url(encodedPayload);

  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, 'Authentication token has expired.');
  }

  return payload;
};

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
