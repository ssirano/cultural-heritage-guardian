// testService.js

const { getCulturalPropertiesList } = require('./src/services/culturalPropertyService');

const testFetch = async () => {
  try {
    const params = {
      ccbaCtcd: '11',   // 서울 시도 코드
      pageUnit: 10,     // 한 번에 가져올 항목 수
      pageIndex: 1      // 페이지 번호
    };
    const items = await getCulturalPropertiesList(params);
    console.log('가져온 아이템:', items);
  } catch (error) {
    console.error('테스트 실패:', error.message);
  }
};

testFetch();