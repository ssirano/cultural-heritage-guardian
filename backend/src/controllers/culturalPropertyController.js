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
    const { swLat, swLng, neLat, neLng, level } = req.query;

    if (!swLat || !swLng || !neLat || !neLng || !level) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    const zoomLevel = parseInt(level);
    if (isNaN(zoomLevel) || zoomLevel < 1 || zoomLevel > 14) {
      return res.status(400).json({ message: 'Invalid zoom level' });
    }

    // 줌 레벨이 9 이상이면 빈 배열 반환
    if (zoomLevel >= 9) {
      return res.json([]);
    }

    // 좌표값 유효성 검사
    const coords = [swLat, swLng, neLat, neLng].map(Number);
    if (coords.some(isNaN)) {
      return res.status(400).json({ message: 'Invalid coordinate values' });
    }

    // 줌 레벨에 따라 반환할 데이터 수 조정
    let limit = 1000; // 기본값
    if (zoomLevel <= 3) limit = 100;
    else if (zoomLevel <= 5) limit = 300;
    else if (zoomLevel <= 8) limit = 500;

    // 지리적 범위 내의 문화재 쿼리
    const query = {
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)]
          ]
        }
      }
    };

    console.log('Search Query:', query);

    const culturalProperties = await CulturalProperty.find(query)
      .limit(limit)
      .select('name location type period'); // 필요한 필드만 선택

    console.log(`Returning ${culturalProperties.length} cultural properties for zoom level ${zoomLevel}`);
    res.json(culturalProperties);
  } catch (error) {
    console.error('Error fetching cultural properties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

// 필터링된 문화재 조회 함수
const fetchCulturalProperties = async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, level } = req.query;

    if (!swLat || !swLng || !neLat || !neLng || !level) {
      return res.status(400).json({ error: 'swLat, swLng, neLat, neLng, level are required' });
    }

    const query = {
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)]
          ]
        }
      }
    };

    console.log('Filter Query:', query);

    const properties = await CulturalProperty.find(query);
    res.json(properties);
  } catch (error) {
    console.error('Failed to fetch filtered cultural properties:', error.message);
    res.status(500).json({ error: 'Failed to fetch filtered cultural properties' });
  }
};

const searchCulturalProperties = async (req, res) => {
  try {
    const { keyword } = req.query;
    console.log(`Received search request with keyword: ${keyword}`);

    if (!keyword) {
      return res.status(400).json({ message: 'Search keyword is required' });
    }

    // name, location, type, period 필드를 선택하여 검색 결과에 포함
    const culturalProperties = await CulturalProperty.find({
      name: { $regex: keyword, $options: 'i' }
    }).select('name location type period');

    console.log(`Found ${culturalProperties.length} cultural properties matching keyword: ${keyword}`);

    res.json(culturalProperties);
  } catch (error) {
    console.error('Error searching cultural properties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  fetchCulturalProperties,
  getCulturalProperties,
  fetchCulturalPropertiesDirectly,
  fetchAndSaveCulturalProperties, // 추가된 함수
  searchCulturalProperties,
};