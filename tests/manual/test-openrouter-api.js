/**
 * OpenRouter API 테스트 스크립트
 * 
 * 이 스크립트는 OpenRouter API를 직접 호출하여 연결 및 응답을 테스트합니다.
 * 실행하려면 다음 명령어를 사용하세요:
 * node tests/manual/test-openrouter-api.js
 */

// 환경 변수 로드
let apiKey;
try {
  const envModule = require('../../extension.env.js');
  apiKey = envModule.OPENROUTER_API_KEY;
  console.log('extension.env.js에서 API 키를 로드했습니다.');
} catch (error) {
  console.error('extension.env.js 로드 실패:', error);
  console.log('API 키를 직접 입력하세요:');
  process.exit(1);
}

// API 키 검증
if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
  console.error('유효한 API 키가 필요합니다. extension.env.js 파일에서 OPENROUTER_API_KEY를 설정하세요.');
  process.exit(1);
}

// API 요청 함수
async function testOpenRouterApi() {
  console.log('\n===== OpenRouter API 테스트 시작 =====\n');
  
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const modelId = 'google/gemini-2.5-flash-preview';
  
  console.log(`API URL: ${apiUrl}`);
  console.log(`모델 ID: ${modelId}`);
  console.log(`API 키: ${apiKey.substring(0, 10)}...`);
  
  const messages = [
    { role: 'system', content: '당신은 코딩과 개발을 도와주는 AI 어시스턴트입니다.' },
    { role: 'user', content: '안녕하세요! TypeScript의 주요 기능을 간단히 설명해주세요.' }
  ];
  
  const requestBody = {
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 500,
    stream: false
  };
  
  console.log('\n요청 메시지:');
  console.log(JSON.stringify(messages, null, 2));
  
  try {
    console.log('\n요청 전송 중...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/anthropics/claude-code',
        'X-Title': 'APE VSCode Extension Test'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 응답 오류 (${response.status}): ${response.statusText}\n${errorText}`);
    }
    
    const responseData = await response.json();
    
    console.log('\n응답 성공!');
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답 ID: ${responseData.id}`);
    console.log(`모델: ${responseData.model}`);
    
    if (responseData.usage) {
      console.log(`\n토큰 사용량:`);
      console.log(`- 프롬프트 토큰: ${responseData.usage.prompt_tokens}`);
      console.log(`- 완성 토큰: ${responseData.usage.completion_tokens}`);
      console.log(`- 총 토큰: ${responseData.usage.total_tokens}`);
    }
    
    console.log('\n응답 내용:');
    console.log('----------------------------------------');
    console.log(responseData.choices[0].message.content);
    console.log('----------------------------------------');
    
    console.log('\n===== OpenRouter API 테스트 완료 =====');
  } catch (error) {
    console.error('\n오류 발생:', error);
    console.error(`\n오류 메시지: ${error.message}`);
    console.error('\n===== OpenRouter API 테스트 실패 =====');
  }
}

// 테스트 실행
testOpenRouterApi();