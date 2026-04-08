import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sub: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    set(value) {
      this.setDataValue('email', value ? value.trim().toLowerCase() : null);
    }
  },
  picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'verified_email'
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['admin', 'user', 'moderator']]
    }
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetCodeHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_reset_code_hash'
  },
  passwordResetCodeExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_code_expires_at'
  },
  createdAt: {
    type: DataTypes.DATE(3)
  },
  updatedAt: {
    type: DataTypes.DATE(3)
  }
});
