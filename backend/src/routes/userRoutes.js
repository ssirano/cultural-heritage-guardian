const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// 로깅 미들웨어 추가
router.use((req, res, next) => {
  console.log('User route accessed:', req.method, req.url);
  next();
});

// 회원가입
router.post('/register', (req, res, next) => {
  console.log('Register route hit');
  next();
}, userController.register);

// 로그인
router.post('/login', userController.login);

// 사용자 프로필 조회 (인증 필요)
router.get('/profile', auth, userController.getProfile);

module.exports = router;