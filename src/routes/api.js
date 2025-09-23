const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

function ensureCustomer(req, res, next){
  if(req.isAuthenticated() && req.user.role === 'CUSTOMER') return next();
  return res.status(401).json([]);
}

router.get('/my-appointments', ensureCustomer, async (req, res) => {
  const appts = await prisma.appointment.findMany({
    where: { customerId: req.user.id },
    orderBy: { startTime: 'desc' },
    include: { service: true },
  });
  res.json(appts);
});

// Cancel an appointment (customer-owned, future, scheduled)
router.post('/cancel-appointment/:id', ensureCustomer, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.customerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (appt.status !== 'SCHEDULED') return res.status(400).json({ error: 'Only scheduled appointments can be canceled' });
    if (new Date(appt.startTime) <= new Date()) return res.status(400).json({ error: 'Past appointments cannot be canceled' });
    await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
