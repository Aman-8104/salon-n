const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function setNoStore(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
}

function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect('/');
}

// Customer login
router.get('/login', (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === 'CUSTOMER') return res.redirect('/appointment');
    // If logged in as another role, log out to allow switching
    return req.logout(err => {
      if (err) return next(err);
      setNoStore(res);
      return res.render('auth/login', { title: 'Login', role: 'customer' });
    });
  }
  setNoStore(res);
  res.render('auth/login', { title: 'Login', role: 'customer' });
});

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
  }),
  async (req, res) => {
    if (req.user.role === 'BARBER') return res.redirect('/barber');
    return res.redirect('/appointment');
  }
);

router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { name, email, password, age, gender } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.redirect('/register');
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, passwordHash, role: 'CUSTOMER', age: age? Number(age) : null, gender: gender || null } });
    res.redirect('/login');
  } catch (e) {
    res.redirect('/register');
  }
});

// Barber login
router.get('/barber-login', (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === 'BARBER') return res.redirect('/barber');
    // If logged in as ADMIN or CUSTOMER, log out first to switch
    return req.logout(err => {
      if (err) return next(err);
      setNoStore(res);
      return res.render('auth/login', { title: 'Barber Login', role: 'barber' });
    });
  }
  setNoStore(res);
  res.render('auth/login', { title: 'Barber Login', role: 'barber' });
});

router.post(
  '/barber-login',
  passport.authenticate('local', {
    failureRedirect: '/barber-login',
  }),
  (req, res) => {
    if (req.user.role !== 'BARBER') return res.redirect('/logout');
    res.redirect('/barber');
  }
);

// Admin login
router.get('/admin-login', (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === 'ADMIN') return res.redirect('/admin');
    // If logged in as another role, log out and show admin login
    return req.logout(err => {
      if (err) return next(err);
      setNoStore(res);
      return res.render('auth/login', { title: 'Admin Login', role: 'admin' });
    });
  }
  setNoStore(res);
  return res.render('auth/login', { title: 'Admin Login', role: 'admin' });
});

router.post(
  '/admin-login',
  passport.authenticate('local', {
    failureRedirect: '/admin-login',
  }),
  (req, res) => {
    if (req.user.role !== 'ADMIN') return res.redirect('/logout');
    res.redirect('/admin');
  }
);

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.get('/profile', (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'CUSTOMER') return res.redirect('/login');
  res.render('auth/profile', { title: 'My Profile' });
});

module.exports = router;
