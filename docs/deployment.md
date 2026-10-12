# GitHub Pages 공개 배포 검증

2026-10-12 공개 배포 요청에 따라 수행했다.

- 공개 주소: [빅데이터 학습실](https://insuham0315.github.io/BigData_CBT/)
- 호스트: `insuham0315.github.io`. 참고한 소웨공 사이트와 같은 계정 서브도메인에서 `/BigData_CBT/` 프로젝트 경로를 제공한다.
- 저장소/브랜치: `InsuHam0315/BigData_CBT`, `codex/bigdata-midterm-cbt`.
- 방식: GitHub Pages `build_type=workflow`, HTTPS 강제, 수동 GitHub Actions.
- 배포 콘텐츠 기준: [fdd40baac9ed57e871f21e2457f6458c75d53fd2](https://github.com/InsuHam0315/BigData_CBT/commit/fdd40baac9ed57e871f21e2457f6458c75d53fd2). 이후 안내·검증 문서와 캡처를 추가했으며 앱 코드와 콘텐츠는 변경하지 않았다.
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
