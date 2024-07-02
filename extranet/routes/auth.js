const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/database');
const transporter = require('../config/mail');
const authenticateJWT = require('../middleware/auth');

const router = express.Router();
const JWT_EXPIRATION_TIME = '2h';

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
  const { username, email, password, ip } = req.body;
  const currentDate = new Date().toISOString();

  try {
    const existingUser = await pool.query('SELECT * FROM utilisateurs WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).send('Username or email already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO utilisateurs (username, email, password, ip, date_creation) VALUES ($1, $2, $3, $4, $5)', [username, email, hashedPassword, ip, currentDate]);

    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmation de votre adresse e-mail',
      text: `Cliquez sur le lien suivant pour confirmer votre adresse e-mail : https://extranet.infra-bj.tech/email/verify?token=${emailToken}`
    };

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



router.post('/login', async (req, res) => {
  const { username, password, 'g-recaptcha-response': captchaResponse } = req.body;

  try {
    const captchaVerified = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaResponse}`);

    if (!captchaVerified.data.success) {
      return res.status(401).send("Captcha verification failed");
    }

    const result = await pool.query('SELECT * FROM utilisateurs WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });
      req.session.token = token;
      return res.redirect('/dashboard');
    }

    res.status(401).send('Invalid username or password');
  } catch (error) {
    console.error('Error verifying captcha:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/dashboard', authenticateJWT, (req, res) => {
  res.render('dashboard', { username: req.user.username });
});

module.exports = router;
