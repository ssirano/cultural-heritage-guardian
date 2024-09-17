// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// 회원가입
router.post('/register', userController.register);

// 로그인
router.post('/login', userController.login);

// 사용자 프로필 조회 (인증 필요)
router.get('/profile', auth, userController.getProfile);

router.get('/verify-token', auth, userController.verifyToken);
module.exports = router;