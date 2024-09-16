// scripts/fetchAndStoreCulturalProperties.js

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const CulturalProperty = require('../src/models/CulturalProperty');
const xml2js = require('xml2js');

const CHA_API_KEY = process.env.CHA_API_KEY;
const CHA_API_URL = process.env.CHA_API_URL; // 'http://www.khs.go.kr/cha'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/culturalDB';

const heritageTypes = [
  '1', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '31', '79', '80'
];

const provinceCodes = [
  '11', '21', '22', '23', '24', '25', '26', '45',
  '31', '32', '33', '34', '35', '36', '37', '38', '50', 'ZZ'
];

const pageUnit = 100; // 페이지당 데이터 수

const parser = new xml2js.Parser({ explicitArray: false });

// 문화재청 API에서 데이터 가져오기
const fetchCulturalProperties = async (params) => {
  try {
    const response = await axios.get(`${CHA_API_URL}/SearchKindOpenapiList.do`, {
      params: {
        ...params,
        apiKey: CHA_API_KEY, // API 키 전달
      },
    });

    const parsedData = await parser.parseStringPromise(response.data);

    // 응답 구조 확인
    if (parsedData && parsedData.result && parsedData.result.item) {
      let items = parsedData.result.item;
      if (!Array.isArray(items)) {
        items = [items];
      }
      return items;
    } else {
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    }
  } catch (error) {
    if (error.response) {
      console.error(`API 요청 실패: ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.error('API 요청 실패:', error.message);
    }
    throw error;
  }
};

// MongoDB에 데이터 저장
const storeCulturalProperties = async (properties) => {
  for (const item of properties) {
    try {
      // 필수 필드 유효성 검사
      if (!item.ccbaMnm1 || !item.longitude || !item.latitude) {
        console.warn(`누락된 필드. ccbaCpno: ${item.ccbaCpno}`);
        continue;
      }

      const longitude = parseFloat(item.longitude);
      const latitude = parseFloat(item.latitude);

      if (isNaN(longitude) || isNaN(latitude) || longitude === 0 || latitude === 0) {
        console.warn(`유효하지 않은 좌표. ccbaCpno: ${item.ccbaCpno}, longitude: ${item.longitude}, latitude: ${item.latitude}`);
        continue;
      }

      // 중복 확인
      const existingProperty = await CulturalProperty.findOne({ ccbaCpno: item.ccbaCpno });
      if (existingProperty) {
        console.log(`이미 존재하는 문화재. ccbaCpno: ${item.ccbaCpno}`);
        continue;
      }

      // 새 문화재 생성
      const newProperty = new CulturalProperty({
        name: item.ccbaMnm1,
        type: item.ccmaName || 'N/A',
        period: item.ccceName || 'N/A',
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        description: item.content || 'N/A',
        imageUrl: item.imageUrl || '',
        ccbaKdcd: item.ccbaKdcd,
        ccbaAsno: item.ccbaAsno,
        ccbaCtcd: item.ccbaCtcd,
        ccbaCpno: item.ccbaCpno,
      });

      await newProperty.save();
      console.log(`저장 완료: ${newProperty.name} (ccbaCpno: ${newProperty.ccbaCpno})`);
    } catch (error) {
      console.error(`저장 실패 (ccbaCpno: ${item.ccbaCpno}):`, error.message);
    }
  }
};

// 메인 함수
const main = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI, {
      // Node.js MongoDB 드라이버 4.x 이상에서는 옵션 제거
    });
    console.log('MongoDB에 연결되었습니다.');

    for (const ctcd of provinceCodes) {
      for (const kdcd of heritageTypes) {
        let pageIndex = 1;
        let moreData = true;

        while (moreData) {
          console.log(`시도코드: ${ctcd}, 종목코드: ${kdcd}, 페이지: ${pageIndex}`);

          try {
            const params = {
              ccbaCtcd: ctcd, // 시도코드
              ccbaKdcd: kdcd, // 종목코드
              ccbaCncl: 'N',   // 지정해제여부
              pageUnit: pageUnit,
              pageIndex: pageIndex,
            };

            const properties = await fetchCulturalProperties(params);

            if (properties.length === 0) {
              moreData = false;
              break;
            }

            await storeCulturalProperties(properties);

            if (properties.length < pageUnit) {
              // 마지막 페이지
              moreData = false;
            } else {
              pageIndex += 1;
            }
          } catch (error) {
            console.error(`데이터 가져오기 실패 - 시도코드: ${ctcd}, 종목코드: ${kdcd}, 페이지: ${pageIndex}`);
            moreData = false; // 오류 발생 시 다음 종목코드로 넘어감
          }
        }
      }
    }

    console.log('모든 문화재 데이터를 저장했습니다.');
  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error.message);
  } finally {
    // MongoDB 연결 종료
    await mongoose.disconnect();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
};

main();