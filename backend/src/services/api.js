const fetchCulturalPropertiesFromAPI = async () => {
    try {
      const response = await axios.get('http://www.khs.go.kr/cha/SearchKindOpenapiList.do', {
        params: {
          ccbaKdcd: '11',  
          ccbaCtcd: '11',
          ccbaCncl: 'N',
          pageUnit: 100,
          pageIndex: 1
        }
      });
  
      if (response.status !== 200) {
        console.error(`API 요청 실패: 상태 코드 ${response.status}`);
        throw new Error(`Failed with status code ${response.status}`);
      }
  
      return response.data;
    } catch (error) {
      console.error('API 요청 실패:', error.message);
      throw new Error('Failed to fetch cultural properties list from CHA API');
    }
  };