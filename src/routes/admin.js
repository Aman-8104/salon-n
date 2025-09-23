const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const router = express.Router();
const prisma = new PrismaClient();

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'ADMIN') return next();
  return res.redirect('/admin-login');
}

router.get('/', ensureAdmin, async (req, res) => {
  const barbers = await prisma.user.findMany({ where: { role: 'BARBER' }, orderBy: { createdAt: 'desc' } });
  res.render('admin/dashboard', { title: 'Admin', barbers });
});

router.post('/barbers', ensureAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    await prisma.user.create({ data: { name, email, passwordHash, role: 'BARBER' } });
  } catch (e) {}
  res.redirect('/admin');
});

router.post('/barbers/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body;
  await prisma.user.update({ where: { id }, data: { name, email } });
  res.redirect('/admin');
});

router.post('/barbers/:id/reset-password', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body;
  const passwordHash = await bcrypt.hash(password || 'password123', 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.redirect('/admin');
});

module.exports = router;
