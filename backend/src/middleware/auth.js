// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = function(req, res, next) {
  // 헤더에서 토큰 가져오기
  const token = req.header('Authorization')?.split(' ')[1];

  // 토큰 없으면 접근 금지
  if (!token) {
    return res.status(401).json({ error: '접근이 거부되었습니다. 토큰이 없습니다.' });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '토큰이 유효하지 않습니다.' });
  }
};