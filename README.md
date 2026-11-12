# v1.2.6 GitHub 업로드 복구판 — 테스트 13/18 오류 수정

이 복구판은 **프롬프터 앱의 프리셋 코드를 변경하지 않습니다.** 실제 v1.2.6 원본 ZIP의 index.html은 18개 테스트가 모두 통과했습니다. 따라서 GitHub에서 13개 성공/5개 실패가 나오면 **GitHub 저장소의 index.html이 구버전으로 남았는지 확인**해야 합니다.

1. 이 ZIP을 풀고 `StudioPrompterPro` 폴더 **안에 있는** `index.html`을 GitHub 저장소 **최상위(루트)의 `index.html`**에 덮어쓰세요. (하위 폴더 안에 올리면 검사 대상 파일이 바뀌지 않습니다.)
2. `tests/presets.test.cjs`, `.github/workflows/build.yml`, `scripts/verify-source.cjs`, `package.json`도 함께 올리세요. 가장 안전한 방법은 압축파일 안의 프로젝트 전체를 루트에 덮어쓰는 것입니다.
3. GitHub에서 **Commit changes**를 누른 뒤, `Actions`에서 **새 Commit을 대상으로** 빌드를 실행하세요. 단순히 이전 실패 작업의 `Re-run jobs`를 누르면 수정 이전 Commit으로 다시 빌드됩니다.
4. `GitHub 업로드 파일 일치 검사 (프리셋/설정)` 단계가 ✅ 표시되고 `소스 및 빌드 설정 검사`에서 18개 테스트가 통과해야 합니다.

이 복구판은 `index.html`에 필수 프리셋 코드가 없는 경우 어떤 파일을 다시 올려야 하는지 바로 보여줍니다. 테스트가 프로그램 기능을 가리도록 비활성화하지 않았습니다.

---

# Studio Prompter PRO v1.2.6 — 프리셋·통합 설정 추가

## v1.2.6 업데이트

- 상단의 별도 `단축키`, `초기화` 버튼을 제거하고 `⚙️ 설정` 팝업으로 통합했습니다.
- 설정 팝업은 **프리셋 / 단축키 / 공장초기화** 탭을 제공합니다.
- 프리셋: 현재 설정 새로 저장, 선택 적용, 덮어쓰기 수정, 이름 변경, 복제, 삭제, 기본 프리셋 지정/해제.
- `.json` 프리셋을 Mac/Windows의 시스템 파일 대화상자로 내보내거나 불러올 수 있습니다.
- **새 파일**을 만들면 기본으로 지정한 프리셋이 자동 적용됩니다. 기본 지정이 없으면 공장 출고값으로 시작합니다.
- `설정 공장초기화`는 현재 프로그램 설정만 초기화합니다. 저장된 프리셋·기본 프리셋 지정·대본은 삭제하지 않습니다.
- 프리셋 저장소는 대본과 분리되어 프로그램 데이터(localStorage)에 저장되며, .txt 파일 안에 섞이지 않습니다.
- 프리셋에는 서체·여백·리드선·스크롤·반전·단축키 등이 포함되며, 개별 PC 모니터 번호·창 분할·알림 위치·알림 시간 등 UI 위치 설정은 제외됩니다.
- 기존 v1.2.5의 송출창 첫 전체화면 문제 수정, 새 파일·저장 덮어쓰기·파일명 상태 표시를 그대로 유지합니다.

## GitHub 적용

이 ZIP 안의 `StudioPrompterPro` 폴더 *내용물*을 기존 저장소 루트에 덮어쓰고 `.github/workflows/build.yml`도 유지합니다. 기존과 같은 `Actions → Windows / Mac 프로그램 만들기`에서 빌드하세요.

## 보관 주의

현재 프로젝트를 교체하거나 프로그램을 재설치할 때도 프리셋은 일반적으로 Electron 앱 데이터에 남지만, **사용자 데이터 폴더까지 삭제하거나 앱 식별자가 변경되면 프리셋을 잃을 수 있습니다.** 중요한 프리셋은 `외부 파일로 내보내기`를 이용해 백업하세요.

---

# Studio Prompter PRO v1.2.5 — 송출창 최초 전체화면 작업표시줄 문제 수정

> **Camera DateShift v1.1.0**에서 성공적으로 사용한 Electron/GitHub Actions 배포 구성을 비교하여 이 프로젝트에 적용했습니다. **Mac 로컬 빌드 스크립트는 포함하지 않습니다.**


## 이번 v1.2.5에서 수정한 문제: 송출창을 처음 열 때 Windows 작업표시줄 노출

**문제**: 기존 송출창은 `screen.availHeight` 등 작업표시줄 영역을 **제외**한 공간으로 창 크기를 맞춘 다음, 150ms 후 브라우저 HTML Fullscreen API를 요청했습니다. 이때 사용자 동작과의 연결이 끊겨 전체화면 요청이 실패할 수 있어, 화면에 창 테두리만 없어지고 Windows 작업표시줄은 남는 증상이 발생할 수 있었습니다.

**해결**:

- Electron 실행 프로그램에서 송출창을 열면 **Electron 메인 프로세스의 `BrowserWindow.setFullScreen(true)` (Windows)** 로 실제 OS 전체화면 전환을 수행합니다. 별도의 더블클릭이 필요하지 않도록 송출 시작과 동시에 수행합니다.
- 위치와 크기는 `screen.getAllDisplays()`의 `display.bounds`를 사용해 **작업표시줄을 포함한 모니터 전체 크기**를 지정합니다. `display.workArea` 또는 `screen.availHeight`로 화면 높이를 제한하지 않습니다.
- macOS는 네이티브 `BrowserWindow.setSimpleFullScreen(true)`으로 처리하며 일반 전체화면 공간(Spaces) 전환 없이 송출합니다.
- 송출 중 **F11 / 화면 더블클릭**으로 창모드 ↔ 전체화면 전환, **송출창 모으기**, **ESC 송출 종료** 기능은 유지합니다.
- 단독 HTML 브라우저 테스트는 Electron의 네이티브 기능을 사용할 수 없으므로 기존 브라우저 전체화면 방식을 유지하되 시작 요청의 150ms 지연을 없앴습니다. 브라우저 버전에서는 환경에 따라 전체화면 허용 동작이 다를 수 있습니다.
- 기존 v1.2.4의 파일 저장/불러오기, 새 파일, `[수정됨]`, Undo/Redo, 대본 편집, 미러링과 설정 복원 기능 및 Camera DateShift 방식 GitHub 빌드는 유지합니다.

**실제 운영체제 확인 필요**: 코드 문법 및 `npm test`로 네이티브 전체화면 요청·모니터 선택·창모드 복귀를 검증했지만, 이 환경은 Linux이므로 Windows 작업표시줄이 실제로 가려지는지와 Mac 최종 창 동작은 사용자가 빌드한 앱에서 확인해야 합니다.

## 기존 v1.2.4의 추가 기능 (그대로 유지)

- **상단 `📄 새 파일` 버튼**: `저장(.txt)` 버튼 바로 왼쪽에 추가. 새 대본은 빈 내용과 기본 설정으로 시작하고, 이전 파일 경로의 연결을 끊습니다.
- **저장 여부 확인**: 이전 문서에 저장하지 않은 변경사항이 있으면 기존과 동일하게 `저장 / 저장하지 않음 / 취소`를 선택하게 됩니다. 새 파일을 만들어도 이전 파일을 자동으로 덮어쓰지 않습니다.
- **현재 파일명과 수정 상태**: 프로그램 상단 및 제목 표시줄에 `새 파일`, `새 파일 - [수정됨]`, `연설문.txt`, `연설문.txt - [수정됨]`으로 표시됩니다.
- **저장 동작**: 새 파일에서 첫 저장할 때만 저장 경로를 묻습니다. 이미 불러왔거나 저장한 TXT 프로젝트는 `⌘+S` / `Ctrl+S`로 **같은 파일에 덮어씁니다**.
- **재실행 복구**: 이전에 연 파일의 경로, 이름, 마지막 저장 상태를 로컬 자동복구 데이터에 기록하고 다음 실행 시 복원합니다. 중간에 수정한 내용은 `[수정됨]`으로 복원됩니다.
- **새 파일과 기존 파일의 독립성**: `새 파일`을 누르면 편집창·설정·파일 경로·Undo 기록이 새로 시작됩니다. 기존 TXT 파일은 직접 덮어쓰지 않습니다.

**v1.2.3에서 처음 업데이트하는 경우:** 구버전은 원본 파일의 경로를 로컬에 저장하지 않았습니다. 따라서 최초 업데이트 직후 저장된 대본을 편집하려면 `📂 불러오기(.txt)`에서 **원본 파일을 한 번만 다시 불러오세요**. 이후부터 해당 파일의 이름과 경로를 보존하므로 다음 실행에서도 같은 파일에 저장할 수 있습니다. 구버전 자동복구 내용은 보존하며, 실제 저장 여부를 모르는 경우 `새 파일 - [수정됨]`으로 표시합니다.

**주의:** macOS / Windows 앱(Electron)에서 경로 복원과 기존 파일 덮어쓰기가 지원됩니다. 단독 HTML은 브라우저의 파일 접근 허용 범위에 제한되며 일반 다운로드 방식에서는 저장 완료를 확인할 수 없습니다.

## GitHub에서 업데이트하는 방법

1. ZIP을 해제한 `StudioPrompterPro` 폴더 **안의 파일과 `.github` 폴더**를 기존 GitHub 저장소 루트에 덮어씁니다.
2. GitHub에서 변경사항을 Commit합니다.
3. `Actions → Windows / Mac 프로그램 만들기` 실행 후 `Artifacts`에서 해당 운영체제의 앱을 다운로드합니다.
4. 기존 앱을 종료하고 새 앱으로 교체합니다. 저장된 TXT 파일과 로컬 편집 환경은 자동으로 삭제하지 않습니다.

기능 검증은 `npm test`의 **13개 테스트**로 진행했습니다. 테스트 범위는 기본 빌드 설정, 새 파일 표시, 수정 상태 표시, 기존 파일 덮어쓰기, 경로 복원, 새 파일 경로 초기화, TXT 불러오기 후 저장입니다. 실제 macOS 실행 및 GitHub Actions 빌드 결과는 사용 환경에서 확인이 필요합니다.

---

## 가장 중요한 변경 (이전 v1.2.2 대비)

| 항목 | 이전 프롬프터 1.2.2 | 현재 1.2.5 (Camera DateShift 방식) |
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
6. 내부 **StudioPrompterPro-1.2.5-mac-arm64.dmg**를 열어 앱을 응용 프로그램 폴더에 복사합니다. 기존에 차단된 이전 앱은 휴지통으로 옮기고 새 DMG에서 설치합니다.
7. Finder에서 새 앱을 실행합니다. Mac의 일반적인 '확인되지 않은 개발자' 경고라면, **본인이 빌드한 파일을 신뢰하고 소스와 서명을 확인한 경우에 한해** 시스템 설정 → 개인정보 보호 및 보안 → '그래도 열기' 옵션을 확인합니다. **'악성 코드가 포함됨' 경고는 실행 우회를 하지 말고 기록과 파일을 검사해야 합니다.**

참고: GitHub Actions 실행 화면에 `macOS Ad-hoc 코드 서명 확인` 단계가 통과했는지 확인하세요. 서명이 깨졌거나 앱이 생성되지 않으면 빌드가 실패하도록 했습니다. `SHA256SUMS.txt`를 통해 다운로드 파일의 전송 무결성을 확인할 수 있습니다.

## 이번 수정에서 유지한 기능

대본 편집, Undo/Redo, Enter 검색, 줄바꿈 검색, Command+S/O, 리드선, 멀티모니터 출력 및 종료 시 저장 여부 확인을 유지합니다. **macOS Ad-hoc 서명 및 GitHub Actions 빌드 방식은 v1.2.3과 같습니다.**

## 이전 Mac 로컬 빌드 사용자가 설치물을 지우려면

동봉한 `Mac_로컬빌드_설치물_정리.command`는 **이전 v1.2.2 스크립트가 만든 전용 폴더와 사용자 홈의 앱**만 목록으로 보여주고, '삭제'를 정확히 입력하면 삭제합니다. 다른 앱에 공통으로 사용되는 `~/.npm`, `~/Library/Caches/electron`, `~/Library/Caches/electron-builder`는 지우지 않으며, 저장된 대본과 설정도 건드리지 않습니다.

터미널을 열고 `bash `를 입력한 뒤 파일을 드래그해 붙여 넣고 Enter를 누릅니다. 삭제 전 대상 파일이 맞는지 확인하세요. 백업 앱은 별도 질문을 거쳐서만 삭제합니다.

## 기술 / 확인 기준

- `.github/workflows/build.yml`: Camera DateShift v1.1.0과 동일한 `macos-latest`, `Node 22`, `npm install`, 테스트→빌드→Artifacts 업로드 흐름.
- `package.json`: `electron-builder` v26 설정에 `identity: '-'`, `hardenedRuntime: false`, `notarize: false` 적용.
- `npm test`: 소스 파일 존재 및 빌드 설정을 확인하는 단위 테스트.
- **이 작업 환경은 Linux이므로 macOS Golden Gate 27.2.1에서 실제 실행을 확인할 수 없습니다.** GitHub Actions에서 빌드와 코드서명 검사까지 완료해도 다운로드한 앱의 Gatekeeper 허용 여부는 Mac에서 확인해야 합니다.
- 공식 코드 서명 안내: https://www.electron.build/v26/docs/features/code-signing/code-signing-mac/


---

## 2026-11-12 GitHub 자동 테스트 복구 안내 (v1.2.6 StableFix)

이 패키지는 **파일 누락/버전 혼합을 탐지**합니다. 이전 복구본 자체는 18개 테스트 통과였지만 GitHub의 실제 파일이 다른 상태일 수 있습니다.

1. 이 ZIP을 로컬 컴퓨터에서 압축 해제합니다.
2. 바깥 `StudioPrompterPro` 폴더를 업로드하는 것이 아니라 **그 폴더 안에 있는 파일 및 하위 폴더 전체**를 GitHub 저장소 최상위에 올립니다. 특히 `index.html`, `package.json`, `tests` 폴더, `scripts` 폴더, 숨김 `.github` 폴더가 필요합니다.
3. GitHub 업로드 화면에서 덮어쓸 파일 목록을 확인하고 `Commit changes`를 누릅니다.
4. **새 Commit으로 자동 시작된** `Windows / Mac 프로그램 만들기`를 확인합니다. 이전 실행의 `Re-run jobs`는 이전 코드를 재실행하므로 사용하지 않습니다.
5. `GitHub 업로드 파일 일치 검사`가 실패하면 로그에 틀린 파일의 이름이 나옵니다. `소스 및 빌드 설정 검사`가 실패하면 실행 결과의 `StudioPrompter-Diagnostics-...` 진단 파일을 내려받아 `test-results.txt`를 확인합니다.

Windows 및 Mac 빌드 방식은 이전 Camera DateShift 방식 그대로입니다. 서명/공증 부재로 인한 Mac Gatekeeper 동작은 별개 문제입니다. Node 20 경고 제거를 위해 checkout/setup-node/upload-artifact를 v5로 갱신했습니다. Node 프로젝트 자체는 22로 유지합니다.


## 1.2.6 Windows CI 줄바꿈 검증 수정

기존 `scripts/verify-source.cjs`는 파일 바이트를 그대로 SHA-256으로 비교하여
GitHub Actions Windows 체크아웃(CRLF)과 원본 ZIP(LF) 사이에 가짜 버전 불일치가 발생했습니다.

- `scripts/verify-source.cjs`는 LF/CRLF 차이만 있는 경우 정상으로 판정하고, 실제 내용이 바뀌면 실패하도록 수정했습니다.
- `.gitattributes`가 GitHub 체크아웃 시 텍스트 파일의 LF 형식을 고정합니다.
- `scripts/release-files.json`과 프로그램 코드는 변경하지 않았습니다.
- Windows와 Mac 모두 기존 GitHub Actions 빌드 명령을 유지합니다.

**간단 업데이트:** GitHub 저장소의 `scripts/verify-source.cjs`를 교체하고,
최상위에 `.gitattributes`를 업로드한 뒤 새 커밋으로 빌드하세요.
