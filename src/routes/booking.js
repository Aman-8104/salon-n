const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { addMinutes, isBefore, parseISO, formatISO } = require('date-fns');
const router = express.Router();
const { sendBookingConfirmation } = require('../utils/mailer');
const prisma = new PrismaClient();

function ensureCustomer(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'CUSTOMER') return next();
  if (req.accepts('json')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/login');
}

router.get('/data', async (req, res) => {
  const services = await prisma.service.findMany({ orderBy: { category: 'asc' } });
  const barbers = await prisma.user.findMany({ where: { role: 'BARBER' }, select: { id: true, name: true } });
  res.json({ services, barbers });
});

router.get('/availability', async (req, res) => {
  const { barberId, dateISO, duration } = req.query;
  try {
    const day = new Date(dateISO);
    if (Number.isNaN(day.getTime())) return res.json({ slots: [] });
    const openHour = 9;
    const closeHour = 18;
  const step = 60; // minutes (hourly slots)
    const slots = [];
    let cursor = new Date(day);
    cursor.setHours(openHour, 0, 0, 0);
    const endDay = new Date(day);
    endDay.setHours(closeHour, 0, 0, 0);

    const existing = await prisma.appointment.findMany({
      where: {
        barberId: Number(barberId),
        startTime: { gte: cursor },
        endTime: { lte: endDay },
        status: { in: ['SCHEDULED', 'COMPLETED'] },
      },
      select: { startTime: true, endTime: true },
    });

    while (isBefore(cursor, endDay)) {
      const start = new Date(cursor);
      const end = addMinutes(start, Number(duration || 30));
      if (end <= endDay) {
        const conflict = existing.some(a => !(end <= a.startTime || start >= a.endTime));
        if (!conflict && start > new Date()) {
          slots.push({ start: formatISO(start), end: formatISO(end) });
        }
      }
      cursor = addMinutes(cursor, step);
    }
    res.json({ slots });
  } catch (e) {
    res.json({ slots: [] });
  }
});

router.post('/', ensureCustomer, async (req, res) => {
  const { serviceId, serviceIds, barberId, startISO } = req.body;
  try {
    const startTime = parseISO(startISO);
    const ids = serviceIds && Array.isArray(serviceIds) && serviceIds.length
      ? serviceIds.map(Number)
      : [Number(serviceId)];

    const services = await prisma.service.findMany({ where: { id: { in: ids } } });
    if (!services.length) return res.status(400).json({ error: 'No services selected' });

    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const endTime = addMinutes(startTime, totalDuration);

    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId: Number(barberId),
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
        status: { in: ['SCHEDULED', 'COMPLETED'] },
      },
    });
    if (conflict) return res.status(400).json({ error: 'Time block not available' });

    let cursor = new Date(startTime);
    const created = [];
    for (const s of services) {
      const sEnd = addMinutes(cursor, s.duration);
      const a = await prisma.appointment.create({
        data: {
          customerId: req.user.id,
          barberId: Number(barberId),
          serviceId: s.id,
          startTime: cursor,
          endTime: sEnd,
          status: 'SCHEDULED',
        },
        include: { service: true },
      });
      created.push(a);
      cursor = sEnd;
    }

    try {
      const barber = await prisma.user.findUnique({ where: { id: Number(barberId) } });
      const serviceNameJoined = services.map(s => s.name).join(', ');
      await sendBookingConfirmation({
        to: req.user.email,
        name: req.user.name,
        serviceName: serviceNameJoined,
        startTime: startTime,
        barberName: barber?.name || 'Any',
      });
      if (barber && barber.email) {
        await sendBookingConfirmation({
          to: barber.email,
          name: barber.name,
          serviceName: serviceNameJoined,
          startTime: startTime,
          barberName: barber.name,
        });
      }
    } catch (_) {}

    res.json({ ok: true, appointmentIds: created.map(a => a.id) });
  } catch (e) {
    res.status(400).json({ error: 'Failed to create appointment' });
  }
});

// Quick health check to verify router is mounted
router.get('/health', (req, res) => {
  res.json({ ok: true, router: 'appointments' });
});

// Allow customers to cancel their own future appointments
async function handleCancel(req, res){
  try { console.log('Cancel request', { id: req.params.id, user: req.user && req.user.id }); } catch(_) {}
  const id = Number(req.params.id);
  try {
    const appt = await prisma.appointment.findUnique({ where: { id }, include: { service: true, barber: true, customer: true } });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.customerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (appt.status !== 'SCHEDULED') return res.status(400).json({ error: 'Only scheduled appointments can be canceled' });
    if (isBefore(appt.startTime, new Date())) return res.status(400).json({ error: 'Past appointments cannot be canceled' });
    await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    try {
      const { sendCancellationNotification } = require('../utils/mailer');
      const serviceName = appt.service?.name || 'Service';
      if (appt.customer?.email) {
        await sendCancellationNotification({
          to: appt.customer.email,
          name: appt.customer.name || 'Customer',
          serviceName,
          startTime: appt.startTime,
          barberName: appt.barber?.name || 'Barber',
        });
      }
      if (appt.barber?.email) {
        await sendCancellationNotification({
          to: appt.barber.email,
          name: appt.barber.name || 'Barber',
          serviceName,
          startTime: appt.startTime,
          barberName: appt.barber?.name || 'Barber',
        });
      }
    } catch (_) {}
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Failed to cancel appointment' });
  }
}

router.post('/:id/cancel', ensureCustomer, handleCancel);
router.post('/cancel/:id', ensureCustomer, handleCancel);

module.exports = router;
