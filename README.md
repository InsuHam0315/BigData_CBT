# 빅데이터 학습실 · 최종 시험 범위

[공개 학습실](https://insuham0315.github.io/BigData_CBT/)

2026-10-19 전달받은 **빅데이터1-3장.pdf (19쪽)**를 기준으로 필기노트와 모의고사를 개편했습니다.

- 1~3장 필기노트: 장마다 한 페이지, 19개 단원. 원자료 쪽수와 PDF 코드 읽기, 학습용 수치의 조건을 표시합니다.
- 5회차 × 40문항 = 200개의 직접 작성한 4지선다 예상문제. 실제 시험 원문이 아닙니다.
- 매 회차 상 2·중 6·중하 32문항. 출제 목표이며 실측 정답률이 아닙니다.
- 정답 1~4번 각 10문항. 선지 섞기를 켜도 표시 위치의 균형을 유지하고 저장된 순서를 복원합니다.
- 문항별 해설·PDF 근거·연결 필기노트, 연습/시험 모드, 자동 저장·오답·기록·백업을 지원합니다.
- 수업 필기자료실: 개요 63쪽·빅데이터란 15쪽·인프라 25쪽·Netflix 66쪽, 총 169쪽의 원본 PDF를 보기·다운로드할 수 있습니다. 형광펜·손글씨·메모를 보존하고 필기 있는 쪽과 목차로 바로 이동합니다.
- 이전 28개 강의·39개 가상 사례·195문항과 ID는 보관함에 보존합니다. DB 이름과 백업 형식도 유지합니다.

현재 범위의 페이지 연결과 선지 길이 검토: [검토 기록](docs/final-scope.md), [검증 수치](docs/final-scope-audit.json).
이전 자료 설명은 [보관 문서](docs/archive-readme.md)에서 볼 수 있습니다.

## 실행과 검증

```sh
npm ci
npm run dev
npm run validate
npm test
npm run build
npm run preview
# 미리보기 서버가 열린 상태에서:
npm run test:browser
npm run test:final-browser
npm run test:handout-browser
```

최종 범위 콘텐츠의 편집 원본은 `scripts/final_scope.py`와 `scripts/final_questions/round1.txt`~`round5.txt`입니다. `python scripts/final_scope.py`로 `src/content/final/`을 재생성합니다. 기존 자료는 기존 생성·검증 경로를 그대로 사용합니다. 사용자가 사이트 추가를 요청한 필기본 4개만 `public/materials/lecture-01-notes.pdf`~`lecture-04-notes.pdf`에 원본 그대로 공개합니다. `scripts/import_handouts.py <원본 폴더>`로 복사·메타데이터를 갱신합니다. 그 외 원본 PDF·추출문·검토 렌더 이미지·개인 계정·백업은 공개 저장소에 넣지 않습니다. 필기자료실의 보충·심화 내용이 19쪽 최종 범위나 기존 200문항의 범위를 자동 확대하지 않습니다.

## 저장과 배포

기록은 현재 브라우저의 `bigdata-midterm-cbt:v1` IndexedDB에 사용자별로 저장합니다. 기기·도메인 간 자동 동기화는 없습니다. 계정·백업 메뉴에서 JSON을 내보내고 복원할 수 있습니다. 이전 문제·진도와 새 최종 범위 기록을 함께 복원할 수 있습니다.

GitHub Pages는 `codex/bigdata-midterm-cbt` 브랜치에서 `pages.yml`을 수동 실행합니다. 배포 전 기존 원자료·계산 검증, 콘텐츠 검증, 단위 테스트, 빌드, 기존 경로/백업 및 새 5회차 브라우저 검사를 실행합니다. 배포 후 HTTPS와 공개 파일의 일치 여부를 확인합니다. GitHub 기본 HTTPS 주소를 유지하며 `.kro.kr`로 연결하지 않습니다.

모의고사 기본 60분은 조절 가능한 연습용 설정이며 교수님이 정한 실제 시험 시간은 제공되지 않았습니다.
