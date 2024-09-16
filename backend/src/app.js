const express = require('express');
const cors = require('cors');
const app = express();
const culturalPropertyRoutes = require('./routes/culturalPropertyRoutes');  // 라우트 연결
const userRoutes = require('./routes/userRoutes');

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // 프론트엔드 주소에 맞게 수정
    credentials: true,
  }));
  app.use(express.json());
// CulturalProperty API 라우트 연결
app.use('/api/cultural-properties', culturalPropertyRoutes);
app.use('/api/users', userRoutes);

module.exports = app;