import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { cookieOptions } from '../lib/cookieOptions.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed },
  });

  const token = signToken({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ userId: user.id, username: user.username, isAdmin: user.isAdmin });
  res.cookie('token', token, cookieOptions);
  res.json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;
