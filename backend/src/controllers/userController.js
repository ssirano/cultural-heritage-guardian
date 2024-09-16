// backend/src/controllers/userController.js

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 환경 변수에서 JWT_SECRET 불러오기
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

exports.register = async (req, res) => {
    console.log('--- Register function called ---');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  
    const { username, email, password } = req.body;
  
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username, email, password });
      return res.status(400).json({ 
        error: '모든 필드를 입력해주세요.',
        receivedData: req.body
      });
    }
  
    try {
        console.log('Attempting to create new user');
        let user = new User({ username, email, password });
        console.log('Before save: ', user);  // 이 로그로 해싱 전에 상태 확인
        await user.save();  // 저장 시도
        console.log('User created successfully');
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        console.error('Error during user creation:', error);  // 에러 로그 추가
        res.status(500).json({ error: '회원가입 실패', details: error.message });
    }
}
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 사용자 존재 여부 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 일치 여부 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 실패' });
  }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
      // 사용자 존재 여부 확인
      const user = await User.findOne({ email });
      if (!user) {
        console.log('사용자를 찾을 수 없습니다:', email);
        return res.status(400).json({ error: '사용자를 찾을 수 없습니다.' });
      }
  
      console.log('DB 저장된 비밀번호:', user.password); // DB에 저장된 해싱된 비밀번호 확인
      console.log('입력된 비밀번호:', password); // 사용자가 입력한 비밀번호 확인
  
      // 비밀번호 일치 여부 확인
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('비밀번호가 일치하지 않습니다');
        return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
      }
  
      // JWT 토큰 생성
      const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
      };
  
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token });
    } catch (error) {
      console.error('로그인 오류:', error);
      res.status(500).json({ error: '로그인 실패' });
    }
  };
  exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(400).json({ error: '사용자를 찾을 수 없습니다.' });
      }
      res.json(user);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      res.status(500).json({ error: '프로필 조회 실패' });
    }
  };