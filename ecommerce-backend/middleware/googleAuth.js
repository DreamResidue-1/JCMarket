import { Op } from 'sequelize';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/http.js';
import { verifyGoogleIdToken } from '../utils/googleAuth.js';
import { verifySessionToken as verifySessionJwt } from '../utils/sessionToken.js';

const extractBodyToken = (req) => req.body?.idToken || null;
const extractHeaderToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
};

export const verifyGoogleToken = asyncHandler(async (req, res, next) => {
  const idToken = extractBodyToken(req) || extractHeaderToken(req);

  if (!idToken) {
    throw new AppError(401, 'Google ID token is required.');
  }

  req.idToken = idToken;
  req.googlePayload = await verifyGoogleIdToken(idToken);
  next();
});

export const verifySessionToken = asyncHandler(async (req, res, next) => {
  const token = extractHeaderToken(req);

  if (!token) {
    throw new AppError(401, 'Session token is required.');
  }

  req.sessionPayload = verifySessionJwt(token);
  next();
});

export const attachAuthenticatedUser = asyncHandler(async (req, res, next) => {
  const authPayload = req.sessionPayload || req.googlePayload;
  const normalizedEmail = authPayload?.email?.trim().toLowerCase();

  if (!authPayload?.sub || !normalizedEmail) {
    throw new AppError(401, 'Authenticated user could not be resolved.');
  }

  const user = await User.findOne({
    where: {
      [Op.or]: [
        { sub: authPayload.sub },
        { email: normalizedEmail }
      ]
    }
  });

  if (!user) {
    throw new AppError(401, 'User account not found. Please sign in again.');
  }

  req.user = user;
  next();
});

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication is required.'));
  }

  if (req.user.role !== role) {
    return next(new AppError(403, 'You do not have permission to access this resource.'));
  }

  return next();
};
