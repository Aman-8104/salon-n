const express = require('express');
const router = express.Router();

// Redirect staff away from public pages
router.use((req, res, next) => {
  // Only guard simple GET navigations on top-level public pages
  if (req.method !== 'GET') return next();
  const publicPaths = new Set(['/', '/about', '/services', '/contact', '/appointment']);
  if (!publicPaths.has(req.path)) return next();
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.role === 'BARBER') return res.redirect('/barber');
    if (req.user.role === 'ADMIN') return res.redirect('/admin');
  }
  next();
});

router.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

router.get('/services', (req, res) => {
  res.render('services', { title: 'Services' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact' });
});

router.get('/appointment', (req, res) => {
  res.render('appointment', { title: 'Book Appointment' });
});

module.exports = router;
