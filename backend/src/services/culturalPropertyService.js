// src/services/culturalPropertyService.js

const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false });

const BASE_URL = 'http://www.khs.go.kr/cha/SearchKindOpenapiList.do'; // 올바른 API 엔드포인트

// CulturalProperty 목록을 가져오는 서비스 함수
const getCulturalPropertiesList = async (params) => {
  try {
    console.log('API 요청 시작:', BASE_URL, params);
    const response = await axios.get(BASE_URL, { params });
    console.log('API 응답 상태:', response.status);
    if (response.status !== 200) {
      throw new Error(`API 응답 오류: 상태 코드 ${response.status}`);
    }
    console.log('API 응답 데이터:', response.data);
    
    // XML 데이터를 JSON으로 변환
    const parsedData = await parser.parseStringPromise(response.data);
    console.log('파싱된 데이터:', parsedData);
    
    // JSON 형식으로 변환된 데이터에서 필요한 부분 추출
    const items = parsedData.result.item;
    
    // items가 배열인지 확인 (단일 항목일 경우 배열로 변환)
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    console.error('API 요청 실패:', error.message);
    throw new Error('Failed to fetch cultural properties list from CHA API');
  }
};

const getCulturalPropertyDetail = async (params) => {
  try {
    const response = await axios.get('http://www.khs.go.kr/cha/SearchKindOpenapiDt.do', {
      params,
    });

    const result = await parser.parseStringPromise(response.data);
    const item = result.response.body.items.item;
    return item;
  } catch (error) {
    console.error('API 상세 요청 실패:', error.message);
    throw new Error('Failed to fetch cultural property detail from CHA API');
  }
};

const fetchCulturalPropertiesFromAPI = async () => {
  try {
    const response = await axios.get('http://www.khs.go.kr/cha/SearchKindOpenapiList.do', {
      params: {
        ccbaKdcd: '11', // 지정 종목 코드 (예: 국보)
        ccbaCtcd: '11', // 시도 코드 (예: 서울)
        ccbaCncl: 'N',  // 지정 해제 여부 (N: 해제되지 않은 것만)
        pageUnit: 100,  // 한 번에 가져올 데이터 수
        pageIndex: 1    // 페이지 번호
      }
    });
    console.log('fetchCulturalPropertiesFromAPI 응답 데이터:', response.data);
    return response.data; // 응답 데이터를 반환
  } catch (error) {
    console.error('API 요청 실패:', error.message);
    throw error;
  }
};

module.exports = {
  getCulturalPropertiesList,
  getCulturalPropertyDetail,
  fetchCulturalPropertiesFromAPI,
};