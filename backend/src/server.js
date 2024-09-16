require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const culturalPropertyRoutes = require('./routes/culturalPropertyRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());

// Logging and parsing middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log('--- New Request ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Test route
app.post('/test', (req, res) => {
  console.log('Test route hit');
  console.log('Body:', req.body);
  res.json({ message: 'Test successful', receivedData: req.body });
});

app.use('/api/users', userRoutes);
app.use('/api/cultural-properties', culturalPropertyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error.message);
  });