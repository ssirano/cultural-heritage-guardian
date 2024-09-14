// src/models/CulturalProperty.js

const mongoose = require('mongoose');

// CulturalProperty 스키마 정의
const CulturalPropertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  period: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // 경도(longitude), 위도(latitude)
  },
  description: String,
  imageUrl: String,
  ccbaKdcd: String,  // 종목코드
  ccbaAsno: String,  // 관리번호
  ccbaCtcd: String,  // 시도코드
  ccbaCpno: String,  // 국가유산연계번호
});

// 위치 정보를 위한 2D Sphere 인덱스 추가
CulturalPropertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CulturalProperty', CulturalPropertySchema);