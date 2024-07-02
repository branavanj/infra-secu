const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

router.get('/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Token is required');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const email = decodedToken.email;

    await pool.query('UPDATE utilisateurs SET email_verified = true WHERE email = $1', [email]);

    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
