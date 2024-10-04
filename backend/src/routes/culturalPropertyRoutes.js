const express = require('express');
const router = express.Router();
const CulturalProperty = require('../models/CulturalProperty');
const {
  fetchCulturalProperties,
  fetchCulturalPropertiesDirectly,
  getCulturalProperties,
  fetchAndSaveCulturalProperties,
  createCulturalProperty,
  readAllCulturalProperties,
  readCulturalPropertyById,
  updateCulturalProperty,
  deleteCulturalProperty,
  searchCulturalProperties,
} = require('../controllers/culturalPropertyController');

// 기존 엔드포인트들
router.get('/fetch-direct', fetchCulturalPropertiesDirectly);
router.get('/list', getCulturalProperties); // 이 엔드포인트를 사용

router.get('/fetch-list', fetchCulturalProperties);
router.get('/search', searchCulturalProperties);

// 새 엔드포인트: 데이터를 가져와 저장
router.get('/fetch-and-save', fetchAndSaveCulturalProperties);

// CRUD 엔드포인트들
// CREATE - 새로운 문화재 생성
router.post('/', async (req, res) => {
  try {
    const culturalProperty = new CulturalProperty(req.body);
    await culturalProperty.save();
    res.status(201).json(culturalProperty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ - 모든 문화재 조회
router.get('/', async (req, res) => {
  try {
    const culturalProperties = await CulturalProperty.find();
    res.json(culturalProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - 특정 문화재 조회
router.get('/:id', async (req, res) => {
  try {
    const culturalProperty = await CulturalProperty.findById(req.params.id);
    if (!culturalProperty) {
      return res.status(404).json({ message: 'Cultural Property not found' });
    }
    res.json(culturalProperty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - 문화재 정보 업데이트
router.put('/:id', async (req, res) => {
  try {
    const culturalProperty = await CulturalProperty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!culturalProperty) {
      return res.status(404).json({ message: 'Cultural Property not found' });
    }
    res.json(culturalProperty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - 문화재 삭제
router.delete('/:id', async (req, res) => {
  try {
    const culturalProperty = await CulturalProperty.findByIdAndDelete(req.params.id);
    if (!culturalProperty) {
      return res.status(404).json({ message: 'Cultural Property not found' });
    }
    res.json({ message: 'Cultural Property deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEARCH - 문화재 검색
router.get('/search', async (req, res) => {
  try {
    const { keyword, type, period } = req.query;
    const query = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }
    if (period) {
      query.period = period;
    }

    const culturalProperties = await CulturalProperty.find(query);
    res.json(culturalProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;