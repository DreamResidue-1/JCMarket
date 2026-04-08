import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/http.js';
import { ALLOWED_ROLES, getPermissionsForRole, isValidRole, sanitizePermissions } from '../utils/rbac.js';

const router = express.Router();

const serializeUser = (user) => ({
  id: user.id,
  sub: user.sub,
  email: user.email,
  picture: user.picture,
  verifiedEmail: user.verifiedEmail,
  role: user.role,
  permissions: sanitizePermissions(user.permissions),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

router.get(
  '/',
  authenticateToken,
  checkPermission('manage_users'),
  asyncHandler(async (req, res) => {
    const users = await User.findAll({
      attributes: ['id', 'sub', 'email', 'picture', 'verifiedEmail', 'role', 'permissions', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      roles: ALLOWED_ROLES,
      users: users.map(serializeUser)
    });
  })
);

router.patch(
  '/:id',
  authenticateToken,
  checkPermission('manage_users'),
  asyncHandler(async (req, res) => {
    const { role, permissions } = req.body;

    if (role !== undefined && !isValidRole(role)) {
      throw new AppError(400, 'Invalid role supplied.');
    }

    if (permissions !== undefined && !Array.isArray(permissions)) {
      throw new AppError(400, 'Permissions must be an array of strings.');
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const nextRole = role ?? user.role;
    const currentPermissions = sanitizePermissions(user.permissions);
    const roleChanged = nextRole !== user.role;
    const nextPermissions = permissions !== undefined
      ? sanitizePermissions(permissions)
      : roleChanged
        ? getPermissionsForRole(nextRole)
        : currentPermissions.length > 0
          ? currentPermissions
          : getPermissionsForRole(nextRole);

    user.role = nextRole;
    user.permissions = nextPermissions;
    await user.save();

    res.json(serializeUser(user));
  })
);

router.delete(
  '/:id',
  authenticateToken,
  checkPermission('manage_users'),
  asyncHandler(async (req, res) => {
    if (req.user.userId === req.params.id) {
      throw new AppError(400, 'You cannot delete your own account.');
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    await user.destroy();
    res.status(204).send();
  })
);

export default router;
