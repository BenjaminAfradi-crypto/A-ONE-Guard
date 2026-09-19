(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const state={session:null,ctx:null,employee:null,courses:[],lessons:[],progress:[],questions:[],attempts:[],acks:[],activeCourse:null,activeLesson:null,quiz:null};
  const modeLabel={learning:'Lernkurs',exam:'Prüfung',instruction:'Unterweisung'};
  const categoryLabel={'34a':'§34a','law':'Recht','deescalation':'Deeskalation','fire':'Brand & Evakuierung','first_aid':'Erste Hilfe','object':'Objekt & Einsatz','data_protection':'Datenschutz','other':'Praxis'};
  const esc=v=>AONE.esc(v??'');
  const pct=(a,b)=>b?Math.round((a/b)*100):0;

  function openDrawer(id){$(id).classList.add('open')}
  function closeDrawer(id){$(id).classList.remove('open')}
  function lessonsFor(course){return state.lessons.filter(x=>x.course_id===course.id).sort((a,b)=>a.sort_order-b.sort_order)}
  function questionsFor(course){return state.questions.filter(x=>x.course_id===course.id).sort((a,b)=>a.sort_order-b.sort_order)}
  function lessonDone(id){return state.progress.some(x=>x.lesson_id===id)}
  function attemptsFor(course){return state.attempts.filter(x=>x.course_id===course.id).sort((a,b)=>new Date(b.started_at)-new Date(a.started_at))}
  function bestAttempt(course){return attemptsFor(course).filter(x=>x.completed_at).sort((a,b)=>Number(b.score_percent||0)-Number(a.score_percent||0))[0]||null}
  function passed(course){return attemptsFor(course).some(x=>x.passed===true)}
  function courseProgress(course){const ls=lessonsFor(course);return {done:ls.filter(l=>lessonDone(l.id)).length,total:ls.length,percent:pct(ls.filter(l=>lessonDone(l.id)).length,ls.length)}}
  function totalXP(){return state.attempts.reduce((n,a)=>n+Number(a.xp_earned||0),0)}
  function completedLessonCount(){return state.progress.length}

  function courseCard(c){
    const pr=courseProgress(c), qs=questionsFor(c), best=bestAttempt(c), ok=passed(c);
    const status=ok?'<span class="pill green">Bestanden</span>':best?`<span class="pill yellow">Bestwert ${Number(best.score_percent||0).toFixed(0)}%</span>`:'<span class="pill">Offen</span>';
    const progressText=pr.total?`${pr.done}/${pr.total} Inhalte`:`${qs.length} Fragen`;
    const p=pr.total?pr.percent:(ok?100:0);
    return `<article class="course-card" data-course="${c.id}"><div class="course-top"><span class="badge">${esc(categoryLabel[c.category]||c.category)}</span>${status}</div><h3>${esc(c.title)}</h3><p>${esc(c.description||'')}</p><div class="course-meta"><span>${esc(modeLabel[c.mode]||c.mode)}</span><span>${progressText}</span><span>${Number(c.points||0)} XP</span><span>Bestehen ${Number(c.pass_percent||70)}%</span></div><div class="course-progress"><div class="row between"><small class="muted">Fortschritt</small><small>${p}%</small></div><div class="progress-line"><i style="width:${p}%"></i></div><div class="course-actions"><button class="btn primary small open-course" data-id="${c.id}">${pr.done||best?'Weiter':'Starten'}</button>${qs.length?`<button class="btn small quick-quiz" data-id="${c.id}">${c.mode==='exam'?'Prüfung starten':'Wissenscheck'}</button>`:''}</div></div></article>`;
  }

  function renderMetrics(){
    const totalLessons=state.lessons.length;
    $('#metric-xp').textContent=totalXP();
    $('#metric-passed').textContent=state.courses.filter(c=>passed(c)).length;
    $('#metric-lessons').textContent=`${pct(completedLessonCount(),totalLessons)}%`;
    $('#metric-courses').textContent=state.courses.length;
  }

  function recommendedCourses(){
    const unfinished=state.courses.filter(c=>{const p=courseProgress(c);return (p.total&&p.done<p.total)||(!passed(c)&&questionsFor(c).length)});
    const priority=['00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000205'];
    unfinished.sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id));
    return unfinished.slice(0,3).length?unfinished.slice(0,3):state.courses.slice(0,3);
  }

  function renderHome(){
    $('#recommended-grid').innerHTML=recommendedCourses().map(courseCard).join('')||'<div class="empty-learn">Keine Kurse verfügbar.</div>';
    renderRecent('#recent-list',state.attempts.slice(0,5));
  }
  function renderCourses(){
    const term=$('#course-search').value.trim().toLowerCase(),cat=$('#category-filter').value;
    const rows=state.courses.filter(c=>(!cat||c.category===cat)&&(!term||`${c.title} ${c.description||''}`.toLowerCase().includes(term)));
    $('#course-grid').innerHTML=rows.map(courseCard).join('')||'<div class="empty-learn">Keine passenden Kurse gefunden.</div>';
  }
  function renderExams(){
    const rows=state.courses.filter(c=>c.mode==='exam');
    $('#exam-grid').innerHTML=rows.map(courseCard).join('')||'<div class="empty-learn">Noch keine Prüfungen vorhanden.</div>';
  }
  function renderRecent(target,attempts){
    const root=$(target);
    if(!attempts.length){root.innerHTML='<div class="empty-learn">Noch keine abgeschlossenen Wissenschecks.</div>';return}
    root.innerHTML=attempts.map(a=>{const c=state.courses.find(x=>x.id===a.course_id);const complete=!!a.completed_at;return `<div class="result-row"><div><b>${esc(c?.title||'Kurs')}</b><div class="muted" style="font-size:12px">${AONE.dt(a.started_at)}</div></div><div><span class="pill ${a.passed===true?'green':a.passed===false?'red':''}">${complete?(a.passed?'Bestanden':'Nicht bestanden'):'Offen'}</span></div><div><b>${complete?`${Number(a.score_percent||0).toFixed(0)}%`:'—'}</b><div class="muted" style="font-size:11px">Ergebnis</div></div><div><b>${Number(a.xp_earned||0)} XP</b><div class="muted" style="font-size:11px">Punkte</div></div></div>`}).join('');
  }
  function renderResults(){renderRecent('#result-list',state.attempts)}
  function renderAll(){renderMetrics();renderHome();renderCourses();renderExams();renderResults()}

  function showTab(tab){
    $$('.learn-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    ['home','courses','exams','results'].forEach(x=>$('#tab-'+x).classList.toggle('hidden',x!==tab));
  }

  async function hashText(text){
    const bytes=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function instructionHash(course){const ls=lessonsFor(course);return hashText(course.id+'|'+ls.map(l=>`${l.id}|${l.title}|${l.content}`).join('|'))}

  async function openCourse(id){
    const c=state.courses.find(x=>x.id===id);if(!c)return;state.activeCourse=c;state.activeLesson=null;
    $('#drawer-category').textContent=`${categoryLabel[c.category]||c.category} · ${modeLabel[c.mode]||c.mode}`;
    $('#drawer-title').textContent=c.title;$('#drawer-description').textContent=c.description||'';
    $('#lesson-view').classList.add('hidden');$('#lesson-list').classList.remove('hidden');
    renderCourseDrawer();openDrawer('#course-drawer');
  }

  async function renderCourseDrawer(){
    const c=state.activeCourse;if(!c)return;const ls=lessonsFor(c),pr=courseProgress(c),qs=questionsFor(c),best=bestAttempt(c);
    $('#drawer-progress').innerHTML=`<div class="row between"><span class="muted">Lernfortschritt</span><b>${pr.total?`${pr.done}/${pr.total}`:'Kein Lesemodul'}</b></div>${pr.total?`<div class="progress-line" style="margin-top:7px"><i style="width:${pr.percent}%"></i></div>`:''}${best?`<div class="notice-strip" style="margin-top:10px">Bester Wissenscheck: <b>${Number(best.score_percent||0).toFixed(0)}%</b> · ${best.passed?'bestanden':'noch nicht bestanden'}</div>`:''}`;
    $('#lesson-list').innerHTML=ls.length?ls.map((l,i)=>`<div class="lesson ${lessonDone(l.id)?'done':''}" data-lesson="${l.id}"><strong>${lessonDone(l.id)?'✓ ':''}${i+1}. ${esc(l.title)}</strong><small>${esc(l.summary||'')} · ca. ${l.duration_minutes} Min.</small></div>`).join(''):'<div class="empty-learn">Dieser Kurs besteht nur aus einem Wissenscheck.</div>';
    const buttons=[];
    if(qs.length)buttons.push(`<button class="btn primary" id="drawer-start-quiz">${c.mode==='exam'?'Prüfung starten':'Wissenscheck starten'} · ${qs.length} Fragen</button>`);
    if(c.mode==='instruction'&&ls.length&&pr.done===pr.total){
      const h=await instructionHash(c);const acknowledged=state.acks.some(a=>a.course_id===c.id&&a.content_hash===h);
      buttons.push(acknowledged?'<span class="pill green">Kenntnisnahme bestätigt</span>':'<button class="btn green" id="ack-instruction">Kenntnisnahme bestätigen</button>');
    }
    $('#course-action-row').innerHTML=buttons.join('')||'<span class="muted">Bearbeite die Lernmodule.</span>';
    $('#course-message').innerHTML='';
    $('#drawer-start-quiz')?.addEventListener('click',()=>startQuiz(c.id));
    $('#ack-instruction')?.addEventListener('click',()=>ackInstruction(c));
  }

  function openLesson(id){
    const l=state.lessons.find(x=>x.id===id);if(!l)return;state.activeLesson=l;
    $('#lesson-list').classList.add('hidden');$('#lesson-view').classList.remove('hidden');
    $('#lesson-meta').textContent=`Lernmodul · ca. ${l.duration_minutes} Min.`;$('#lesson-title').textContent=l.title;$('#lesson-content').textContent=l.content;
    $('#complete-lesson').textContent=lessonDone(l.id)?'Bereits erledigt':'Als gelesen markieren';$('#complete-lesson').disabled=lessonDone(l.id);
  }

  async function completeLesson(){
    const l=state.activeLesson;if(!l||lessonDone(l.id))return;
    AONE.loading(true,'Fortschritt wird gespeichert…');
    try{
      await AONE.insert('guard_lesson_progress',{org_id:state.ctx.org_id,employee_id:state.employee.id,lesson_id:l.id},false);
      state.progress.push({org_id:state.ctx.org_id,employee_id:state.employee.id,lesson_id:l.id,completed_at:new Date().toISOString()});
      AONE.toast('Lernmodul abgeschlossen.');openLesson(l.id);await renderCourseDrawer();renderAll();
    }catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  async function ackInstruction(course){
    const h=await instructionHash(course);if(state.acks.some(a=>a.course_id===course.id&&a.content_hash===h))return;
    AONE.loading(true,'Kenntnisnahme wird dokumentiert…');
    try{
      await AONE.insert('guard_instruction_acknowledgements',{org_id:state.ctx.org_id,employee_id:state.employee.id,course_id:course.id,content_hash:h},false);
      state.acks.push({org_id:state.ctx.org_id,employee_id:state.employee.id,course_id:course.id,content_hash:h,acknowledged_at:new Date().toISOString()});
      AONE.toast('Kenntnisnahme dokumentiert.');await renderCourseDrawer();
    }catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  async function startQuiz(courseId){
    const c=state.courses.find(x=>x.id===courseId),qs=questionsFor(c);if(!c||!qs.length)return AONE.toast('Für diesen Kurs gibt es noch keinen Wissenscheck.','warn');
    AONE.loading(true,'Wissenscheck wird gestartet…');
    try{
      const rows=await AONE.insert('guard_training_attempts',{org_id:state.ctx.org_id,employee_id:state.employee.id,course_id:c.id},true);const attempt=rows?.[0];
      if(!attempt)throw new Error('Versuch konnte nicht gestartet werden.');
      state.attempts.unshift(attempt);state.quiz={course:c,questions:qs,index:0,attempt,answered:0,locked:false,feedback:null};
      closeDrawer('#course-drawer');openDrawer('#quiz-drawer');renderQuiz();
    }catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  function selectedIndexes(){return $$('#quiz-root input[name="quiz-option"]:checked').map(x=>Number(x.value)).sort((a,b)=>a-b)}
  function renderQuiz(){
    const qz=state.quiz;if(!qz)return;const q=qz.questions[qz.index],opts=Array.isArray(q.options)?q.options:[];const exam=qz.course.mode==='exam';
    $('#quiz-root').innerHTML=`<div class="quiz-head"><div><div class="kicker">${esc(modeLabel[qz.course.mode]||qz.course.mode)}</div><h2 style="margin:4px 0">${esc(qz.course.title)}</h2></div><button class="btn small" id="quit-quiz">Beenden</button></div><div class="row between"><span class="muted">Frage ${qz.index+1} von ${qz.questions.length}</span><span>${Math.round(((qz.index)/qz.questions.length)*100)}%</span></div><div class="progress-line" style="margin:8px 0 16px"><i style="width:${Math.round(((qz.index)/qz.questions.length)*100)}%"></i></div><div class="quiz-card"><div class="kicker">${esc(q.module||'Wissen')}</div><div class="question">${esc(q.prompt)}</div><div>${opts.map((o,i)=>`<label class="quiz-option"><input type="${q.multiple_choice?'checkbox':'radio'}" name="quiz-option" value="${i}"><span>${esc(o)}</span></label>`).join('')}</div><div id="answer-feedback"></div><div class="quiz-actions"><span class="muted">${exam?'Antworten werden erst am Ende bewertet.':'Nach jeder Antwort erhältst du direkt eine Erklärung.'}</span><button class="btn primary" id="submit-answer">${qz.index===qz.questions.length-1?'Antworten & abschließen':'Antwort prüfen'}</button></div></div>`;
    $('#quit-quiz').onclick=()=>{if(confirm('Wissenscheck wirklich beenden? Der Versuch bleibt als offen gespeichert.')){closeDrawer('#quiz-drawer');state.quiz=null;loadData()}};
    $$('.quiz-option').forEach(l=>l.addEventListener('click',()=>setTimeout(()=>{$$('.quiz-option').forEach(x=>x.classList.toggle('selected',!!x.querySelector('input')?.checked))},0)));
    $('#submit-answer').onclick=submitAnswer;
  }

  async function submitAnswer(){
    const qz=state.quiz;if(!qz||qz.locked)return;const selected=selectedIndexes();if(!selected.length)return AONE.toast('Bitte eine Antwort auswählen.','warn');qz.locked=true;$('#submit-answer').disabled=true;
    const q=qz.questions[qz.index];
    try{
      const result=await AONE.rpc('guard_submit_answer',{p_attempt:qz.attempt.id,p_question:q.id,p_selected:selected});qz.answered++;
      if(qz.course.mode==='learning'){
        const box=$('#answer-feedback');box.className=`answer-feedback ${result.correct?'good':'bad'}`;box.innerHTML=`<b>${result.correct?'Richtig':'Nicht richtig'}</b><div style="margin-top:5px">${esc(result.explanation||'')}</div>`;
        $('#submit-answer').textContent=qz.index===qz.questions.length-1?'Ergebnis anzeigen':'Weiter';$('#submit-answer').disabled=false;$('#submit-answer').onclick=()=>advanceQuiz();qz.locked=false;
      }else await advanceQuiz();
    }catch(e){qz.locked=false;$('#submit-answer').disabled=false;AONE.toast(e.message,'err')}
  }

  async function advanceQuiz(){
    const qz=state.quiz;if(!qz)return;
    if(qz.index<qz.questions.length-1){qz.index++;qz.locked=false;renderQuiz();return}
    AONE.loading(true,'Ergebnis wird berechnet…');
    try{
      const result=await AONE.rpc('guard_finish_attempt',{p_attempt:qz.attempt.id});
      qz.attempt.completed_at=new Date().toISOString();qz.attempt.score_percent=result.score_percent;qz.attempt.passed=result.passed;qz.attempt.xp_earned=result.xp_earned;
      renderQuizResult(result,qz.course);
    }catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  function renderQuizResult(result,course){
    const score=Number(result.score_percent||0);$('#quiz-root').innerHTML=`<div class="result-screen"><div class="kicker">Wissenscheck abgeschlossen</div><h2>${esc(course.title)}</h2><div class="result-score ${result.passed?'status-ok':'status-bad'}">${score.toFixed(0)}%</div><h3>${result.passed?'Bestanden':'Noch nicht bestanden'}</h3><p class="muted">Bestehensgrenze: ${course.pass_percent}% · ${result.passed?`${result.xp_earned} XP erhalten`:'Du kannst den Kurs wiederholen.'}</p><div class="row wrap" style="justify-content:center;margin-top:18px"><button class="btn primary" id="result-done">Zur Lernwelt</button><button class="btn" id="result-repeat">Nochmal versuchen</button></div></div>`;
    $('#result-done').onclick=async()=>{closeDrawer('#quiz-drawer');state.quiz=null;await loadData()};
    $('#result-repeat').onclick=()=>{closeDrawer('#quiz-drawer');state.quiz=null;startQuiz(course.id)};
  }

  async function loadData(){
    AONE.loading(true,'Lernwelt wird geladen…');
    try{
      state.session=await AONE.session();if(!state.session){location.replace('./login.html');return}
      state.ctx=await AONE.chooseContext();if(!state.ctx){location.replace('./login.html');return}
      const emp=await AONE.table('guard_employees',`select=id,display_name,email,status&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&user_id=eq.${encodeURIComponent(state.session.user.id)}&limit=1`);state.employee=emp?.[0];if(!state.employee)throw new Error('Mitarbeiterprofil nicht gefunden.');
      const [courses,lessons,questions,progress,attempts,acks]=await Promise.all([
        AONE.table('guard_courses','select=id,org_id,title,category,description,mode,points,pass_percent,published&published=eq.true&order=title.asc'),
        AONE.table('guard_learning_lessons','select=id,course_id,title,summary,content,duration_minutes,sort_order,published&published=eq.true&order=course_id.asc,sort_order.asc'),
        AONE.table('guard_question_prompts','select=id,course_id,module,prompt,options,multiple_choice,sort_order&order=course_id.asc,sort_order.asc'),
        AONE.table('guard_lesson_progress',`select=org_id,employee_id,lesson_id,completed_at&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&employee_id=eq.${encodeURIComponent(state.employee.id)}`),
        AONE.table('guard_training_attempts',`select=id,org_id,employee_id,course_id,started_at,completed_at,score_percent,passed,xp_earned&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&employee_id=eq.${encodeURIComponent(state.employee.id)}&order=started_at.desc&limit=100`),
        AONE.table('guard_instruction_acknowledgements',`select=id,org_id,employee_id,course_id,content_hash,acknowledged_at&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&employee_id=eq.${encodeURIComponent(state.employee.id)}&order=acknowledged_at.desc`)
      ]);
      state.courses=courses||[];state.lessons=lessons||[];state.questions=questions||[];state.progress=progress||[];state.attempts=attempts||[];state.acks=acks||[];
      $('#org-name').textContent=state.ctx.org?.name||'Training & Wissen';$('#who').textContent=state.employee.display_name||state.session.user.email||'';renderAll();
    }catch(e){AONE.toast(e.message||'Lernwelt konnte nicht geladen werden.','err')}finally{AONE.loading(false)}
  }

  function bind(){
    $$('.learn-tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));$$('[data-tab-go]').forEach(b=>b.onclick=()=>showTab(b.dataset.tabGo));
    $('#course-search').addEventListener('input',renderCourses);$('#category-filter').addEventListener('change',renderCourses);
    document.body.addEventListener('click',e=>{const open=e.target.closest('.open-course');if(open)openCourse(open.dataset.id);const q=e.target.closest('.quick-quiz');if(q)startQuiz(q.dataset.id);const lesson=e.target.closest('.lesson');if(lesson)openLesson(lesson.dataset.lesson)});
    $('#close-drawer').onclick=()=>closeDrawer('#course-drawer');$('#back-lessons').onclick=()=>{$('#lesson-view').classList.add('hidden');$('#lesson-list').classList.remove('hidden')};$('#complete-lesson').onclick=completeLesson;
    $('#course-drawer').addEventListener('click',e=>{if(e.target.id==='course-drawer')closeDrawer('#course-drawer')});
    $('#quiz-drawer').addEventListener('click',e=>{if(e.target.id==='quiz-drawer'&&!state.quiz)closeDrawer('#quiz-drawer')});
    $('#continue-btn').onclick=()=>{const c=recommendedCourses()[0];if(c)openCourse(c.id);else showTab('courses')};
    $('#logout').onclick=()=>{AONE.signOut();location.replace('./login.html')};
  }
  bind();loadData();
})();
