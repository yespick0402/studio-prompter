# Studio Prompter PRO v1.2.3 — GitHub Mac 빌드 복구판

> **Camera DateShift v1.1.0**에서 성공적으로 사용한 Electron/GitHub Actions 배포 구성을 비교하여 이 프로젝트에 적용했습니다. **Mac 로컬 빌드 스크립트는 포함하지 않습니다.**

## 가장 중요한 변경 (이전 v1.2.2 대비)

| 항목 | 이전 프롬프터 1.2.2 | 이번 1.2.3 (Camera DateShift 방식) |
|---|---|---|
| Mac 빌드 | 유료 Apple 서명·공증 계정 필요, 일반 GitHub 빌드에서 생략 | GitHub Actions macos-latest에서 항상 빌드 |
| 서명 | 정식 Developer ID 서명을 필수로 기대 | `identity: "-"` Ad-hoc 서명 |
| Hardened Runtime | `true` | `false` (Camera DateShift v1.1.0와 동일) |
| 공증 | `true` | `false` (Apple 공증은 수행하지 않음) |
| 산출물 | Apple 자격증명 없이는 Mac DMG 업로드 안 됨 | Apple Silicon용 DMG/ZIP |
| Node | 24 | 22 (Camera DateShift와 동일) |
| Windows | 별도 빌드 | Windows x64 portable EXE 및 ZIP 빌드 유지 |

**보안/호환성 주의:** Ad-hoc 서명은 코드에 서명이 있다는 뜻이지, Apple이 안전성을 보증하는 **Developer ID 서명·공증**은 아닙니다. GitHub에서 받은 앱은 최신 macOS에서 여전히 차단될 수 있습니다. '악성 코드가 포함됨' 경고가 나오면 강제로 열지 마세요. `hardenedRuntime: false`는 Camera DateShift 성공 구성을 동일하게 적용하기 위한 호환성 설정으로, 보안상 완화가 있습니다. 이 설정이 모든 Mac의 Gatekeeper 문제를 자동으로 해결한다고 보장하지 않습니다.

## 코딩 설치 없이 GitHub에서 만들기

1. ZIP을 내려받아 압축을 풉니다.
2. 압축을 푼 `StudioPrompterPro` 폴더 **내부의 모든 파일/폴더**(`.github` 포함)를 기존 프롬프터 GitHub 저장소로 업로드합니다.
3. `Commit changes`로 반영합니다.
4. GitHub → `Actions` → **Windows / Mac 프로그램 만들기** → `Run workflow`를 누릅니다. (push할 때 자동 실행되기도 합니다.)
5. 완료되면 해당 실행의 `Artifacts`에서 **StudioPrompter-mac-arm64**를 다운로드합니다.
6. 내부 **StudioPrompterPro-1.2.3-mac-arm64.dmg**를 열어 앱을 응용 프로그램 폴더에 복사합니다. 기존에 차단된 이전 앱은 휴지통으로 옮기고 새 DMG에서 설치합니다.
7. Finder에서 새 앱을 실행합니다. Mac의 일반적인 '확인되지 않은 개발자' 경고라면, **본인이 빌드한 파일을 신뢰하고 소스와 서명을 확인한 경우에 한해** 시스템 설정 → 개인정보 보호 및 보안 → '그래도 열기' 옵션을 확인합니다. **'악성 코드가 포함됨' 경고는 실행 우회를 하지 말고 기록과 파일을 검사해야 합니다.**

참고: GitHub Actions 실행 화면에 `macOS Ad-hoc 코드 서명 확인` 단계가 통과했는지 확인하세요. 서명이 깨졌거나 앱이 생성되지 않으면 빌드가 실패하도록 했습니다. `SHA256SUMS.txt`를 통해 다운로드 파일의 전송 무결성을 확인할 수 있습니다.

## 이번 수정에서 건드리지 않은 기능

`index.html`, `main.js`, `preload.js`의 실제 프롬프터 동작 코드는 1.2.2와 동일합니다. 대본 편집, Undo/Redo, Enter 검색, 줄바꿈 검색, Command+S/O, 리드선, 멀티모니터 출력 및 종료 시 저장 여부 확인을 유지합니다. 이번 수정은 **패키징/빌드 설정만** 변경했습니다.

## 이전 Mac 로컬 빌드 사용자가 설치물을 지우려면

동봉한 `Mac_로컬빌드_설치물_정리.command`는 **이전 v1.2.2 스크립트가 만든 전용 폴더와 사용자 홈의 앱**만 목록으로 보여주고, '삭제'를 정확히 입력하면 삭제합니다. 다른 앱에 공통으로 사용되는 `~/.npm`, `~/Library/Caches/electron`, `~/Library/Caches/electron-builder`는 지우지 않으며, 저장된 대본과 설정도 건드리지 않습니다.

터미널을 열고 `bash `를 입력한 뒤 파일을 드래그해 붙여 넣고 Enter를 누릅니다. 삭제 전 대상 파일이 맞는지 확인하세요. 백업 앱은 별도 질문을 거쳐서만 삭제합니다.

## 기술 / 확인 기준

- `.github/workflows/build.yml`: Camera DateShift v1.1.0과 동일한 `macos-latest`, `Node 22`, `npm install`, 테스트→빌드→Artifacts 업로드 흐름.
- `package.json`: `electron-builder` v26 설정에 `identity: '-'`, `hardenedRuntime: false`, `notarize: false` 적용.
- `npm test`: 소스 파일 존재 및 빌드 설정을 확인하는 단위 테스트.
- **이 작업 환경은 Linux이므로 macOS Golden Gate 27.2.1에서 실제 실행을 확인할 수 없습니다.** GitHub Actions에서 빌드와 코드서명 검사까지 완료해도 다운로드한 앱의 Gatekeeper 허용 여부는 Mac에서 확인해야 합니다.
- 공식 코드 서명 안내: https://www.electron.build/v26/docs/features/code-signing/code-signing-mac/
