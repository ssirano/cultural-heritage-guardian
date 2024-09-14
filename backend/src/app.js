const express = require('express');
const cors = require('cors');
const app = express();
const culturalPropertyRoutes = require('./routes/culturalPropertyRoutes');  // 라우트 연결

app.use(express.json());

// CulturalProperty API 라우트 연결
app.use('/api/cultural-properties', culturalPropertyRoutes);
app.use(cors());
module.exports = app;