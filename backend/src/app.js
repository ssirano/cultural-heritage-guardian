// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const culturalPropertyRoutes = require('./routes/culturalPropertyRoutes');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // 프론트엔드 주소에 맞게 수정
    credentials: true,
}));

// API 라우트 연결
app.use('/api/cultural-properties', culturalPropertyRoutes);
app.use('/api/users', userRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error.message);
  });

module.exports = app;