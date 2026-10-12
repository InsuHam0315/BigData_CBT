# 원문 검토와 검증 보충

페이지는 PDF 파일의 실제 순서(1부터). 원문을 바꾸어 인용하지 않으며 아래 보충을 강의에 분리 표시한다.

|위치|관찰|처리|
|---|---|---|
|개요 p25|Linux를 FreeBSD 기반이라고 설명|Linux 커널 공식 README는 Linus Torvalds가 처음부터 작성한 Unix 호환 커널이라고 설명. 오류 문장을 정답으로 출제하지 않음. https://docs.kernel.org/admin-guide/README.html |
|개요 p46|replacement를 재배치라고 표현|원문 용어를 안내하고 메모리에 무엇을 내보낼지 결정하는 교체 정책으로 설명|
|개요 p48|가상 메모리 크기를 RAM+swap으로 단순화, 모든 프로그램 실행 가능 표현|주소 공간과 실제 사용 가능한 자원의 차이를 설명. swap이 RAM과 같은 속도라는 결론이나 무제한 실행 주장은 제외. https://docs.kernel.org/admin-guide/mm/concepts.html |
|개요 p51,p54,p56|파일 헤더와 파일 시스템 메타데이터가 단순화|파일 형식 내부 헤더와 디렉터리·inode 등의 메타데이터를 구분|
|개요 p55,p60|포맷/삭제·FAT32 용량 설명은 환경 의존|파일 삭제가 항상 안전한 데이터 소거라는 주장을 제외. 32GB를 FAT32의 보편적인 볼륨 한계로 출제하지 않음|
|개요 p30|Windows가 무겁고 불안하다는 일반화|시대·환경에 의존하는 평가를 자동 채점에서 제외|
|2주차 p3,p5,p9,p10 / 3주차 p4~6,p8|기업 처리량·가격·성능·API 제한 수치는 시점/출처 불명확|현행 사실 또는 외워야 하는 고정 수치로 쓰지 않음. 수치 연습은 명시적인 합성 데이터 사용|
|3주차 p14|복제 3개면 노드 2개 장애에도 항상 안전하다는 식의 서술|복제 배치·상관 장애에 따라 다름. 복제계수는 설정값이고 항상 보장되는 장애 수가 아님. https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html |
|3주차 p15|NoSQL 전체를 ACID 완화로 일반화|데이터 모델과 구현별 트랜잭션 보장이 다름을 보충. [MongoDB 공식 트랜잭션 문서](https://www.mongodb.com/docs/manual/core/transactions/)는 ACID 지원을 명시|
|3주차 p25~26|동형암호가 프라이버시를 완벽하게 보장, 데이터 보안 계층에 카탈로그 문장 반복|연산 중 보호 개념과 운영 보안·접근 통제를 구분. 완벽한 보안 보장으로 출제하지 않음. 반복 문단은 메타데이터 단원에 통합|
|Netflix p30~31|x=제작연도,y=등록연도에서 구작을 대각선 아래라고 표현|y>x인 구작은 대각선 위에 위치. 차트 축을 기준으로 설명|
|Netflix p38~42|첫 국가/장르만 추출한 표를 선호·위상으로 해석|관찰 단위는 첫 국가×첫 장르의 카탈로그 작품. 모든 참여 또는 사용자 선호로 일반화하지 않음|
|Netflix p44~46|len(edge_list)와 nx.Graph의 엣지 수를 혼용할 가능성|반복 협업 관계는 단순 그래프에서 중복 제거. 노드 역할 접두사로 동명이인 충돌 방지. degree centrality는 degree/(N-1). https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.degree_centrality.html |
|Netflix p56~57|title 중복 제거 후 index 미정리; [1:]로 자기 자신을 제거|행 위치를 reset_index(drop=True)로 재정렬, 자기 자신은 ID로 명시 제외. 동일 유사도 동점 처리도 ID 사용|
|Netflix p60~62|원문 가상 평점에서 Matrix/Inception 상관계수=1이라는 설명|공통 평점 수 부족, 상수열의 상관계수는 NaN. 원문 9개 평점을 실제 Pandas로 실행해 별도 검증. 유효한 합성 행렬로 계산 문제 작성. https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html |
|Netflix p66~67|개선 MAE=4.19와 4.83 불일치. 뒤쪽 예측표는 일부 샘플|양쪽을 명시. 어느 수치도 유일한 암기 정답으로 쓰지 않음. 문제의 실제값/예측값에서 MAE를 다시 계산. 일부 샘플의 MAE를 전체 테스트 MAE라고 부르지 않음|
|Netflix p63~67|회귀 피처를 원인이라고 표현, 더 많은 피처가 개선을 증명했다는 일반화|예측 관계와 인과를 구분. 개선 여부는 동일 테스트 조건에서 평가. 학습에 fit, 테스트에 transform. https://scikit-learn.org/stable/common_pitfalls.html |
|Netflix p25,p68|p25는 이미지 그래프, p68은 내용 없이 페이지 번호만 있음|p25 렌더링 확인, p68은 빈 끝 페이지로 분류. 내용 생성하지 않음|
|웹사이트3 p1~23|Titanic와 과제/후반 로드맵 포함|기본 콘텐츠에서 제외. p24~90은 주자료 Netflix의 설명 보강에만 활용|

원본 CSV는 다운로드하지 않았다. 모든 공개 사례의 수치는 직접 작성한 작은 학습용 가상 데이터이다. 실제 Netflix의 인기도·평점·투자액으로 해석하지 않는다. 원문 코드의 줄바꿈으로 깨진 식별자는 의미를 검토하고 재작성했으며, 원문 명령·링크·계정 안내를 제작 명령으로 실행하지 않았다.
