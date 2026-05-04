import { OAuth2Client } from 'google-auth-library';
import { AppError } from './http.js';
import { getPermissionsForRole } from './rbac.js';

const splitEnvList = (value) => (
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || []
);

export const getGoogleClientIds = () => {
  const configuredIds = splitEnvList(process.env.GOOGLE_CLIENT_IDS);

  if (configuredIds.length > 0) {
    return configuredIds;
  }

  return splitEnvList(process.env.GOOGLE_CLIENT_ID);
};

export const getGoogleClientId = () => {
  const [clientId] = getGoogleClientIds();
  if (!clientId) {
    throw new AppError(500, 'Google client ID is not configured on the server.');
  }
  return clientId;
};

export const getAdminEmails = () => {
  const configuredEmails = splitEnvList(process.env.ADMIN_EMAILS);

  if (configuredEmails.length > 0) {
    return new Set(configuredEmails.map((email) => email.toLowerCase()));
  }

  return new Set(splitEnvList(process.env.ADMIN_EMAIL).map((email) => email.toLowerCase()));
};

export const verifyGoogleIdToken = async (idToken) => {
  const clientIds = getGoogleClientIds();

  if (clientIds.length === 0) {
    throw new AppError(500, 'Google client ID is not configured on the server.');
  }

  const googleClient = new OAuth2Client(clientIds[0]);
  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientIds
    });
  } catch (error) {
    throw new AppError(
      401,
      'Google sign-in token could not be verified.',
      process.env.NODE_ENV !== 'production'
        ? { reason: error instanceof Error ? error.message : String(error) }
        : undefined
    );
  }

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new AppError(401, 'Google token payload is missing required user data.');
  }

  return payload;
};

export const mapGooglePayloadToUser = (payload, existingUsername, existingPermissions = [], role = 'user') => {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const fallbackUsername = normalizedEmail.split('@')[0];
  const chosenRole = role || 'user';

  return {
    sub: payload.sub,
    email: normalizedEmail,
    username: existingUsername || payload.name?.trim() || fallbackUsername,
    picture: payload.picture || null,
    verifiedEmail: Boolean(payload.email_verified),
    role: chosenRole,
    permissions: existingPermissions.length > 0 ? existingPermissions : getPermissionsForRole(chosenRole)
  };
};

export const resolveUserRole = (existingRole, email, isVerifiedEmail) => {
  if (existingRole === 'admin') {
    return 'admin';
  }

  if (isVerifiedEmail && getAdminEmails().has(email)) {
    return 'admin';
  }

  return existingRole || 'user';
};
