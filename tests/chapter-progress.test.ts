import 'fake-indexeddb/auto';
import { it,expect } from 'vitest';
import { readChapter,readLesson,getProfile,updateProfile,toggleBookmark,exportBackup,validateBackup,importBackup } from '../src/storage';

it('장 전체 완료와 해제가 기존 단원 진도·다른 장·다른 사용자 기록을 보존한다',async()=>{
 const owner='chapter-fixture';
 await readLesson(owner,'A2',true);await readLesson(owner,'B1',true);
 await readLesson('other-chapter-fixture','A1',true);
 const created=(await getProfile(owner)).progress.find(p=>p.lessonId==='A2')!.createdAt;
 let p=await readChapter(owner,'A',true);
 expect(p.progress.filter(p=>p.lessonId.startsWith('A')&&p.completed)).toHaveLength(5);
 expect(p.progress.find(p=>p.lessonId==='A2')!.createdAt).toBe(created);
 p=await readChapter(owner,'A',false);
 expect(p.progress.filter(x=>x.completed).map(x=>x.lessonId)).toEqual(['B1']);
 expect((await getProfile('other-chapter-fixture')).progress[0].completed).toBe(true);
});

it('장 완료와 북마크 동시 저장 및 기존 백업 형식의 복원이 유지된다',async()=>{
 const owner='chapter-backup-fixture';
 await updateProfile(owner,p=>{p.settings.theme='light';});
 await Promise.all([readChapter(owner,'H',true),toggleBookmark(owner,'H4','lesson')]);
 const p=await getProfile(owner);
 expect(p.progress.filter(x=>x.completed)).toHaveLength(4);
 expect(p.bookmarks.some(x=>x.targetId==='H4')).toBe(true);
 const backup=exportBackup(p);
 expect(validateBackup(backup).lastLessonId).toBe('H1');
 await importBackup('chapter-import-fixture',backup,'replace');
 const restored=await getProfile('chapter-import-fixture');
 expect(restored.progress.every(x=>x.userId==='chapter-import-fixture')).toBe(true);
 expect(restored.bookmarks[0].targetId).toBe('H4');
 expect(restored.settings.theme).toBe('light');
});
