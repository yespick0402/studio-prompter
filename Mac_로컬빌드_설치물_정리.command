#!/bin/bash
# StudioPrompterPro v1.2.2 로컬 빌드 전용 파일 제거
# 일반 설정/문서/공유 캐시는 건드리지 않습니다.
set -euo pipefail
if [[ "$(uname -s)" != 'Darwin' ]]; then
  echo 'Mac에서만 실행할 수 있습니다.'; exit 1
fi
HOME_DIR="$HOME"
TARGETS=(
  "$HOME_DIR/Library/Caches/StudioPrompterPro"
  "$HOME_DIR/Library/Application Support/StudioPrompterPro/LocalBuild"
  "$HOME_DIR/Library/Logs/StudioPrompterPro"
  "$HOME_DIR/Applications/StudioPrompterPro.app"
)
echo '=== StudioPrompterPro 1.2.2 로컬 빌드 설치물 검사 ==='
echo '이번 스크립트는 아래 나열된 정확한 경로만 삭제합니다.'
echo '사용자가 만든 대본, 프롬프터 설정, 다른 프로젝트 앱 및 공용 npm/Electron 캐시는 보존합니다.'
echo
FOUND=0
for p in "${TARGETS[@]}"; do
  if [[ -e "$p" || -L "$p" ]]; then
    FOUND=1
    printf '삭제 예정: %s
' "$p"
    du -sh "$p" 2>/dev/null || true
  else
    printf '없음: %s
' "$p"
  fi
done
if [[ "$FOUND" != '1' ]]; then
  echo '전용 설치물이 발견되지 않았습니다.'
else
  echo
  read -r -p "위 전용 설치물을 지우려면 정확히 '삭제'를 입력하세요: " CONFIRM
  if [[ "$CONFIRM" == '삭제' ]]; then
    for p in "${TARGETS[@]}"; do
      if [[ -e "$p" || -L "$p" ]]; then
        rm -rf -- "$p"
        echo "삭제 완료: $p"
      fi
    done
  else
    echo '취소했습니다. 파일을 삭제하지 않았습니다.'
  fi
fi
# 로컬 빌드가 만든 이전 앱 백업이 있을 경우 별도로 확인
shopt -s nullglob
BACKUPS=("$HOME_DIR"/Applications/StudioPrompterPro-backup-*.app)
if (( ${#BACKUPS[@]} > 0 )); then
  printf '
이전 앱 백업이 %s개 발견되었습니다.
' "${#BACKUPS[@]}"
  printf '%s
' "${BACKUPS[@]}"
  read -r -p "위 백업 앱도 지우려면 정확히 '백업삭제'를 입력하세요: " CHOICE
  if [[ "$CHOICE" == '백업삭제' ]]; then
    for p in "${BACKUPS[@]}"; do
      rm -rf -- "$p"
      echo "백업 앱 삭제 완료: $p"
    done
  else
    echo '이전 앱 백업은 그대로 보존했습니다.'
  fi
fi
printf '
정리 완료. 시스템 전체 Node.js를 설치하거나 보안 설정을 변경한 적은 없습니다.
'
printf 'npm/Electron 공용 캐시 및 저장된 대본·설정은 보존했습니다.
'
