/**
 * 내부망 API 테스트 시뮬레이션 스크립트
 * 
 * 이 스크립트는 내부망 API를 시뮬레이션하여 테스트합니다.
 * 실제 내부망 API를 호출하지는 않지만, 내부망 환경에서의 동작을 시뮬레이션합니다.
 * 
 * 실행하려면 다음 명령어를 사용하세요:
 * node tests/manual/test-internal-api.js
 */

// 환경 변수 로드
let internalApiEndpoint;
let internalApiKey;
try {
  const envModule = require('../../extension.env.js');
  internalApiEndpoint = envModule.INTERNAL_API_ENDPOINT;
  internalApiKey = envModule.INTERNAL_API_KEY;
  console.log('extension.env.js에서 내부망 API 설정을 로드했습니다.');
} catch (error) {
  console.error('extension.env.js 로드 실패:', error);
  console.log('내부망 API 설정을 사용할 수 없습니다.');
  process.exit(1);
}

// API 설정 검증
if (!internalApiEndpoint || internalApiEndpoint === 'https://internal-llm-api.example.com') {
  console.log('내부망 API 엔드포인트가 기본값입니다. 실제 내부망 API를 호출하지 않고 시뮬레이션합니다.');
  internalApiEndpoint = 'https://api-se-dev.narrans.samsungds.net/v1/chat/completions';
}

if (!internalApiKey || internalApiKey === 'your_internal_api_key_here') {
  console.log('내부망 API 키가 기본값입니다. 실제 내부망 API를 호출하지 않고 시뮬레이션합니다.');
  internalApiKey = 'simulated_internal_api_key';
}

// 내부망 API 요청 시뮬레이션 함수
async function testInternalApi() {
  console.log('\n===== 내부망 API 테스트 시뮬레이션 시작 =====\n');
  
  const apiUrl = internalApiEndpoint;
  const modelId = 'narrans';
  
  console.log(`API URL: ${apiUrl}`);
  console.log(`모델 ID: ${modelId}`);
  console.log(`API 키: ${internalApiKey.substring(0, 10)}...`);
  
  const messages = [
    { role: 'system', content: '당신은 코딩과 개발을 도와주는 AI 어시스턴트입니다.' },
    { role: 'user', content: '안녕하세요! 내부망 환경에서 Java 스트림 API의 주요 기능을 설명해주세요.' }
  ];
  
  const requestBody = {
    model: modelId,
    messages,
    temperature: 0,
    max_tokens: 1000,
    stream: false
  };
  
  console.log('\n요청 메시지:');
  console.log(JSON.stringify(messages, null, 2));
  
  try {
    console.log('\n요청 전송 중... (시뮬레이션)');
    
    // 실제 API 호출 대신 시뮬레이션된 응답 생성
    const simulatedResponse = simulateInternalApiResponse(modelId, messages);
    
    console.log('\n응답 성공! (시뮬레이션)');
    console.log(`상태 코드: 200 (시뮬레이션)`);
    console.log(`응답 ID: ${simulatedResponse.id}`);
    console.log(`모델: ${simulatedResponse.model}`);
    
    if (simulatedResponse.usage) {
      console.log(`\n토큰 사용량 (시뮬레이션):`);
      console.log(`- 프롬프트 토큰: ${simulatedResponse.usage.prompt_tokens}`);
      console.log(`- 완성 토큰: ${simulatedResponse.usage.completion_tokens}`);
      console.log(`- 총 토큰: ${simulatedResponse.usage.total_tokens}`);
    }
    
    console.log('\n응답 내용 (시뮬레이션):');
    console.log('----------------------------------------');
    console.log(simulatedResponse.choices[0].message.content);
    console.log('----------------------------------------');
    
    console.log('\n===== 내부망 API 테스트 시뮬레이션 완료 =====');
  } catch (error) {
    console.error('\n오류 발생:', error);
    console.error(`\n오류 메시지: ${error.message}`);
    console.error('\n===== 내부망 API 테스트 시뮬레이션 실패 =====');
  }
}

// 내부망 API 응답 시뮬레이션 함수
function simulateInternalApiResponse(model, messages) {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  // 간단한 응답 생성
  let responseContent = '';
  
  if (userMessage.includes('Java 스트림 API')) {
    responseContent = `# Java 스트림 API 주요 기능

Java 8에서 도입된 스트림 API는 컬렉션 처리를 위한 강력한 기능을 제공합니다.

## 주요 기능

1. **파이프라인 처리**: 데이터 소스에서 연속적인 변환을 통해 결과를 생성
2. **중간 연산**: 필터링(filter), 매핑(map), 정렬(sorted) 등의 변환 작업
3. **최종 연산**: 집계(collect, reduce), 순회(forEach) 등으로 결과 생성
4. **지연 평가**: 최종 연산이 호출될 때까지 중간 연산은 실행되지 않음
5. **병렬 처리**: parallelStream()을 통한 간편한 병렬 처리

## 예제 코드

\`\`\`java
List<String> names = Arrays.asList("Kim", "Park", "Lee", "Choi", "Jung");

// 문자열 길이가 3보다 큰 이름을 대문자로 변환하여 정렬
List<String> result = names.stream()
    .filter(name -> name.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());

System.out.println(result); // [CHOI, JUNG, PARK]
\`\`\`

이러한 기능들을 통해 간결하고 가독성 높은 코드를 작성할 수 있습니다.`;
  } else {
    responseContent = `안녕하세요! 내부망 환경에서 도움을 드리겠습니다. 어떤 주제에 대해 더 알고 싶으신가요?`;
  }
  
  return {
    id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    model: model,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: userMessage.length / 4, // 간단한 계산
      completion_tokens: responseContent.length / 4, // 간단한 계산
      total_tokens: (userMessage.length + responseContent.length) / 4 // 간단한 계산
    }
  };
}

// 테스트 실행
testInternalApi();