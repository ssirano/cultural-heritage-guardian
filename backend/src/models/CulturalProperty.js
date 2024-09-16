const mongoose = require('mongoose');

const CulturalPropertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  period: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  description: { type: String },
  imageUrl: { type: String },
  ccbaKdcd: { type: String },
  ccbaAsno: { type: String },
  ccbaCtcd: { type: String },
  ccbaCpno: { type: String, unique: true },
});

// 지리적 인덱스 설정
CulturalPropertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CulturalProperty', CulturalPropertySchema);