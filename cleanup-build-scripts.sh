#!/bin/bash

# 불필요한 빌드 스크립트 정리

echo "===== 불필요한 빌드 스크립트 제거 중 ====="

# 제거할 파일 목록
FILES_TO_REMOVE=(
  "build-install.bat"
  "build-install.sh"
  "build.bat"
  "build_scripts/build-install.bat"
  "build_scripts/build-install.sh"
  "build_scripts/map-wsl.ps1"
  "build_scripts/windows-build.bat"
  "build_scripts/wsl-build.bat" 
  "build-install-internal.sh"
  "internal-install.bat"
  "dev.bat"
  "quick.bat"
  "run.bat"
  "start.bat"
)

# 파일 제거
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "제거: $file"
    rm "$file"
  else
    echo "파일이 존재하지 않음: $file"
  fi
done

echo "===== 빌드 스크립트 정리 완료 ====="
echo "남은 빌드 스크립트:"
echo "- build-internal.bat: 내부망 빌드 및 설치용"
echo "- build-external.sh: 외부망 빌드 및 설치용"