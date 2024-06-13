const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { Pool } = require('pg');
const axios = require("axios");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'yoX0wu6Vhgtm+GrObVXRBJnOX+EOvPS53iOK9foSmuE=',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Connexion à la base de données PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '10.15.11.100',
  database: 'extranet',
  password: 'branjeya!!',
  port: 5432,
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'secureverifybj@gmail.com',
    pass: 'vqkiyoqoxjvjnlbl',
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
    const decodedToken = jwt.verify(token, app.get('secret'));
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
    jwt.verify(token, app.get('secret'), (err, user) => {
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

app.set('secret', 'yoX0wu6Vhgtm+GrObVXRBJnOX+EOvPS53iOK9foSmuE=');

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
    const captchaVerified = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=6LfK67opAAAAAOcxuINBmWo4StlmP6XtPJi2MkpA&response=${captchaResponse}`);

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
        const token = jwt.sign({ username: user.username }, app.get('secret'), { expiresIn: JWT_EXPIRATION_TIME });
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
    const emailToken = jwt.sign({ email }, app.get('secret'), { expiresIn: '1d' });

    // Envoyer un e-mail de validation
    const mailOptions = {
      from: 'votre_adresse_gmail',
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

app.listen(80, () => {
  console.log('Server is running on port 80');
});
