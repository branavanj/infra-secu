const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { Pool } = require('pg');
const axios = require("axios");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); // Charger les variables d'environnement

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Connexion à la base de données PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Durée de validité du jeton JWT (2 heures)
const JWT_EXPIRATION_TIME = '2h';

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

// Route pour vérifier l'e-mail
app.get('/verify-email', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Token is required');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const email = decodedToken.email;

    // Mettre à jour le statut de l'e-mail vérifié dans la base de données
    await pool.query('UPDATE utilisateurs SET email_verified = true WHERE email = $1', [email]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Middleware pour vérifier le token JWT
const authenticateJWT = (req, res, next) => {
  const token = req.session.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.redirect('/login');
      }
      req.user = user;
      next();
    });
  } else {
    res.redirect('/login');
  }
};

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Route Login
app.post('/login', async (req, res) => {
  const { username, password, 'g-recaptcha-response': captchaResponse } = req.body;

  try {
    // Vérification du captcha avec l'API reCAPTCHA de Google
    const captchaVerified = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaResponse}`);

    // Si la vérification du captcha a échoué
    if (!captchaVerified.data.success) {
      return res.status(401).send("Captcha verification failed");
    }

    if (username && password) {
      const result = await pool.query('SELECT * FROM utilisateurs WHERE username = $1', [username]);
      const user = result.rows[0];

      // Vérification du mot de passe si l'utilisateur existe
      if (user && bcrypt.compareSync(password, user.password)) {
        // Création du token JWT
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });
        req.session.token = token; // Stockage du token dans la session
        return res.redirect('/dashboard'); // Redirection vers /dashboard après l'authentification
      }
    }

    // Gestion de l'erreur si les identifiants sont incorrects
    res.status(401).send('Invalid username or password');
  } catch (error) {
    console.error('Error verifying captcha:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password, ip } = req.body;
  const currentDate = new Date().toISOString();

  try {
    // Vérifier si l'utilisateur existe déjà dans la base de données
    const existingUser = await pool.query('SELECT * FROM utilisateurs WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).send('Username or email already exists');
    }

    // Hasher le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insérer  l'utilisateur dans la base de données
    await pool.query('INSERT INTO utilisateurs (username, email, password, ip, date_creation) VALUES ($1, $2, $3, $4, $5)', [username, email, hashedPassword, ip, currentDate]);

    // Générer un token pour la validation de l'e-mail
    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Envoyer un e-mail de validation
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmation de votre adresse e-mail',
      text: `Cliquez sur le lien suivant pour confirmer votre adresse e-mail : https://extranet.infra-bj.tech/verify-email?token=${emailToken}`
    };

    // Envoyer l'e-mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Email sent:', info.response);
      res.status(200).send('Check your email for verification');
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/dashboard', authenticateJWT, (req, res) => {
  res.render('dashboard', { username: req.user.username });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
