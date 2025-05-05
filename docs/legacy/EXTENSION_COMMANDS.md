# VS Code 확장 명령어 통합 가이드

## 1. AWS Toolkit 명령어 (S3 관련)

| 명령어 ID | 설명 | 파라미터 |
|---------|------|---------|
| `aws.explorer.focus` | AWS Explorer 패널 포커스 | - |
| `aws.showExplorer` | AWS Explorer 표시 | - |
| `aws.s3.uploadObject` | S3 버킷에 파일 업로드 | `{ bucketName, folderPath }` |
| `aws.s3.downloadObject` | S3 객체 다운로드 | `{ bucketName, key }` |
| `aws.s3.openObject` | S3 객체 열기 | `{ bucketName, key }` |
| `aws.s3.explorer.createBucket` | 새 버킷 생성 | `{ region }` |
| `aws.s3.createFolder` | 새 폴더 생성 | `{ bucketName, path }` |

## 2. GitLens 명령어

| 명령어 ID | 설명 | 파라미터 |
|---------|------|---------|
| `gitlens.showFileHistory` | 파일 히스토리 보기 | `uri` |
| `gitlens.openFileHistory` | 파일 히스토리 에디터에서 열기 | `uri` |
| `gitlens.diffWithPrevious` | 이전 버전과 비교 | `uri, line` |
| `gitlens.showCommitDetails` | 커밋 세부정보 표시 | `sha` |
| `gitlens.showQuickCommitDetails` | 빠른 커밋 정보 | `sha` |
| `gitlens.showCommitInGraph` | 커밋 그래프에서 보기 | `sha` |
| `gitlens.views.repositories.focus` | 저장소 뷰 포커스 | - |

## 3. Atlassian for VS Code (Jira) 명령어

| 명령어 ID | 설명 | 파라미터 |
|---------|------|---------|
| `atlascode.jira.openJiraIssue` | Jira 이슈 열기 | `issueKey` |
| `atlascode.showJiraIssueList` | Jira 이슈 목록 표시 | - |
| `atlascode.jira.createIssue` | 새 이슈 생성 | `{ projectKey, summary, description }` |
| `atlascode.jira.refreshJiraExplorer` | Jira 익스플로러 새로고침 | - |
| `atlascode.jira.addComment` | 이슈에 댓글 추가 | `{ issueKey, comment }` |
| `atlascode.startWorkOnIssue` | 이슈 작업 시작 | `issueKey` |
| `atlascode.jira.openCurrentJiraIssueOnWeb` | 웹에서 현재 이슈 열기 | - |

## 4. ARM 개발 관련 확장 명령어

| 확장 | 명령어 ID | 설명 | 파라미터 |
|-----|---------|------|---------|
| **Cortex-Debug** | `cortex-debug.openLaunchConfig` | 디버그 구성 열기 | - |
| **Cortex-Debug** | `cortex-debug.addMemoryView` | 메모리 뷰 추가 | `address` |
| **ARM Assembly** | `arm-assembly.disassemble` | 파일 디스어셈블 | `filePath` |
| **Embedded Tools** | `embedded-tools.peripheral-viewer.show` | 주변장치 뷰어 표시 | `device` |
| **MCU Expander** | `mcu-expander.showRegisters` | 레지스터 보기 | `regGroup` |

## 5. SSD 펌웨어 개발에 유용한 VS Code 확장

### 디버깅 및 분석

1. **TRACE32 Debugger Extension**
   - T32 디버거와 통합
   - 명령어: `trace32.connect`, `trace32.loadSymbols`, `trace32.viewTrace`

2. **Memory Viewer**
   - 메모리 맵 및 덤프 분석
   - 바이너리 패턴 시각화
   - 명령어: `memoryViewer.open`, `memoryViewer.gotoAddress`

3. **Signal Viewer**
   - 타이밍 다이어그램 및 신호 분석
   - 명령어: `signalViewer.open`, `signalViewer.importData`

### 성능 분석

4. **Flame Graph Visualizer**
   - 호출 스택 프로파일링
   - 핫스팟 식별
   - 명령어: `flameGraph.visualize`, `flameGraph.importProfile`

5. **I/O Performance Analyzer**
   - I/O 패턴 분석 및 병목 식별
   - 명령어: `ioAnalyzer.visualizeTrace`, `ioAnalyzer.compare`

### NAND 플래시 특화 도구

6. **NAND Flash Simulator**
   - 웨어 레벨링 알고리즘 시뮬레이션
   - 플래시 셀 노화 시각화
   - 명령어: `nandSim.simulate`, `nandSim.visualizeWear`

7. **ECC Analyzer**
   - 에러 교정 코드 분석
   - 비트 에러 통계
   - 명령어: `eccAnalyzer.analyze`, `eccAnalyzer.visualize`

## 6. 통합 예시 코드

```typescript
// Ape에서 S3 검색 결과를 AWS Toolkit으로 전달
async function openInS3Viewer(bucket: string, key: string) {
  return vscode.commands.executeCommand('aws.s3.openObject', {
    bucketName: bucket,
    key: key
  });
}

// Ape에서 Git 정보를 GitLens로 전달
async function showCommitInGitLens(commitSha: string) {
  return vscode.commands.executeCommand('gitlens.showCommitInGraph', commitSha);
}

// T32 트레이스 데이터를 시각화
async function visualizeT32Data(tracePath: string) {
  return vscode.commands.executeCommand('trace32.visualize', {
    path: tracePath,
    format: 'standard'
  });
}
```

이 가이드는 SSD 펌웨어 개발자를 위한 주요 확장의 명령어 목록과 통합 방법을 제공합니다. Pocket의 T32 데이터와 산출물을 이러한 전문 뷰어에 연결하면 최소한의 통합 코드로 강력한 시각화 및 분석 기능을 활용할 수 있습니다.