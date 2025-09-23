# Men's Salon Website (IronCut Barbers)

Modern, responsive salon website with appointment booking, customer profiles, and a barber dashboard (appointments + earnings). Built with Node.js, Express, EJS, and Prisma (SQLite).

## Features
- Public pages: Home, About, Services, Contact (with map)
- Multi-step booking: select service → barber → date/time → confirm
- Customer auth: register, login, profile with appointments
- Barber portal: daily appointments, update status, earnings by period
- Responsive, masculine theme (dark, clean, teal accent)

## Tech Stack
- Node.js + Express + EJS
- Prisma ORM + SQLite
- Sessions + Passport Local
- date-fns for scheduling logic

## Quick Start (Windows PowerShell)

1. Clone or open this folder in VS Code.
2. Create env file:

```powershell
Copy-Item .env.example .env
```

3. Install dependencies:

```powershell
npm install
```

4. Generate Prisma client and migrate DB:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

5. Seed database (barbers, services, demo customer):

```powershell
npm run seed
```

6. Start the dev server:

```powershell
npm run dev
```

Open http://localhost:3000

- Admin: mensalon@gmail.com / acpce
- Customer: customer.john@example.com / password123
- Barbers: barber.tony@example.com, barber.mike@example.com / password123

## Notes
- Email: Configure SMTP in `.env` for real delivery. Both customer and barber receive confirmations and cancellations. See `.env.example`.
- Availability: Demo hours 9:00–18:00 (hourly slots); adjust in `src/routes/booking.js`.
- Styles: Edit `src/public/css/styles.css` for theme changes.

## Deploy to Railway (free)
1. Push this project to your GitHub account
2. Railway → New Project → Deploy from GitHub Repo → select your repo
3. Set Environment Variables (Settings → Variables):
	- `PORT` = `3000`
	- `DATABASE_URL` = `file:./dev.db` (or use Railway Postgres and its URL)
	- `SESSION_SECRET` = long random string
	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (for emails)
4. Build commands (optional): `npx prisma generate`
5. Start command: `node src/server.js`
6. Railway provides a public URL once deploy succeeds.

Tip: For Postgres, change `DATABASE_URL` to the provisioned URL and run `npx prisma migrate deploy` then `npm run seed` from the Railway shell.

## Scripts
- `npm run dev` — start with nodemon
- `npm start` — start production server
- `npm run seed` — seed initial data
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — create a new migration

## Folder Structure
- `src/server.js` — Express entry
- `src/routes/*` — routes (public, auth, booking, barber, api)
- `src/views/*` — EJS templates
- `src/public/*` — static assets
- `prisma/schema.prisma` — DB schema
- `prisma/seed.js` — database seed

## License
Placeholder; internal project.
