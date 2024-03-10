const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error('something wrong with getting the token from the header');
    }
    const decodedToken = jwt.verify(token, 'the_secret_key');
    if (!decodedToken) {
      throw new Error('token cant be decoded as its invalid');
    }
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    return next(
      new Error('something wrong with getting the token from the header')
    );
  }
};
