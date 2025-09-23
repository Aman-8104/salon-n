const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const barber1 = await prisma.user.upsert({
    where: { email: 'barber.tony@example.com' },
    update: {},
    create: {
      name: 'Tony',
      email: 'barber.tony@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'BARBER',
      age: 32,
      gender: 'Male',
    },
  });

  const barber2 = await prisma.user.upsert({
    where: { email: 'barber.mike@example.com' },
    update: {},
    create: {
      name: 'Mike',
      email: 'barber.mike@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'BARBER',
      age: 29,
      gender: 'Male',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer.john@example.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer.john@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'CUSTOMER',
      age: 27,
      gender: 'Male',
    },
  });

  const targetAdminEmail = 'mensalon@gmail.com';
  const targetAdminPassword = 'acpce';
  const oldAdminEmail = 'admin@ironcut.local';

  let admin;
  const oldAdmin = await prisma.user.findUnique({ where: { email: oldAdminEmail } });
  if (oldAdmin) {
    admin = await prisma.user.update({
      where: { email: oldAdminEmail },
      data: {
        email: targetAdminEmail,
        passwordHash: await bcrypt.hash(targetAdminPassword, 10),
        role: 'ADMIN',
        name: oldAdmin.name || 'Site Admin',
      },
    });
  } else {
    admin = await prisma.user.upsert({
      where: { email: targetAdminEmail },
      update: {
        passwordHash: await bcrypt.hash(targetAdminPassword, 10),
        role: 'ADMIN',
        name: 'Site Admin',
      },
      create: {
        name: 'Site Admin',
        email: targetAdminEmail,
        passwordHash: await bcrypt.hash(targetAdminPassword, 10),
        role: 'ADMIN',
      },
    });
  }

  const services = [
    { name: 'Classic Haircut', description: 'Timeless style haircut.', duration: 30, price: 15000, category: 'Haircut' },
    { name: 'Skin Fade', description: 'Sharp skin fade.', duration: 45, price: 20000, category: 'Haircut' },
    { name: 'Beard Trim', description: 'Beard trim and shape.', duration: 20, price: 10000, category: 'Beard' },
    { name: 'Beard Styling', description: 'Detailed beard styling.', duration: 30, price: 15000, category: 'Beard' },
    { name: 'Head Massage', description: 'Relaxing head massage.', duration: 15, price: 8000, category: 'Relaxation' },
    { name: 'Hair Color', description: 'Full hair coloring.', duration: 60, price: 35000, category: 'Color' },
    { name: 'Facial', description: 'Men facial treatment.', duration: 40, price: 25000, category: 'Facial' },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { description: s.description, duration: s.duration, price: s.price, category: s.category },
      create: s,
    });
  }

  console.log('Seeded:', { barber1, barber2, customer, admin });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
