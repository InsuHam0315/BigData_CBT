# GitHub Pages 공개 배포 검증

2026-10-12 공개 배포 요청에 따라 수행했다.

- 공개 주소: [빅데이터 학습실](https://insuham0315.github.io/BigData_CBT/)
- 호스트: `insuham0315.github.io`. 참고한 소웨공 사이트와 같은 계정 서브도메인에서 `/BigData_CBT/` 프로젝트 경로를 제공한다.
- 저장소/브랜치: `InsuHam0315/BigData_CBT`, `codex/bigdata-midterm-cbt`.
- 방식: GitHub Pages `build_type=workflow`, HTTPS 강제, 수동 GitHub Actions.
- 첫 공개 배포 콘텐츠 기준: [fdd40baac9ed57e871f21e2457f6458c75d53fd2](https://github.com/InsuHam0315/BigData_CBT/commit/fdd40baac9ed57e871f21e2457f6458c75d53fd2). 아래 표는 이 첫 배포의 검증 결과다. 이후 글씨 크기 개선 검증은 [기능 검증 문서](functional-tests.md), 최신 반영 버전은 [작업 브랜치](https://github.com/InsuHam0315/BigData_CBT/tree/codex/bigdata-midterm-cbt)와 [Pages 실행 기록](https://github.com/InsuHam0315/BigData_CBT/actions/workflows/pages.yml)을 확인한다.
- [배포 실행 38265693195](https://github.com/InsuHam0315/BigData_CBT/actions/runs/38265693195): completed / success. 빌드 및 배포 job 모두 success.

| 검사 | 결과 |
|---|---|
| GitHub Linux / Node 22 `npm ci` | PASS |
| GitHub 콘텐츠 검사, 17개 테스트, production 빌드 | PASS |
| 인증 없이 공개 HTTPS GET | HTTP 200, 학습실 HTML 제목 확인 |
| CSS·앱·runtime·콘텐츠·vendor 자산 | 5개 모두 HTTP 200, 각 SHA-256이 검증한 로컬 빌드와 일치 |
| 앱 브라우저 홈 | 28강의·39사례·195문항 및 메뉴 정상 표시 |
| H4 직접 링크와 새로고침 | 회귀·Ridge·학습/테스트·MAE 강의와 자산 정상 |
| C24 구성비 보기 | Movie 60%, TV Show 40%, 분모 20 표시 |
| 자료 → CBT | C24 필터·5문항·자료/사례 연결 정상 |
| 브라우저 콘솔 | 오류/경고 0 |

![공개 학습실](screenshots/github-pages-home.jpg)

정적 배포 파일은 `dist`의 HTML·CSS·JavaScript만 포함한다. 원본 PDF, 로컬 인증 DB, 개인 학습 기록, 백업, API 토큰은 포함하지 않았다. GitHub API용 작업 스크립트는 무시되는 로컬 임시 경로에만 두었으며 인증값을 파일이나 로그에 기록하지 않았다.

사이트 접속은 공개 네트워크에서 가능하다. 회원가입/로그인과 기록 저장은 기존 명세대로 각 브라우저의 IndexedDB를 사용하며 서버 계정·기기 간 자동 동기화는 제공하지 않는다. 로컬 주소에서 사용하던 기록은 백업 내보내기/가져오기로 명시적으로 이전할 수 있다.

## 전체 강의 보강 버전 · 2026-10-13

같은 Pages 주소와 `codex/bigdata-midterm-cbt` 브랜치를 사용한다. 28강의의 본문 약 4.2배, 39개 연결 풀이, 28개 실행 검증 코드, 84개 추가 자가 점검을 포함한다. [강의별 보강 검증](lesson-upgrade.md)에 범위·출력·브라우저 확인을 기록했다. 최신 반영 SHA와 배포 성공 여부는 [Pages 실행 기록](https://github.com/InsuHam0315/BigData_CBT/actions/workflows/pages.yml)의 해당 실행에서 확인할 수 있다.

Pages 빌드는 Python 3.12에서 28개 코드 출력과 기존 39개 정답/9개 변환을 검산하고 콘텐츠 검사·17개 테스트·production 빌드를 수행한다. 콘텐츠를 강의/사례/문항 파일로 나누어 큰 단일 번들을 줄였다. 배포 반영 확인은 공개 HTML과 자산 7개의 HTTP 200 및 로컬 `dist`와의 SHA-256 일치, 실제 강의 화면의 보강 내용 확인으로 수행한다. 기존 로그인·학습 기록의 저장 계약과 CBT 대상 ID는 유지한다.
