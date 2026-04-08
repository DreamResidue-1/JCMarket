import express from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';

const router = express.Router();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername === 'admin') {
    return res.status(403).json({ error: 'Admin account is reserved. Use the default admin credentials.' });
  }

  const existingUser = await User.findOne({ where: { username: normalizedUsername } });

  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  const passwordHash = hashPassword(password);

  const user = await User.create({
    username: normalizedUsername,
    passwordHash,
    role: 'customer'
  });

  res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    message: 'Account created successfully.'
  });
});

export default router;