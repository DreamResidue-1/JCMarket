export const ALLOWED_ROLES = ['admin', 'user', 'moderator'];

const rolePermissions = {
  user: [],
  moderator: ['create_product'],
  admin: ['create_product', 'manage_users']
};

export const isValidRole = (role) => ALLOWED_ROLES.includes(role);

export const getPermissionsForRole = (role) => {
  if (!isValidRole(role)) {
    return [];
  }

  return [...rolePermissions[role]];
};

export const sanitizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return Array.from(
    new Set(
      permissions
        .map((permission) => typeof permission === 'string' ? permission.trim() : '')
        .filter(Boolean)
    )
  ).sort();
};
