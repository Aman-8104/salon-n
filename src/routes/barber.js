const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');
const router = express.Router();
const prisma = new PrismaClient();

function ensureBarber(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'BARBER') return next();
  return res.redirect('/barber-login');
}

router.get('/', ensureBarber, async (req, res) => {
  const now = new Date();
  const todayFrom = startOfDay(now), todayTo = endOfDay(now);
  const weekFrom = startOfWeek(now, { weekStartsOn: 1 }), weekTo = endOfWeek(now, { weekStartsOn: 1 });
  const monthFrom = startOfMonth(now), monthTo = endOfMonth(now);

  const [todayAppts, weekAppts, monthAppts, upcoming] = await Promise.all([
    prisma.appointment.findMany({
      where: { barberId: req.user.id, startTime: { gte: todayFrom, lte: todayTo } },
      include: { service: true, customer: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.appointment.findMany({
      where: { barberId: req.user.id, startTime: { gte: weekFrom, lte: weekTo }, status: { in: ['SCHEDULED', 'COMPLETED'] } },
      include: { customer: true },
    }),
    prisma.appointment.findMany({
      where: { barberId: req.user.id, startTime: { gte: monthFrom, lte: monthTo }, status: { in: ['SCHEDULED', 'COMPLETED'] } },
      include: { customer: true },
    }),
    prisma.appointment.findMany({
      where: { barberId: req.user.id, startTime: { gte: now }, status: 'SCHEDULED' },
      include: { service: true, customer: true },
      orderBy: { startTime: 'asc' },
      take: 10,
    })
  ]);

  const uniq = arr => Array.from(new Set(arr));
  const weekCustomers = uniq(weekAppts.map(a => a.customerId)).length;
  const monthCustomers = uniq(monthAppts.map(a => a.customerId)).length;

  const stats = {
    week: { total: weekAppts.length, customers: weekCustomers },
    month: { total: monthAppts.length, customers: monthCustomers },
  };

  res.render('barber/dashboard', { title: 'Barber Dashboard', appts: todayAppts, stats, upcoming });
});

router.post('/appointments/:id/status', ensureBarber, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body; // COMPLETED or CANCELLED
  await prisma.appointment.update({ where: { id }, data: { status } });
  res.redirect('/barber');
});

router.get('/earnings', ensureBarber, async (req, res) => {
  const period = req.query.period || 'today';
  const now = new Date();
  const ranges = {
    today: [startOfDay(now), endOfDay(now)],
    week: [startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })],
    month: [startOfMonth(now), endOfMonth(now)],
  };
  const [from, to] = ranges[period] || ranges.today;
  const appts = await prisma.appointment.findMany({
    where: { barberId: req.user.id, startTime: { gte: from, lte: to }, status: 'COMPLETED' },
    include: { service: true },
  });
  const total = appts.reduce((sum, a) => sum + a.service.price, 0);
  res.render('barber/earnings', { title: 'Earnings', period, total, appts });
});

module.exports = router;
