const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.session.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.redirect('/auth/login');
      }
      req.user = user;
      next();
    });
  } else {
    res.redirect('/auth/login');
  }
};

module.exports = authenticateJWT;
