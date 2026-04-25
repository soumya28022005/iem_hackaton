const jwt = require('jsonwebtoken');
const { config } = require('./config');
console.log(`[Config Debug] JWT_SECRET length: ${config.JWT_SECRET?.length || 0}, starts with: ${config.JWT_SECRET?.substring(0, 3)}...`);

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, provider: user.provider },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN },
  );
}

function tokenResponse(user) {
  return {
    access_token: signAccessToken(user),
    refresh_token: signRefreshToken(user),
  };
}

function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  tokenResponse,
  verifyToken,
};
