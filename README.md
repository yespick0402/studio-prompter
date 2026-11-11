# Studio Prompter PRO (개선본)

이 프로젝트는 첨부된 Gemini 대화 기록의 **최종 `index.html`**을 바탕으로 제작한 HTML/Electron 프로젝트입니다.

## 구성
- `index.html`: HTML 단독 실행 / Electron 화면
- `main.js`, `preload.js`: 실제 파일 저장·불러오기와 3버튼 종료 확인
- `package.json`: Electron 패키징 설정
- `.github/workflows/build.yml`: GitHub Actions 빌드
- `icon.png`, `icon.ico`, `icon.icns`: 실행 프로그램 아이콘

## 사용하기
1. HTML만 테스트하려면 `index.html`을 Chrome/Edge에서 엽니다. 다만 브라우저의 일반 파일 다운로드는 **실제 파일 저장 성공 여부를 검증할 수 없고**, 브라우저 창 종료 시 **저장/저장 안 함/취소** 3개 버튼을 띄울 수 없습니다. 브라우저의 파일 시스템 접근 API가 허용되면 실제 저장 완료 메시지가 나옵니다.
2. 완전한 기능을 사용하려면 이 폴더의 내용을 GitHub 저장소에 업로드하여 **Actions → Build Studio Prompter PRO → Run workflow**를 실행합니다. 빌드 후 해당 실행 파일을 사용하세요.
3. Electron 실행판에서는 `Ctrl+S` / `Command+S` 저장, `Ctrl+O` / `Command+O` 불러오기, `Ctrl+Z` / `Command+Z` 대본만 되돌리기, `Ctrl+Y` / `Command+Shift+Z` 다시 실행할 수 있습니다.
4. 찾기 창에서 **Enter 다음, Shift+Enter 이전** 검색. 줄바꿈과 공백 차이를 무시합니다. 창 제목 부분을 잡아 드래그할 수 있습니다.
5. `🔔 저장 알림` 설정 탭에서 토스트 알림 위치·표시 시간을 조절합니다.

### 종료 시 저장 확인
마지막 디스크 저장/불러오기와 현재 HTML+설정 상태를 비교합니다. 바뀐 내용이 있을 때 창을 종료하면 `저장 / 저장하지 않음 / 취소`를 제공합니다. 저장 취소나 저장 실패 시 종료도 취소합니다. 새 대본을 불러올 때도 변경 사항을 보호합니다.

### Undo/Redo 기록
대본 에디터의 HTML 변경에 대해서만 기록합니다. 복사본 전체가 아닌 변경 구간을 보관하고, 프로그램이 열린 동안 최대 **10만 번 또는 약 256MiB**의 수정 기록을 보유합니다. 새 TXT 불러오기는 별도의 편집 시작점으로 취급합니다. 브라우저 입력창·검색어 입력·프로그램 환경설정만 변경한 경우에는 대본 되돌리기 기록에 추가하지 않습니다.

### 참고
Windows와 macOS의 실제 실행 파일 빌드, 다중 모니터 테스트는 GitHub Actions 및 각 OS 환경에서 최종 확인이 필요합니다. 이 프로젝트는 정식 서명된 앱이 아닙니다.
