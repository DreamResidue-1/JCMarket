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
  const passwordHash = hashPassword(password);

  const user = await User.findOne({ where: { username: normalizedUsername } });

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    message: 'Login successful.'
  });
});

export default router;

