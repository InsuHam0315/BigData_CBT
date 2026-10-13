import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { lessons, sources } from "../content";
import { useStudy } from "../context";
import { Heading } from "../components/UI";

export function Guide() {
  const { profile } = useStudy();
  const next = profile.lastLessonId ?? lessons.find((l) => !profile.progress.some((p) => p.lessonId === l.id && p.completed))?.id ?? lessons[0].id;
  return <>
    <Heading eyebrow="COURSE GUIDE" title="수업 자료에서 종합 문제까지." description="노션 측 4개 자료 전체가 학습 범위입니다. 넷플릭스는 전처리부터 추천·회귀까지 모두 포함합니다." />
    <section className="panel"><h2>시험 범위 자료</h2><div className="scope-list">{sources.filter((s) => s.role === "primary").map((s) => <div key={s.id}><strong>{s.filename.normalize("NFC")}</strong><p>{{os:"시스템 소프트웨어·운영체제·Linux",intro:"빅데이터 개론·5V·활용·데이터 유형",infra:"분산 환경·수집·HDFS·저장·품질·거버넌스",netflix:"분석 환경·전처리·EDA·시각화·네트워크·텍스트·추천·회귀"}[s.id]}</p></div>)}</div><p className="muted">웹사이트 PDF 3개는 같은 주제의 설명 보강에 사용합니다. 하둡 설치·맵리듀스 실습은 지정 자료에 없는 상세 명령을 별도로 확장하지 않습니다.</p></section>
    <section className="panel"><h2>학습 순서</h2><ol className="study-steps"><li><strong>강의 읽기</strong><p>수업 개념·비교·코드의 역할과 출처를 확인합니다.</p></li><li><strong>자료 해석</strong><p>표·그래프의 관찰 단위·분모·유효 N을 확인하고 풀이를 따라갑니다.</p></li><li><strong>종합 회차 연습</strong><p>1~5회차에서 문항별 답과 해설을 확인합니다.</p></li><li><strong>시험 모드 응시</strong><p>같은 회차를 시간 안에 풀고 제출 후 결과를 확인합니다.</p></li><li><strong>오답 복습</strong><p>오답의 연결 강의와 사례로 돌아가 근거를 다시 설명합니다.</p></li></ol><div className="actions"><Link className="button" to={`/lessons/${next}`}>이어서 읽기<ArrowRight size={16} /></Link><Link className="button primary" to="/cbt">종합 회차 선택</Link></div></section>
  </>;
}
