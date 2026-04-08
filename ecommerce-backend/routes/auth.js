import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/User.js';
import {
  compareRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/http.js';
import {
  isEmailDeliveryConfigured,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} from '../utils/email.js';
import { mapGooglePayloadToUser, resolveUserRole, verifyGoogleIdToken } from '../utils/googleAuth.js';
import { getPermissionsForRole, isValidRole, sanitizePermissions } from '../utils/rbac.js';

const router = express.Router();

const refreshCookieName = 'refreshToken';
const passwordResetWindowMs = 10 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxPictureLength = 3 * 1024 * 1024;

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

const clearRefreshCookie = (res) => {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

const requireTrustedRequest = (req) => {
  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    throw new AppError(403, 'Missing CSRF protection header.');
  }
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const validateEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!emailPattern.test(normalizedEmail)) {
    throw new AppError(400, 'A valid email address is required.');
  }

  return normalizedEmail;
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters long.');
  }

  return password;
};

const validateProfilePicture = (picture) => {
  if (picture === null || picture === undefined || picture === '') {
    return null;
  }

  if (typeof picture !== 'string') {
    throw new AppError(400, 'Profile image must be a string.');
  }

  const normalizedPicture = picture.trim();

  if (!normalizedPicture) {
    return null;
  }

  const isDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(normalizedPicture);
  const isRemoteImage = /^https?:\/\/.+/i.test(normalizedPicture);

  if (!isDataImage && !isRemoteImage) {
    throw new AppError(400, 'Profile image must be a valid image upload or URL.');
  }

  if (normalizedPicture.length > maxPictureLength) {
    throw new AppError(400, 'Profile image is too large.');
  }

  return normalizedPicture;
};

const hashResetCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const createPasswordResetCode = () => crypto.randomInt(100000, 1000000).toString();

const buildBaseUsername = ({ name, email, username }) => {
  const baseSource = (username || name || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return baseSource || 'user';
};

const buildUniqueUsername = async ({ name, email, username }, excludedUserId = null) => {
  const baseUsername = buildBaseUsername({ name, email, username });
  let attempt = 0;

  while (attempt < 1000) {
    const suffix = attempt === 0 ? '' : `${attempt}`;
    const candidate = `${baseUsername}${suffix}`;
    const existingUser = await User.findOne({ where: { username: candidate } });

    if (!existingUser || existingUser.id === excludedUserId) {
      return candidate;
    }

    attempt += 1;
  }

  throw new AppError(500, 'Unable to generate a unique username.');
};

const findUserByEmail = (email) => User.findOne({ where: { email: normalizeEmail(email) } });

const getNormalizedRoleAndPermissions = (user) => {
  const normalizedPermissions = sanitizePermissions(user.permissions);
  const role = isValidRole(user.role) ? user.role : 'user';
  const permissions = normalizedPermissions.length > 0
    ? normalizedPermissions
    : getPermissionsForRole(role);

  return { role, permissions };
};

const ensureUserPermissions = async (user) => {
  const { role, permissions } = getNormalizedRoleAndPermissions(user);
  const currentPermissions = sanitizePermissions(user.permissions);

  if (user.role !== role || JSON.stringify(currentPermissions) !== JSON.stringify(permissions)) {
    user.role = role;
    user.permissions = permissions;
    await user.save();
  }

  return { role, permissions };
};

const createSession = async (res, user) => {
  const { role, permissions } = await ensureUserPermissions(user);
  const accessToken = generateAccessToken({
    userId: user.id,
    role,
    permissions
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    type: 'refresh'
  });

  user.refreshToken = await hashRefreshToken(refreshToken);
  await user.save();

  res.cookie(refreshCookieName, refreshToken, getRefreshCookieOptions());

  return { accessToken };
};

const findExistingGoogleUser = async (payload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const userBySub = payload.sub ? await User.findOne({ where: { sub: payload.sub } }) : null;

  if (userBySub) {
    return userBySub;
  }

  return User.findOne({ where: { email: normalizedEmail } });
};

const upsertGoogleUser = async (payload) => {
  let user = await findExistingGoogleUser(payload);
  const normalizedEmail = normalizeEmail(payload.email);
  const resolvedRole = resolveUserRole(user?.role, normalizedEmail, Boolean(payload.email_verified));
  const normalizedPermissions = sanitizePermissions(user?.permissions);
  const nextPermissions = normalizedPermissions.length > 0
    ? normalizedPermissions
    : getPermissionsForRole(resolvedRole);
  const nextUsername = await buildUniqueUsername(
    {
      name: payload.name,
      email: normalizedEmail,
      username: user?.username
    },
    user?.id || null
  );
  const userData = mapGooglePayloadToUser(payload, nextUsername, nextPermissions, resolvedRole);

  if (user) {
    user.sub = userData.sub;
    user.username = userData.username;
    user.email = userData.email;
    user.picture = userData.picture;
    user.verifiedEmail = userData.verifiedEmail;
    user.role = userData.role;
    user.permissions = userData.permissions;
    await user.save();
  } else {
    user = await User.create({
      ...userData
    });
  }

  return user;
};

const serializeAuthUser = (user) => {
  const { role, permissions } = getNormalizedRoleAndPermissions(user);

  return {
    id: user.id,
    sub: user.sub,
    email: user.email,
    picture: user.picture,
    verifiedEmail: user.verifiedEmail,
    role,
    permissions
  };
};

router.post('/google', asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new AppError(400, 'Credential is required.');
  }

  const payload = await verifyGoogleIdToken(credential);
  const user = await upsertGoogleUser(payload);
  const authResponse = await createSession(res, user);

  void sendLoginNotificationEmail({
    email: user.email,
    name: user.username,
    method: 'google'
  }).catch((error) => {
    console.error('[email] Failed to send Google sign-in confirmation:', error);
  });

  res.json(authResponse);
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, picture } = req.body;

  const normalizedEmail = validateEmail(email);
  const validatedPassword = validatePassword(password);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser?.sub && !existingUser.passwordHash) {
    throw new AppError(409, 'This account already exists with Google sign-in. Continue with Google.');
  }

  if (existingUser?.passwordHash) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const username = await buildUniqueUsername({
    name: typeof name === 'string' ? name.trim() : '',
    email: normalizedEmail
  });
  const role = 'user';
  const permissions = getPermissionsForRole(role);

  const user = await User.create({
    username,
    email: normalizedEmail,
    picture: validateProfilePicture(picture),
    passwordHash: await bcrypt.hash(validatedPassword, 10),
    verifiedEmail: false,
    role,
    permissions
  });

  const authResponse = await createSession(res, user);

  void sendWelcomeEmail({
    email: user.email,
    name: user.username
  }).catch((error) => {
    console.error('[email] Failed to send welcome email:', error);
  });

  res.status(201).json(authResponse);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = validateEmail(email);
  const validatedPassword = validatePassword(password);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (!user.passwordHash) {
    throw new AppError(400, 'This account uses Google sign-in. Continue with Google below.');
  }

  const isPasswordValid = await bcrypt.compare(validatedPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const authResponse = await createSession(res, user);

  void sendLoginNotificationEmail({
    email: user.email,
    name: user.username,
    method: 'password'
  }).catch((error) => {
    console.error('[email] Failed to send password sign-in confirmation:', error);
  });

  res.json(authResponse);
}));

router.post('/forgot-password/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = validateEmail(email);
  const genericResponse = {
    message: 'If an account with that email exists, a reset code has been generated.'
  };
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !user.passwordHash) {
    res.json(genericResponse);
    return;
  }

  const resetCode = createPasswordResetCode();
  user.passwordResetCodeHash = hashResetCode(resetCode);
  user.passwordResetCodeExpiresAt = new Date(Date.now() + passwordResetWindowMs);
  await user.save();

  if (isEmailDeliveryConfigured()) {
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.username,
        code: resetCode
      });
    } catch (error) {
      console.error('[email] Failed to send password reset email:', error);
      throw new AppError(
        502,
        'We could not send the reset email right now. Use a real inbox email address and try again.',
        process.env.NODE_ENV !== 'production'
          ? { reason: error instanceof Error ? error.message : String(error) }
          : undefined
      );
    }
    res.json(genericResponse);
    return;
  }

  console.warn(`[email] SMTP is not configured. Password reset code for ${normalizedEmail}: ${resetCode}`);

  if (process.env.NODE_ENV !== 'production') {
    res.json({
      ...genericResponse,
      developmentCode: resetCode,
      deliveryMethod: 'development'
    });
    return;
  }

  throw new AppError(500, 'Email delivery is not configured on the backend.');
}));

router.post('/forgot-password/confirm', asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const normalizedEmail = validateEmail(email);
  const normalizedCode = typeof code === 'string' ? code.trim() : '';
  const validatedPassword = validatePassword(newPassword);
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt) {
    throw new AppError(400, 'The reset code is invalid or has expired.');
  }

  if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
    user.passwordResetCodeHash = null;
    user.passwordResetCodeExpiresAt = null;
    await user.save();
    throw new AppError(400, 'The reset code is invalid or has expired.');
  }

  if (hashResetCode(normalizedCode) !== user.passwordResetCodeHash) {
    throw new AppError(400, 'The reset code is invalid or has expired.');
  }

  user.passwordHash = await bcrypt.hash(validatedPassword, 10);
  user.passwordResetCodeHash = null;
  user.passwordResetCodeExpiresAt = null;
  user.refreshToken = null;
  await user.save();

  clearRefreshCookie(res);

  res.json({
    message: 'Password updated successfully. You can now sign in with your new password.'
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  requireTrustedRequest(req);
  const refreshToken = req.cookies[refreshCookieName];

  if (!refreshToken) {
    clearRefreshCookie(res);
    throw new AppError(401, 'Refresh token required.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    clearRefreshCookie(res);
    throw new AppError(401, 'Invalid refresh token.');
  }

  const user = await User.findByPk(payload.userId);
  if (!user || !user.refreshToken) {
    clearRefreshCookie(res);
    throw new AppError(401, 'Invalid refresh token.');
  }

  const isValid = await compareRefreshToken(refreshToken, user.refreshToken);
  if (!isValid) {
    clearRefreshCookie(res);
    throw new AppError(401, 'Invalid refresh token.');
  }

  const authResponse = await createSession(res, user);
  res.json(authResponse);
}));

router.post('/logout', asyncHandler(async (req, res) => {
  requireTrustedRequest(req);
  const refreshToken = req.cookies[refreshCookieName];

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findByPk(payload.userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch (error) {
      // Ignore token verification errors during logout.
    }
  }

  clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
}));

router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.userId);

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  res.json(serializeAuthUser(user));
}));

router.patch('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.userId);

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const { picture } = req.body;
  user.picture = validateProfilePicture(picture);
  await user.save();

  res.json(serializeAuthUser(user));
}));

export default router;
