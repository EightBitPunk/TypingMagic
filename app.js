// Version 0.1.26

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.26';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    'The quick brown fox jumps over the lazy dog.',
    'Typing practice improves both speed and accuracy.',
    'Accuracy over speed.'
  ];

  // Persistence: remember last username only
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) {
    document.getElementById('username').value = lastUser;
  }

  // Utilities
  const getUsers = () => JSON.parse(localStorage.getItem('users') || '{}');
  const saveUsers = u => localStorage.setItem('users', JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem('classrooms') || '{}');
  const saveClasses = c => localStorage.setItem('classrooms', JSON.stringify(c));

  // Logout button
  let logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Log Out';
    Object.assign(logoutBtn.style, { position: 'fixed', top: '5px', right: '10px', display: 'none' });
    document.body.appendChild(logoutBtn);
    logoutBtn.onclick = () => {
      localStorage.removeItem('currentUser');
      location.reload();
    };
  }

  // DOM refs
  const loginScreen = document.getElementById('login-screen');
  const loginBtn = document.getElementById('login-btn');
  let toggleBtn = document.getElementById('toggle-mode-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button'); toggleBtn.id = 'toggle-mode-btn'; loginScreen.appendChild(toggleBtn);
  }
  const userIn = document.getElementById('username');
  const passIn = document.getElementById('password');
  const roleSel = document.getElementById('role');
  const loginMsg = document.getElementById('login-message');
  const classIn = document.getElementById('classroom-code');
  const studentWrap = document.getElementById('student-classroom-code');

  const teacherDash = document.getElementById('teacher-dashboard');
  const classSetup = document.getElementById('classroom-setup');
  const teacherView = document.getElementById('teacher-classroom-view');
  const createBtn = document.getElementById('create-classroom-btn');
  const newClassIn = document.getElementById('new-classroom-name');
  const codeDisp = document.getElementById('classroom-code-display');
  const teacherName = document.getElementById('teacher-name');
  const progTable = document.getElementById('student-progress-table');

  const studentDash = document.getElementById('student-dashboard');
  const studentName = document.getElementById('student-name');
  const promptEl = document.getElementById('prompt');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn = document.getElementById('next-btn');

  // Sign-up toggle
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? 'Sign Up' : 'Log In';
    toggleBtn.textContent = isSignUp ? 'Go to Log In' : 'Go to Sign Up';
    studentWrap.classList.toggle('hidden', !(isSignUp && roleSel.value==='student'));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // Auto-login if session exists
  const session = JSON.parse(localStorage.getItem('currentUser')||'null');
  if (session && session.username && session.role!=='admin') {
    const users = getUsers();
    if (users[session.username] && users[session.username].role===session.role) {
      enterDash(session.username, session.role);
      return;
    }
    localStorage.removeItem('currentUser');
  }

  loginBtn.onclick = () => {
    loginMsg.textContent = '';
    const u = userIn.value.trim(), p = passIn.value;
    const role = roleSel.value, code = classIn.value.trim();
    // Admin
    if (u==='KEFKA' && p==='SUCKS') { enterAdmin(); return; }
    if (!u||!p||(isSignUp&&role==='student'&&!code)) { loginMsg.textContent='Complete all fields.'; return; }
    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent='User exists.'; return; }
      users[u]={ password:p, role, progress:{}, classrooms:role==='teacher'?[]:undefined, classroomCode:role==='student'?code:undefined };
      if (role==='student') { const cls=getClasses(); cls[code].students.push(u); saveClasses(cls); }
      saveUsers(users);
      localStorage.setItem('lastUser', u);
      localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
      enterDash(u, role);
    } else {
      if (users[u]&&users[u].password===p&&users[u].role===role) {
        localStorage.setItem('lastUser', u);
        localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
        enterDash(u, role);
      } else loginMsg.textContent='Incorrect credentials.';
    }
  };

  function enterDash(u, role) {
    logoutBtn.style.display='block';
    loginScreen.classList.add('hidden');
    if (role==='teacher') {
      teacherName.textContent=u;
      teacherDash.classList.remove('hidden'); classSetup.classList.remove('hidden'); teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent=u; studentDash.classList.remove('hidden'); renderStudent(getUsers()[u].classroomCode,u);
    }
  }

  createBtn.onclick = () => {
    const n=newClassIn.value.trim(); if(!n)return;
    const code='C'+Math.floor(100000+Math.random()*900000);
    const cls=getClasses(); cls[code]={name:n,teacher:teacherName.textContent,students:[],drills:defaultDrills.slice(),customDrills:{}};
    saveClasses(cls);
    const us=getUsers(); us[teacherName.textContent].classrooms.push(code); saveUsers(us);
    codeDisp.textContent=`New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  function renderTeacher(t) {
    const us=getUsers(), cls=getClasses(); let html='';
    us[t].classrooms.forEach(code=>{ const c=cls[code]; if(!c)return;
      html+=`<h3>${c.name} (Code:${code}) <button class='custom-btn' data-code='${code}'>Customize Drills</button> <span class='del-class' data-code='${code}'>🗑️</span></h3>`;
      html+=`<div id='editor-${code}' style='display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;'><label>Date:<input type='date' id='date-${code}' /></label><br><textarea id='ta-${code}' rows='4' style='width:100%'></textarea><br><label><input type='checkbox' id='all-${code}' /> All classes</label><br><button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button></div>`;
      html+=`<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s=>{ const pr=us[s].progress||{}; Object.entries(pr).forEach(([d,arr])=>{ const avg=arr.length?Math.round(arr.reduce((x,y)=>x+y.accuracy,0)/arr.length):0; const err=arr.reduce((x,y)=>x+y.errors,0); html+=`<tr><td>${s}<span class='del-student' data-code='${code}' data-student='${s}'>🗑️</span></td><td>${d}<span class='del-date' data-code='${code}' data-date='${d}'>🗑️</span></td><td>${avg}%</td><td>${err}</td></tr>`; }); }); html+=`</table>`; }); progTable.innerHTML=html;
    us[t].classrooms.forEach(code=>{
      const cobj=cls[code]; const editor=document.getElementById(`editor-${code}`); const di=document.getElementById(`date-${code}`); const ta=document.getElementById(`ta-${code}`);
      document.querySelector(`.custom-btn[data-code='${code}']`).onclick=()=>{ if(!di.value)di.value=new Date().toISOString().split('T')[0]; ta.value=(cobj.customDrills[di.value]||cobj.drills).join('\n'); editor.style.display='block'; };
      di.onchange=()=>ta.value=(cobj.customDrills[di.value]||[]).join('\n'); document.getElementById(`cancel-${code}`).onclick=()=>editor.style.display='none';
      document.getElementById(`save-${code}`).onclick=()=>{ const d=di.value; const lines=ta.value.split('\n').map(l=>l.trim()).filter(Boolean); const all=document.getElementById(`all-${code}`).checked; const clsL=getClasses(); if(all)us[t].classrooms.forEach(cid=>{ clsL[cid].customDrills=clsL[cid].customDrills||{}; clsL[cid].customDrills[d]=lines; }); else{ clsL[code].customDrills=clsL[code].customDrills||{}; clsL[code].customDrills[d]=lines; } saveClasses(clsL); renderTeacher(t); };
      document.querySelector(`.del-class[data-code='${code}']`).onclick=()=>{ if(confirm('Delete class?')){ const cl=getClasses(); delete cl[code]; saveClasses(cl); const uu=getUsers(); uu[t].classrooms=uu[t].classrooms.filter(x=>x!==code); saveUsers(uu); renderTeacher(t);} };
      document.querySelectorAll(`.del-student[data-code='${code}']`).forEach(b=>b.onclick=()=>{ const s=b.dataset.student; if(confirm(`Remove ${s}?`)){ const cl=getClasses(); cl[code].students=cl[code].students.filter(x=>x!==s); saveClasses(cl); renderTeacher(t);} });
      document.querySelectorAll(`.del-date[data-code='${code}']`).forEach(b=>b.onclick=()=>{ const d=b.dataset.date; if(confirm(`Remove all on ${d}?`)){ const uu=getUsers(), cl=getClasses(); cl[code].students.forEach(s=>{ if(uu[s]?.progress) delete uu[s].progress[d]; }); saveUsers(uu); renderTeacher(t);} });
    });
  }

  function renderStudent(c, st) {
    const cls = getClasses(); const today=new Date().toISOString().split('T')[0]; const drills=cls[c].customDrills[today]||cls[c].drills;
    let i=0,pos=0; let accEl=document.getElementById('accuracy-display'); if(!accEl){ accEl=document.createElement('div'); accEl.id='accuracy-display'; accEl.style.margin='0.5em 0'; studentDash.querySelector('#feedback').after(accEl);} function updateAcc(){ const spans=document.querySelectorAll('.char'); const errs=[...spans].filter(s=>s.classList.contains('error')).length; accEl.textContent=`Accuracy: ${Math.round((spans.length-errs)/spans.length*100)}%`; }
    function loadD(){ promptEl.innerHTML=''; drills[i].split('').forEach(ch=>{ const s=document.createElement('span'); s.className='char'; s.textContent=ch; promptEl.appendChild(s); }); pos=0; mark(); feedbackEl.textContent=''; nextBtn.disabled=true; updateAcc(); }
    function mark(){ const spans=document.querySelectorAll('.char'); spans.forEach(s=>s.classList.remove('current')); spans[pos]?.classList.add('current'); }
    document.onkeydown=e=>{ if(studentDash.classList.contains('hidden'))return; if(e.key==='Backspace'){e.preventDefault(); if(pos>0){ pos--; const spans=document.querySelectorAll('.char'); spans[pos].classList.remove('correct','error'); mark(); updateAcc(); nextBtn.disabled=true;} return;} if(e.key.length!==1||pos>=drills[i].length){e.preventDefault();return;} const spans=document.querySelectorAll('.char'); spans[pos].classList.remove('current'); if(e.key===drills[i][pos]){ spans[pos].classList.add('correct'); feedbackEl.textContent=''; } else{ spans[pos].classList.add('error'); feedbackEl.textContent=`Expected "${drills[i][pos]}" got "${e.key}"`; } pos++; mark(); updateAcc(); if(pos>=spans.length) nextBtn.disabled=false; };
    nextBtn.onclick=()=>{ const spans=document.querySelectorAll('.char'); const corr=[...spans].filter(s=>s.classList.contains('correct')).length; const errs=[...spans].filter(s=>s.classList.contains('error')).length; const acc=Math.round((corr/spans.length)*100); const uu=getUsers(); uu[st].progress[today]=(uu[st].progress[today]||[]); uu[st].progress[today].push({drill:i,correct:corr,errors:errs,accuracy:acc}); saveUsers(uu); if(i+1<drills.length){ i++; loadD(); } else{ promptEl.textContent='Done!'; nextBtn.style.display='none'; }};
    loadD();
  }

  function enterAdmin() {
    const existing=document.getElementById('admin'); if(existing) existing.remove();
    const panel=document.createElement('div'); panel.id='admin'; panel.style.padding='1em';
    const us=getUsers(), cl=getClasses(), valid=new Set(Object.keys(cl));
    panel.innerHTML=`<h2>Admin Panel</h2><button id="cleanup-students">Delete orphan students</button> <button id="cleanup-teachers">Delete orphan teachers</button><table border="1" style="width:100%;margin-top:1em;"><tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr><tbody id="admin-body"></tbody></table>`;
    document.body.appendChild(panel); const body=document.getElementById('admin-body'); body.innerHTML='';
    Object.entries(us).forEach(([u,d])=>{ let info=''; if(d.role==='teacher') info=(d.classrooms||[]).join(', '); else info=d.classroomCode; if(d.role==='student'&&!valid.has(d.classroomCode)) info=`<span style="color:red">${info||'none'}</span>`; const tr=document.createElement('tr'); tr.innerHTML=`<td>${u}</td><td>${d.role}</td><td>${info}</td><td><button data-user="${u}" class="del-user">Delete</button></td>`; body.appendChild(tr); });
    document.querySelectorAll('.del-user').forEach(b=>b.onclick=()=>{ const u=b.dataset.user; if(!confirm(`Delete ${u}?`))return; deleteUser(u); enterAdmin(); });
    document.getElementById('cleanup-students').onclick=()=>{ if(!confirm('Delete orphan students?'))return; const us2=getUsers(); Object.entries(us2).forEach(([u,d])=>{ if(d.role==='student'&&!valid.has(d.classroomCode)) delete us2[u]; }); saveUsers(us2); enterAdmin(); };
    document.getElementById('cleanup-teachers').onclick=()=>{ if(!confirm('Delete orphan teachers?'))return; const us2=getUsers(); Object.entries(us2).forEach(([u,d])=>{ if(d.role==='teacher'&&(!d.classrooms||d.classrooms.length===0)) delete us2[u]; }); saveUsers(us2); enterAdmin(); };
  }

  function deleteUser(u){ const us=getUsers(), cl=getClasses(); if(us[u].role==='teacher'){ us[u].classrooms.forEach(c=>delete cl[c]); saveClasses(cl);} else{ const cc=us[u].classroomCode; if(cl[cc]) cl[cc].students=cl[cc].students.filter(x=>x!==u); saveClasses(cl);} delete us[u]; saveUsers(us); }
}
