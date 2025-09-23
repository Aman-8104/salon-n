require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');

require('./setup/passport');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
});

// Routers
const publicRouter = require('./routes/public');
const authRouter = require('./routes/auth');
const bookingRouter = require('./routes/booking');
const barberRouter = require('./routes/barber');
const apiRouter = require('./routes/api');
const adminRouter = require('./routes/admin');

// Mount staff and APIs first so public middleware doesn't catch them
app.use('/barber', barberRouter);
app.use('/admin', adminRouter);
app.use('/appointments', bookingRouter);
app.use('/api', apiRouter);
// Auth and public pages last
app.use('/', authRouter);
app.use('/', publicRouter);

// 404
app.use((req, res) => {
  if ((req.headers['accept'] || '').includes('application/json')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.status(404).render('404', { title: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
