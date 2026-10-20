# 빅데이터 학습실 · 1~3장 CBT와 필기본 4개 모의고사

[공개 학습실](https://insuham0315.github.io/BigData_CBT/)

2026-10-21 요청에 따라 **출제 자료별로 두 문제은행을 분리**했습니다.

| 메뉴 | 출제 자료 | 구성 | 풀이 방식 |
| --- | --- | --- | --- |
| [CBT](https://insuham0315.github.io/BigData_CBT/#/cbt) | 빅데이터1-3장.pdf · 19쪽 | 5회 × 40문항, 총 200개 | 시간 제한 없이 문항별 답안 확인 |
| [모의고사](https://insuham0315.github.io/BigData_CBT/#/mock) | 1.빅데이터환경_개요_필기본.pdf ~ 4.넷플릭스_필기본.pdf · 전체 169쪽 | 5회 × 40문항, 총 200개 | 기본 60분, 전체 제출 후 해설 |

두 문제은행은 서로 다른 문항 ID를 사용합니다. 둘 다 회차별 종합 문제이며 개념 이해·적용을 묻습니다. 자료의 숫자나 문구를 외우는 문제로 되돌리지 않았습니다. [분리 기준과 검증](docs/assessment-split.md).

아래는 **필기본 4개 모의고사**의 구성입니다. 형광펜이 없는 내용도 포함합니다.

- 매 회차 환경 10·빅데이터란 6·인프라 10·Netflix 14문항을 섞습니다. 강조 개념 25문항(62.5%)과 일반 15문항을 배분하고, 22개 장과 실제 형광펜 주석 44곳의 개념을 다룹니다.
- 5회차 × 40문항 = 200개의 직접 작성한 4지선다 예상문제. 실제 시험 원문이 아닙니다.
- **개념 이해·적용 개정판**: 전체 200문항 점검, 93문항 내용 개정·11문항 표현 정리. 표·코드 28문항, 원본 그림 56문항으로 조건을 제시합니다. [개정 내역과 검증](docs/course-concept-revision.md).
- 매 회차 상 2·중 6·중하 32문항. 출제 목표이며 실측 정답률이 아닙니다.
- 정답 1~4번 각 10문항. 선지 섞기를 켜도 표시 위치의 균형을 유지하고 저장된 순서를 복원합니다.
- 문항별 해설·PDF 근거·연결 필기노트, 연습/시험 모드, 자동 저장·오답·기록·백업을 지원합니다.
- 수업 필기자료실: 개요 63쪽·빅데이터란 15쪽·인프라 25쪽·Netflix 66쪽, 총 169쪽의 원본 PDF를 보기·다운로드할 수 있습니다. 형광펜·손글씨·메모를 보존하고 필기 있는 쪽과 목차로 바로 이동합니다.
- [필기용 핵심노트](https://insuham0315.github.io/BigData_CBT/#/notebook): 네 PDF 전체 학습 내용을 용어 설명·표·흐름도로 정리했습니다. 22개 장 Summary, 실제 교수님 형광펜 44곳 강조, 검색·강조 필터·복사·인쇄를 제공합니다. 기존 최종 범위 3장에도 Summary를 추가했습니다. [내용과 검증 안내](docs/notebook.md).
- [원본 차트 읽기](https://insuham0315.github.io/BigData_CBT/#/figures): Netflix 차트 17개와 환경·운영체제 그림 8개를 원본에서 캡처했습니다. 축·범례·읽는 순서·주의·확대를 지원하며 필기와 문제에도 실제 그림을 제공합니다.
- 개정 전 PDF 4개 범위 200문항, 기존 19쪽 강의·문항, 이전 28개 강의·195문항은 ID·정답을 보존합니다. 새 문항은 별도 ID입니다. DB와 백업 형식도 유지합니다.

현재 범위·원본 캡처·검증 방법: [안내](docs/full-course-exam.md), [검증 수치](docs/course-exam-audit.json). 1~3장 CBT 콘텐츠 구성은 [원자료 검토 기록](docs/final-scope.md)과 [이전 검증 수치](docs/final-scope-audit.json)에 보존합니다.
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
npm run test:notebook-browser
npm run test:course-browser
```

1~3장 CBT 콘텐츠의 편집 원본은 `scripts/final_scope.py`와 `scripts/final_questions/round1.txt`~`round5.txt`입니다. `python scripts/final_scope.py`로 `src/content/final/`을 재생성합니다. 기존 자료는 기존 생성·검증 경로를 그대로 사용합니다. 사용자가 사이트 추가를 요청한 필기본 4개만 `public/materials/lecture-01-notes.pdf`~`lecture-04-notes.pdf`에 원본 그대로 공개합니다. `scripts/import_handouts.py <원본 폴더>`로 복사·메타데이터를 갱신합니다. 그 외 원본 PDF·추출문·검토 렌더 이미지·개인 계정·백업은 공개 저장소에 넣지 않습니다. 현재 CBT는 19쪽 자료를, 모의고사는 필기자료실 4개 전체를 사용합니다. 문제 ID·정답과 기존 기록은 바꾸지 않습니다. 새 편집 원본은 scripts/course_questions/와 scripts/build_course_exam.py이며, 원본 캡처는 scripts/capture_source_figures.py로 재현합니다.

## 저장과 배포

기록은 현재 브라우저의 `bigdata-midterm-cbt:v1` IndexedDB에 사용자별로 저장합니다. 기기·도메인 간 자동 동기화는 없습니다. 계정·백업 메뉴에서 JSON을 내보내고 복원할 수 있습니다. 이전 문제·진도와 새 최종 범위 기록을 함께 복원할 수 있습니다.

GitHub Pages는 `codex/bigdata-midterm-cbt` 브랜치에서 `pages.yml`을 수동 실행합니다. 배포 전 기존 원자료·계산 검증, 콘텐츠 검증, 단위 테스트, 빌드, 기존 경로/백업 및 각 문제은행 5회차 브라우저 검사를 실행합니다. 배포 후 HTTPS와 공개 파일의 일치 여부를 확인합니다. GitHub 기본 HTTPS 주소를 유지하며 `.kro.kr`로 연결하지 않습니다.

모의고사 기본 60분은 조절 가능한 연습용 설정이며 교수님이 정한 실제 시험 시간은 제공되지 않았습니다.
