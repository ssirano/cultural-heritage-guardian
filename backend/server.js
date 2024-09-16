// backend/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const culturalPropertyRoutes = require('./src/routes/culturalPropertyRoutes');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 설정
app.use('/api/cultural-properties', culturalPropertyRoutes);

// MongoDB 연결
mongoose.connect(MONGODB_URI, {
  // Node.js MongoDB 드라이버 4.x 이상에서는 옵션 제거
})
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error.message);
  });