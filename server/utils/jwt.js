const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Générer un token d'accès
function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      subscription_type: user.subscription_type 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRATION }
  );
}

// Générer un refresh token
function generateRefreshToken(user) {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // En production, stocker le refresh token en base avec expiration
  // Pour l'instant, on utilise un token JWT simple
  return jwt.sign(
    { 
      userId: user.id, 
      type: 'refresh',
      tokenId: crypto.randomBytes(16).toString('hex')
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_REFRESH_EXPIRATION }
  );
}

// Vérifier un token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide');
  }
}

// Rafraîchir un token
function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token de type incorrect');
    }
    
    // En production, vérifier que le refresh token n'est pas révoqué
    // et récupérer les données utilisateur depuis la base
    
    return {
      userId: decoded.userId,
      tokenId: decoded.tokenId
    };
  } catch (error) {
    throw new Error('Refresh token invalide ou expiré');
  }
}

// Générer des tokens pour un utilisateur
function generateTokens(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRATION,
    refreshExpiresIn: JWT_REFRESH_EXPIRATION
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  refreshAccessToken,
  JWT_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION
};
