// backend/scripts/updatePeriod.js

const mongoose = require('mongoose');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const CulturalProperty = require('../src/models/CulturalProperty'); // 수정된 경로
const User = require('../src/models/User');
const parser = new xml2js.Parser({ explicitArray: false });

// MongoDB 연결 설정
const mongoURI = 'mongodb://127.0.0.1:27017/culturalDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.1'; // 실제 MongoDB URI로 변경

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// 연결 오류 처리
db.on('error', console.error.bind(console, 'connection error:'));

// 연결 성공 시 스크립트 실행
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // 'period'가 'n/a'인 문서 찾기
    const propertiesToUpdate = await CulturalProperty.find({ period: 'n/a' });
    console.log(`Found ${propertiesToUpdate.length} properties to update.`);

    // 병렬 처리 설정
    const MAX_CONCURRENT_REQUESTS = 5;
    const queue = [...propertiesToUpdate];
    const promises = [];

    for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++) {
      const worker = async () => {
        while (queue.length > 0) {
          const property = queue.shift();
          const { ccbaKdcd, ccbaAsno, ccbaCtcd } = property;

          // 상세 조회 API 요청
          const apiUrl = 'http://www.khs.go.kr/cha/SearchKindOpenapiDt.do';
          const params = {
            ccbaKdcd,
            ccbaAsno,
            ccbaCtcd,
          };

          try {
            const response = await axios.get(apiUrl, { params });

            // XML 응답 파싱
            const result = await parser.parseStringPromise(response.data);

            // 'ccceName' 추출
            const ccceName = result?.response?.ccceName || 'n/a';

            if (ccceName !== 'n/a') {
              // MongoDB 문서 업데이트
              property.period = ccceName;
              await property.save();
              console.log(`Updated property ${property._id} with period: ${ccceName}`);
            } else {
              console.warn(`No period data found for property ${property._id}`);
            }

            // API 요청 간 간격 두기 (API 서버 과부하 방지)
            await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기
          } catch (apiError) {
            console.error(`Error fetching data for property ${property._id}:`, apiError.message);
          }
        }
      };

      promises.push(worker());
    }

    await Promise.all(promises);

    console.log('Period update completed.');
  } catch (err) {
    console.error('Error during update process:', err.message);
  } finally {
    mongoose.connection.close();
  }
});