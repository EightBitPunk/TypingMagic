// Version 0.1.45

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.45';
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

  // Restore last username
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) document.getElementById('username').value = lastUser;

  // Storage helpers
  const getUsers    = () => JSON.parse(localStorage.getItem('users')    || '{}');
  const saveUsers   = u  => localStorage.setItem('users', JSON.stringify(u));
  const getClasses  = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const saveClasses = c  => localStorage.setItem('classrooms', JSON.stringify(c));

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.style.display = 'none';
  logoutBtn.onclick = () => {
    localStorage.removeItem('currentUser');
    location.reload();
  };

  // DOM refs
  const loginScreen = document.getElementById('login-screen');
  const loginBtn    = document.getElementById('login-btn');
  const toggleBtn   = document.getElementById('toggle-mode-btn');
  const userIn      = document.getElementById('username');
  const passIn      = document.getElementById('password');
  const roleSel     = document.getElementById('role');
  const loginMsg    = document.getElementById('login-message');
  const classIn     = document.getElementById('classroom-code');
  const studentWrap = document.getElementById('student-classroom-code');

  const teacherDash = document.getElementById('teacher-dashboard');
  const classSetup  = document.getElementById('classroom-setup');
  const teacherView = document.getElementById('teacher-classroom-view');
  const createBtn   = document.getElementById('create-classroom-btn');
  const newClassIn  = document.getElementById('new-classroom-name');
  const codeDisp    = document.getElementById('classroom-code-display');
  const teacherName = document.getElementById('teacher-name');
  const progTable   = document.getElementById('student-progress-table');

  const studentDash = document.getElementById('student-dashboard');
  const studentName = document.getElementById('student-name');
  const promptEl    = document.getElementById('prompt');
  const feedbackEl  = document.getElementById('feedback');
  const nextBtn     = document.getElementById('next-btn');

  // Toggle Sign‑Up / Log‑In
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? 'Sign Up' : 'Log In';
    toggleBtn.textContent = isSignUp ? 'Go to Log In' : 'Go to Sign Up';
    studentWrap.classList.toggle('hidden', !(isSignUp && roleSel.value === 'student'));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange  = updateMode;
  updateMode();

  // Auto‑login
  const session = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (session && session.username) {
    if (session.role === 'admin') { enterAdmin(); return; }
    const users = getUsers();
    if (users[session.username] && users[session.username].role === session.role) {
      enterDash(session.username, session.role);
      return;
    }
    localStorage.removeItem('currentUser');
  }

  // Login / Sign‑Up
  loginBtn.onclick = () => {
    loginMsg.textContent = '';
    const u    = userIn.value.trim();
    const p    = passIn.value;
    const role = roleSel.value;
    const code = classIn.value.trim();

    // Admin shortcut
    if (u === 'KEFKA' && p === 'SUCKS') {
      enterAdmin();
      return;
    }
    if (!u || !p || (isSignUp && role === 'student' && !code)) {
      loginMsg.textContent = 'Complete all fields.';
      return;
    }

    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent = 'User exists.'; return; }
      users[u] = { password: p, role, progress: {}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?code:undefined };
      if (role==='student') {
        const cls = getClasses(); cls[code].students.push(u); saveClasses(cls);
      }
      saveUsers(users);
      localStorage.setItem('lastUser', u);
      localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
      enterDash(u, role);
    } else {
      if (users[u] && users[u].password===p && users[u].role===role) {
        localStorage.setItem('lastUser', u);
        localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
        enterDash(u, role);
      } else {
        loginMsg.textContent = 'Incorrect credentials.';
      }
    }
  };

  function enterDash(u, role) {
    logoutBtn.style.display = 'block';
    loginScreen.classList.add('hidden');
    if (role === 'teacher') {
      teacherName.textContent = u;
      teacherDash.classList.remove('hidden');
      classSetup.classList.remove('hidden');
      teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent = u;
      studentDash.classList.remove('hidden');
      renderStudent(getUsers()[u].classroomCode, u);
    }
  }

  // Create Classroom
  createBtn.onclick = () => {
    const name = newClassIn.value.trim(); if (!name) return;
    const newCode = 'C' + Math.floor(100000 + Math.random() * 900000);
    const cls = getClasses();
    cls[newCode] = { name, teacher: teacherName.textContent, students: [], drills: defaultDrills.slice(), customDrills: {} };
    saveClasses(cls);
    const us = getUsers(); us[teacherName.textContent].classrooms.push(newCode); saveUsers(us);
    codeDisp.textContent = `New Code: ${newCode}`;
    renderTeacher(teacherName.textContent);
  };

  // Full Teacher View
  function renderTeacher(t) {
    const users = getUsers(), classes = getClasses();
    let html = '';
    (users[t].classrooms || []).forEach(code => {
      const c = classes[code]; if (!c) return;
      html += `<h3>${c.name} (Code: ${code})` +
              ` <button class="custom-btn" data-code="${code}">Customize Drills</button>` +
              ` <button class="bulk-btn" data-code="${code}">Bulk Upload</button>` +
              ` <span class="del-class" data-code="${code}">🗑️</span></h3>`;
      html += `<input type="file" id="bulk-file-${code}" accept=".txt" class="hidden"/>`;
      html += `<div id="editor-${code}" class="card" style="display:none;">
                <label>Date: <input type="date" id="date-${code}"/></label>
                <label><input type="checkbox" id="all-${code}"/> Apply to all classes?</label><br>
                <textarea id="ta-${code}" rows="4" style="width:100%"></textarea><br>
                <button id="save-${code}" class="btn primary">Save</button>
                <button id="cancel-${code}" class="btn secondary">Cancel</button>
              </div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s => {
        const pr = users[s].progress || {};
        Object.entries(pr).forEach(([d,arr]) => {
          const avg = arr.length?Math.round(arr.reduce((sum,x)=>sum+x.accuracy,0)/arr.length):0;
          const err = arr.reduce((sum,x)=>sum+x.errors,0);
          const late = arr.some(r=>r.late);
          html += `<tr class="${late?'late-row':''}"><td>${s} <span class="del-student" data-code="${code}" data-student="${s}">🗑️</span></td><td>${d} <span class="del-date" data-code="${code}" data-date="${d}">🗑️</span></td><td>${avg}%</td><td>${err}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    progTable.innerHTML = html;
    (users[t].classrooms || []).forEach(code => {
      const editor = document.getElementById(`editor-${code}`);
      const di = document.getElementById(`date-${code}`);
      const ta = document.getElementById(`ta-${code}`);
      const allCk = document.getElementById(`all-${code}`);
      document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => {
        if (!di.value) di.value = new Date().toISOString().split('T')[0];
        ta.value = (classes[code].customDrills[di.value]||classes[code].drills).join('\n');
        allCk.checked = false;
        editor.style.display='block';
      };
      di.onchange = () => { ta.value = (classes[code].customDrills[di.value]||[]).join('\n'); };
      document.getElementById(`cancel-${code}`).onclick = () => { editor.style.display='none'; };
      document.getElementById(`save-${code}`).onclick = () => {
        const d=di.value; const lines=ta.value.split('\n').map(l=>l.trim()).filter(Boolean);
        const clsL=getClasses(); if(allCk.checked){ users[t].classrooms.forEach(cid=>{ clsL[cid].customDrills=clsL[cid].customDrills||{}; clsL[cid].customDrills[d]=lines; }); }
        else { clsL[code].customDrills=clsL[code].customDrills||{}; clsL[code].customDrills[d]=lines; }
        saveClasses(clsL); renderTeacher(t);
      };
      document.querySelector(`.del-class[data-code="${code}"]`).onclick = () => {
        if(!confirm('Delete entire class?'))return; const clsA=getClasses(); delete clsA[code]; saveClasses(clsA);
        const us2=getUsers(); us2[t].classrooms=us2[t].classrooms.filter(c=>c!==code); saveUsers(us2);
        renderTeacher(t);
      };
      document.querySelectorAll(`.del-student[data-code="${code}"]`).forEach(btn=>{btn.onclick=()=>{if(!confirm(`Remove student ${btn.dataset.student}?`))return; const cl=getClasses(); cl[code].students=cl[code].students.filter(x=>x!==btn.dataset.student); saveClasses(cl); renderTeacher(t);}});
      document.querySelectorAll(`.del-date[data-code="${code}"]`).forEach(btn=>{btn.onclick=()=>{if(!confirm(`Remove all completions on ${btn.dataset.date}?`))return; const us2=getUsers(), cl=getClasses(); cl[code].students.forEach(s=>{delete us2[s].progress[btn.dataset.date];}); saveUsers(us2); renderTeacher(t);}});
      const bulkBtn=document.querySelector(`.bulk-btn[data-code="${code}"]`);
      const fileIn=document.getElementById(`bulk-file-${code}`);
      bulkBtn.onclick=()=>{fileIn.click();};
      fileIn.onchange=async e=>{const text=await e.target.files[0].text();const resp=prompt('Apply to all classes?');if(!resp)return;const applyAll=resp.trim().toUpperCase()==='YES';const lines=text.split(/\r?\n/).filter(Boolean);const clsL=getClasses();lines.forEach(line=>{const date=line.split('[')[0].trim();const drills=[...line.matchAll(/\[([^\]]+)\]/g)].map(m=>m[1]);if(applyAll){users[t].classrooms.forEach(cid=>{clsL[cid].customDrills=clsL[cid].customDrills||{};clsL[cid].customDrills[date]=drills;});}else{clsL[code].customDrills=clsL[code].customDrills||{};clsL[code].customDrills[date]=drills;}});saveClasses(clsL);renderTeacher(t);};
    });
  }

  // Student view
  function renderStudent(code,student){buildCalendar(student,code);loadDrills(code,student);}  
  function buildCalendar(student,code){const cls=getClasses()[code];const prog=getUsers()[student].progress||{};const today=new Date();const y=today.getFullYear(),m=today.getMonth();const first=new Date(y,m,1).getDay();const days=new Date(y,m+1,0).getDate();const td=today.getDate();const cal=document.getElementById('calendar');cal.innerHTML='';const tbl=document.createElement('table');tbl.style.borderCollapse='collapse';const hdr=document.createElement('tr');['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{const th=document.createElement('th');th.textContent=d;th.style.padding='4px';hdr.appendChild(th);});tbl.appendChild(hdr);let tr=document.createElement('tr');for(let i=0;i<first;i++){const tdEl=document.createElement('td');tdEl.style.padding='4px';tr.appendChild(tdEl);}for(let d=1;d<=days;d++){if((first+d-1)%7===0&&d!==1){tbl.appendChild(tr);tr=document.createElement('tr');}const tdEl=document.createElement('td');tdEl.textContent=d;tdEl.style.width='24px';tdEl.style.height='24px';tdEl.style.textAlign='center';const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;tdEl.style.cursor='pointer';if(d<td){tdEl.style.background=prog[key]?'lightgreen':'lightcoral';if(!prog[key])tdEl.onclick=()=>handlePast(code,key,student);else tdEl.onclick=()=>alert("Already done");}else if(d===td){tdEl.style.background=prog[key]?'lightgreen':'lightblue';}else{tdEl.style.background='lightgray';}tr.appendChild(tdEl);}tbl.appendChild(tr);cal.appendChild(tbl);}  
  function handlePast(code,key,student){const cls=getClasses()[code];const arr=cls.customDrills[key]||cls.drills;if(!confirm(`Preview drill for ${key}?\n\n${arr.join('\n')}\n\nMake up now?`))return;renderDrillsWithDate(code,arr,key,student,true);}  
  function renderDrillsWithDate(code,drills,dateKey,student,isLate){let idx=0,pos=0;const stats=document.getElementById('student-stats');stats.textContent='';function updateAcc(){const spans=document.querySelectorAll('.char');const errs=[...spans].filter(s=>s.classList.contains('error')).length;const pct=Math.round((spans.length-errs)/spans.length*100);stats.textContent=`Accuracy: ${pct}%`;}function loadOne(){promptEl.innerHTML='';drills[idx].split('').forEach(ch=>{const sp=document.createElement('span');sp.className='char';sp.textContent=ch;promptEl.appendChild(sp);});pos=0;mark();feedbackEl.textContent='';nextBtn.disabled=true;nextBtn.textContent=idx<drills.length-1?'Next':'Submit';updateAcc();}function mark(){document.querySelectorAll('.char').forEach(s=>s.classList.remove('current'));document.querySelectorAll('.char')[pos]?.classList.add('current');}document.onkeydown=e=>{if(studentDash.classList.contains('hidden'))return;if(e.key==='Backspace'){e.preventDefault();if(pos>0){pos--;const ss=document.querySelectorAll('.char');ss[pos].classList.remove('correct','error');mark();updateAcc();nextBtn.disabled=true;}return;}if(e.key.length!==1||pos>=drills[idx].length){e.preventDefault();return;}const ss=document.querySelectorAll('.char');ss[pos].classList.remove('current');if(e.key===drills[idx][pos]){ss[pos].classList.add('correct');feedbackEl.textContent='';}else{ss[pos].classList.add('error');feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`;}pos++;mark();updateAcc();if(pos>=ss.length)nextBtn.disabled=false;};nextBtn.onclick=()=>{const ss=document.querySelectorAll('.char');const corr=[...ss].filter(s=>s.classList.contains('correct')).length;const errs=[...ss].filter(s=>s.classList.contains('error')).length;const pct=Math.round(corr/ss.length*100);const users=getUsers(),prog=users[student].progress;if(!prog[dateKey])prog[dateKey]=[];prog[dateKey].push({drill:idx,correct:corr,errors:errs,accuracy:pct,late:isLate});saveUsers(users);if(idx<drills.length-1){idx++;loadOne();}else{buildCalendar(student,code);promptEl.textContent='Typing Drill Completed!';nextBtn.disabled=true;}};loadOne();}function loadDrills(code,student){const cls=getClasses()[code];const today=new Date().toISOString().split('T')[0];renderDrillsWithDate(code,cls.customDrills[today]||cls.drills,today,student,false);}  
  function enterAdmin(){const ex=document.getElementById('admin');if(ex)ex.remove();const panel=document.createElement('div');panel
