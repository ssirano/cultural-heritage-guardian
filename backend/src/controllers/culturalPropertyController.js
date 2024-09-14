// src/controllers/culturalPropertyController.js

const CulturalProperty = require('../models/CulturalProperty'); // CulturalProperty 모델을 불러옵니다
const { getCulturalPropertiesList, getCulturalPropertyDetail } = require('../services/culturalPropertyService');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false });

// API 데이터를 받아서 반환하는 함수 (저장하지 않고 바로 반환)
const fetchCulturalPropertiesDirectly = async (req, res) => {
  try {
    const params = {
      ccbaCtcd: req.query.ccbaCtcd || '11',  // 시도 코드 (서울이 기본값)
      pageUnit: req.query.pageUnit || 10,    // 한 번에 가져올 항목 수
      pageIndex: req.query.pageIndex || 1    // 페이지 번호
    };

    const items = await getCulturalPropertiesList(params);
    res.json(items);
  } catch (error) {
    console.error('API 요청 실패:', error.message);
    res.status(500).json({ error: 'Failed to fetch cultural properties from CHA API' });
  }
};

// MongoDB에서 CulturalProperty 데이터 가져오는 함수
const getCulturalProperties = async (req, res) => {
  try {
    const properties = await CulturalProperty.find({});
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CulturalProperty 데이터를 API로 가져오는 함수
const fetchCulturalProperties = async (req, res) => {
  try {
    const { ccbaCtcd, pageUnit, pageIndex, ...otherParams } = req.query;
    if (!ccbaCtcd) {
      return res.status(400).json({ error: 'ccbaCtcd (시도코드) is required' });
    }

    const params = {
      ccbaCtcd,
      pageUnit: pageUnit || 10,
      pageIndex: pageIndex || 1,
      ...otherParams,
    };

    const items = await getCulturalPropertiesList(params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 특정 CulturalProperty 상세 조회
const fetchCulturalPropertyDetail = async (req, res) => {
  try {
    const { ccbaKdcd, ccbaAsno, ccbaCtcd } = req.query;
    if (!ccbaKdcd || !ccbaAsno || !ccbaCtcd) {
      return res.status(400).json({ error: 'ccbaKdcd, ccbaAsno, ccbaCtcd are required' });
    }

    const params = { ccbaKdcd, ccbaAsno, ccbaCtcd };
    const item = await getCulturalPropertyDetail(params);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CulturalProperty 데이터를 API로 가져와 MongoDB에 저장하는 함수
const fetchAndSaveCulturalProperties = async (req, res) => {
  try {
    console.log('fetchAndSaveCulturalProperties 함수가 호출되었습니다.');
    const params = {
      ccbaCtcd: req.query.ccbaCtcd || '11',  // 서울 시도 코드
      pageUnit: req.query.pageUnit || 10,    // 한 번에 가져올 항목 수
      pageIndex: req.query.pageIndex || 1    // 페이지 번호
    };

    console.log('API 요청 파라미터:', params);

    // 외부 API에서 데이터 가져오기
    const items = await getCulturalPropertiesList(params);
    console.log('가져온 데이터:', items);

    // MongoDB에 데이터 저장
    for (const item of items) {
      console.log('Processing item:', item.ccbaCpno);

      // 필수 필드 유효성 검사
      if (!item.ccbaMnm1 || !item.longitude || !item.latitude) {
        console.warn(`아이템이 누락된 필드를 가지고 있습니다. ccbaCpno: ${item.ccbaCpno}`);
        continue; // 이 아이템을 건너뜁니다
      }

      const longitude = parseFloat(item.longitude);
      const latitude = parseFloat(item.latitude);

      // 유효한 좌표인지 확인
      if (isNaN(longitude) || isNaN(latitude)) {
        console.warn(`유효하지 않은 좌표입니다. ccbaCpno: ${item.ccbaCpno}, longitude: ${item.longitude}, latitude: ${item.latitude}`);
        continue; // 이 아이템을 건너뜁니다
      }

      const existingProperty = await CulturalProperty.findOne({ ccbaCpno: item.ccbaCpno });
      if (!existingProperty) {
        console.log('Creating new property:', item.ccbaCpno);
        const newProperty = new CulturalProperty({
          name: item.ccbaMnm1,
          type: item.ccmaName,
          period: item.ccbaPcd1,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          description: item.ccceName,
          imageUrl: item.imageUrl || '', // imageUrl이 없을 경우 빈 문자열로 설정
          ccbaKdcd: item.ccbaKdcd,
          ccbaAsno: item.ccbaAsno,
          ccbaCtcd: item.ccbaCtcd,
          ccbaCpno: item.ccbaCpno,
        });
        await newProperty.save();
        console.log('새로운 문화재가 저장되었습니다:', newProperty);
      } else {
        console.log('문화재가 이미 존재합니다:', item.ccbaCpno);
      }
    }

    res.json({ message: 'Data fetched and saved successfully', data: items });
  } catch (error) {
    console.error('Failed to fetch and save cultural properties:', error.message);
    res.status(500).json({ error: 'Failed to fetch and save cultural properties' });
  }
};

module.exports = {
  fetchCulturalProperties,
  fetchCulturalPropertyDetail,
  getCulturalProperties,
  fetchCulturalPropertiesDirectly,
  fetchAndSaveCulturalProperties, // 추가된 함수
};