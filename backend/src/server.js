require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const userRoutes = require('./routes/userRoutes');
const culturalPropertyRoutes = require('./routes/culturalPropertyRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS 설정 개선
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.25.2:3000', 'http://192.168.25.7:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/cultural-properties', culturalPropertyRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
    server.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error.message);
  });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  const requestUrl = url.parse(req.url, true);
  const token = requestUrl.query.token;

  console.log('Received token:', token);

  if (!token) {
    console.log('토큰이 제공되지 않았습니다. 연결을 유지합니다.');
    // 토큰이 없어도 연결을 유지합니다.
  } else {
    // JWT 검증 (선택적)
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('JWT 인증 실패:', err.message);
        console.log('사용된 토큰:', token);
        console.log('JWT_SECRET:', process.env.JWT_SECRET);
        // 인증 실패해도 연결을 유지합니다.
      } else {
        ws.userId = decoded.id;
        ws.username = decoded.username;
        console.log(`사용자 ${ws.username}가 WebSocket에 연결되었습니다.`);
      }
    });
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // 모든 연결된 클라이언트에게 메시지 브로드캐스트
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: 'chat',
              userId: ws.userId || 'anonymous',
              username: ws.username || 'Anonymous',
              message: data.message,
            })
          );
        }
      });
    } catch (error) {
      console.error('메시지 처리 중 오류 발생:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket connection closed for user ${ws.username || 'Anonymous'}`);
  });
});