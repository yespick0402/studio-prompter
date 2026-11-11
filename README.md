# Studio Prompter PRO — macOS 보안 빌드 수정본 (1.2.1)

이전 ZIP의 `index.html`(프롬프터 화면과 기능)은 변경하지 않았습니다.
이 프로젝트는 **실행 프로그램의 macOS 빌드 및 보안 설정**만 갱신합니다.

## 왜 수정했나요?

- 이전 버전은 `mac.identity: null`이어서 **서명을 강제로 생략**했습니다.
- Apple 공증(notarization)을 하지 않았습니다.
- 오래된 Electron 31을 사용했습니다.
- Electron의 모든 브라우저 권한 요청을 자동 허용했습니다.

새 버전에서는 다음을 적용합니다.

1. Electron **45.3.0**, electron-builder **26.18.0** 고정
2. macOS 릴리스 빌드에 **Developer ID 서명 + Apple 공증 필수**
3. 서명/공증 누락 시 빌드 실패 처리 (`forceCodeSigning: true`, `mac.notarize: true`)
4. macOS 결과물의 서명·Gatekeeper 평가·공증 티켓 검사 후에만 GitHub에 업로드
5. 원래 모두 허용하던 권한을 이 프로그램의 편집창에서 요청한 **window-management(모니터 목록 조회)**만 허용

> **주의:** macOS에서 '악성 코드가 포함되어 있어서 열리지 않았습니다'라고 나오는 앱은 보안 기능을
> 끄거나 격리 속성을 제거해 실행하지 마세요. 서명되지 않았다는 사실만으로 실제 악성 코드를
> 탐지한 원인을 확정할 수는 없습니다. 기존 앱은 실행하지 말고 원인을 확인하세요.

## GitHub Actions 사용 방법

1. ZIP의 모든 파일/폴더를 GitHub 저장소에 올립니다. `.github/workflows/build.yml`도 반드시 포함하세요.
2. 아무 자격 증명 없이 Push하면 Windows 빌드만 실행합니다.
3. **Mac 배포판에는 Apple Developer Program 가입, Developer ID Application 인증서,
   Apple 공증 자격 증명**이 필요합니다. 이 인증서는 사용자 본인이 발급받아야 하며 ZIP에 포함되지 않습니다.
4. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**에서 아래 5개를 추가합니다.

| Secret 이름 | 내용 |
|---|---|
| `MAC_CSC_LINK` | Developer ID Application 인증서 `.p12` 파일을 Base64 인코딩한 문자열 |
| `MAC_CSC_KEY_PASSWORD` | `.p12`를 내보낼 때 설정한 암호 |
| `APPLE_ID` | Apple Developer 계정 이메일 |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com에서 만든 앱 암호(계정 비밀번호 X) |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

`.p12`의 base64 텍스트를 Mac에서 얻으려면 인증서를 **본인의 Mac 키체인에서 안전하게 내보낸 후**
`base64 -i /path/to/certificate.p12 | tr -d '\n'` 을 사용하세요. 인코딩 문자열은 공개 저장소나 채팅에 붙여넣지 않습니다.

5. **Actions → Build Studio Prompter PRO → Run workflow**에서
   **macOS 서명·공증 배포판도 빌드** 체크 → **Run workflow**를 누릅니다.
6. macOS job이 초록색으로 끝나고 `StudioPrompter-macOS-Notarized` 아티팩트가 업로드되면,
   해당 파일 안의 **사용 중인 Mac CPU에 맞는** `.dmg`를 설치합니다.
   - M1/M2/M3/M4/M5 계열: `arm64`
   - Intel: `x64`
7. GitHub Actions에서 서명이나 공증 검증에 실패하면 **앱이 업로드되지 않습니다**.

### Apple 개발자 계정이 없다면

Mac 배포용 서명·공증 릴리스는 만들 수 없습니다. 임시로 동봉 `index.html`을
Chrome/Edge에서 직접 열어 프롬프터 기본 기능을 사용하세요.
(브라우저에서는 파일 저장 대화상자/종료 시 3버튼 확인 등 Electron 전용 기능이 제한됩니다.)

### 기존 앱의 보안 상태 확인 (실행하지 않고 검사)

Mac의 **터미널**에서 아래 명령들을 사용해 보안 정보를 읽기만 할 수 있습니다.
원래 앱이 `/Applications/StudioPrompterPro.app`에 설치된 예시입니다.

```bash
codesign -dv --verbose=4 '/Applications/StudioPrompterPro.app' 2>&1
spctl --assess --verbose --type execute '/Applications/StudioPrompterPro.app' 2>&1
xcrun stapler validate '/Applications/StudioPrompterPro.app' 2>&1
```

설치 위치가 다르면 경로를 실제 위치로 바꾸세요. 출력에 `rejected`, `unsigned`,
`notarization` 실패 등이 보이는지 확인할 수 있습니다. 단, 이 명령만으로 악성 코드 여부를
확정할 수는 없습니다. macOS와 XProtect를 최신 상태로 유지하세요.

## 빌드에 관해 정직하게 알려드립니다

이 ZIP은 **프로젝트 소스 파일**입니다. Mac 서명용 인증서나 Apple 계정이 없으므로 여기에서
서명·공증된 `.app`을 만들어 드릴 수 없습니다. Windows/macOS 실제 실행 테스트와
GitHub Actions 성공 여부는 사용자 환경에서 최종 검증해야 합니다.

참고문서: https://support.apple.com/en-us/102445
공증 설정: https://www.electron.build/v26/docs/notarization/
서명 설정: https://www.electron.build/v26/docs/features/code-signing/code-signing-mac/
