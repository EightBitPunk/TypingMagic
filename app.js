// Version 0.1.63_B

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.62B';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

function initApp() {
  // ─── Helpers ───
  const defaultDrills = [
    'The quick brown fox jumps over the lazy dog.',
    'Typing practice improves both speed and accuracy.',
    'Accuracy over speed.'
  ];
  const getUsers   = () => JSON.parse(localStorage.getItem('users')    || '{}');
  const saveUsers  = u  => localStorage.setItem('users', JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const saveClasses= c  => localStorage.setItem('classrooms', JSON.stringify(c));
  const getCurrentUser = () =>
    JSON.parse(localStorage.getItem('currentUser') || 'null');

    // ─── Calendar state for student view ───
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  
  // ─── Login / Logout UI wiring ───
  const logoutBtn   = document.getElementById('logout-btn');
  const loginScreen = document.getElementById('login-screen');
  const loginBtn    = document.getElementById('login-btn');
  let   toggleBtn   = document.getElementById('toggle-mode-btn');
  const userIn      = document.getElementById('username');
  const passIn      = document.getElementById('password');
  const roleSel     = document.getElementById('role');
  const classIn     = document.getElementById('classroom-code');
  const loginMsg    = document.getElementById('login-message');
  const studentWrap = document.getElementById('student-classroom-code');
  const teacherDash = document.getElementById('teacher-dashboard');
  const classSetup  = document.getElementById('classroom-setup');
  const teacherView = document.getElementById('teacher-classroom-view');
  const studentDash = document.getElementById('student-dashboard');
  const studentName = document.getElementById('student-name');
  const teacherName = document.getElementById('teacher-name');
  const createBtn   = document.getElementById('create-classroom-btn');
  const newClassIn  = document.getElementById('new-classroom-name');
  const codeDisp    = document.getElementById('classroom-code-display');
  const progTable   = document.getElementById('student-progress-table');

  // Restore last username
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) userIn.value = lastUser;

  // Toggle sign-up / login
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent  = isSignUp ? 'Sign Up' : 'Log In';
    toggleBtn.textContent = isSignUp ? 'Go to Log In' : 'Go to Sign Up';
    studentWrap.classList.toggle('hidden', !(isSignUp && roleSel.value==='student'));
  }
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-mode-btn';
    loginScreen.appendChild(toggleBtn);
  }
  toggleBtn.onclick = ()=> { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange  = updateMode;
  updateMode();

  logoutBtn.style.display = 'none';
  logoutBtn.onclick = ()=> {
    localStorage.removeItem('currentUser');
    location.reload();
  };

  loginBtn.onclick = () => {
    loginMsg.textContent = '';
    const u = userIn.value.trim(),
          p = passIn.value,
          r = roleSel.value,
          c = classIn.value.trim();

    if (u==='KEFKA' && p==='SUCKS') return enterAdmin();

    if (!u || !p || (isSignUp && r==='student' && !c)) {
      loginMsg.textContent = 'Complete all fields.'; return;
    }

    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent='User exists.'; return; }
      users[u] = {
        password: p,
        role: r,
        progress: {},
        classrooms: r==='teacher'?[]:undefined,
        classroomCode: r==='student'?c:undefined
      };
      if (r==='student') {
        const classes = getClasses();
        classes[c].students.push(u);
        saveClasses(classes);
      }
      saveUsers(users);
      localStorage.setItem('lastUser', u);
      localStorage.setItem('currentUser', JSON.stringify({username:u,role:r}));
      enterDash(u, r);
    } else {
      if (users[u] && users[u].password===p && users[u].role===r) {
        localStorage.setItem('lastUser', u);
        localStorage.setItem('currentUser', JSON.stringify({username:u,role:r}));
        enterDash(u, r);
      } else {
        loginMsg.textContent='Incorrect credentials.';
      }
    }
  };

  function enterDash(u, r) {
    logoutBtn.style.display = 'block';
    loginScreen.classList.add('hidden');
    if (r==='teacher') {
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

  createBtn.onclick = () => {
    const name = newClassIn.value.trim();
    if (!name) return;
    const newCode = 'C'+(100000 + Math.floor(Math.random()*900000));
    const classes = getClasses();
    classes[newCode] = {
      name,
      teacher: teacherName.textContent,
      students: [],
      drills: defaultDrills.slice(),
      customDrills: {}
    };
    saveClasses(classes);
    const users = getUsers();
    users[teacherName.textContent].classrooms.push(newCode);
    saveUsers(users);
    codeDisp.textContent = `New Code: ${newCode}`;
    renderTeacher(teacherName.textContent);
  };


  // ─── Drill Editor & Bulk Upload ───

  function openEditor(user, code) {
    const classes = getClasses()[code];
    const di  = document.getElementById(`date-${code}`);
    const ta  = document.getElementById(`ta-${code}`);
    const ed  = document.getElementById(`editor-${code}`);
    if (!di.value) di.value = new Date().toISOString().split('T')[0];
    ta.value = (classes.customDrills[di.value]||classes.drills).join('\n');
    document.getElementById(`all-${code}`).checked = false;
    ed.style.display = 'block';
  }
  function openBulk(user, code) {
    const inp = document.getElementById(`bulk-file-${code}`);
    inp.classList.remove('hidden');
    inp.click();
  }
  async function handleBulkUpload(evt, code) {
    const file = evt.target.files[0]; if (!file) return;
    const text = await file.text();
    const ans  = prompt(
      "Apply these drills to ALL of your classes?\n"+
      "YES=All, NO=Only this class, CANCEL=Abort"
    );
    if (!ans) { evt.target.value=''; evt.target.classList.add('hidden'); return; }
    const choice = ans.trim().toUpperCase();
    if (choice!=='YES'&&choice!=='NO') return alert('Aborted.');
    const applyAll = choice==='YES';
    const classes = getClasses();
    text.split(/\r?\n/).filter(Boolean).forEach(line=>{
      const datePart = line.split('[')[0].trim();
      const drills   = Array.from(line.matchAll(/\[([^\]]+)\]/g))
                        .map(m=>m[1].trim()).filter(Boolean);
      if (!datePart||!drills.length) return;
      if (applyAll) {
        getUsers()[getCurrentUser().username].classrooms
          .forEach(cid=> classes[cid].customDrills[datePart]=drills);
      } else {
        classes[code].customDrills[datePart]=drills;
      }
    });
    saveClasses(classes);
    evt.target.value=''; evt.target.classList.add('hidden');
    renderTeacher(getCurrentUser().username);
  }


  // ─── Student side ───

  const promptEl   = document.getElementById('prompt');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn    = document.getElementById('next-btn');

  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }

  // ─── NEW buildCalendar with month/year and navigation ───

function buildCalendar(student, code) {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';
  const today = new Date();
  const currentMonth = calendarState[student]?.month ?? today.getMonth();
  const currentYear = calendarState[student]?.year ?? today.getFullYear();
  const shown = new Date(currentYear, currentMonth);

  const classes = getClasses();
  const classSettings = classes[code] || {};
  const allowPast = !!classSettings.allowPast;
  const allowFuture = !!classSettings.allowFuture;

  const firstDay = new Date(shown.getFullYear(), shown.getMonth(), 1).getDay();
  const daysInMonth = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();

  const monthName = shown.toLocaleString('default', { month: 'long' });
  const year = shown.getFullYear();
  const header = document.createElement('div');
  header.className = 'calendar-header';
  header.innerHTML = `
    <button class="btn secondary" id="prev-month">&lt;</button>
    <span style="font-weight:bold;">${monthName} ${year}</span>
    <button class="btn secondary" id="next-month">&gt;</button>
  `;
  calendarEl.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell header-cell';
    cell.textContent = d;
    grid.appendChild(cell);
  });

  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell empty';
    grid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(shown.getFullYear(), shown.getMonth(), day);
    const iso = date.toISOString().slice(0, 10);
    const cell = document.createElement('div');
    cell.className = 'calendar-cell day-cell';
    cell.textContent = day;

    const isToday = iso === new Date().toISOString().slice(0, 10);
    const isBeforeToday = date < today.setHours(0,0,0,0);
    const isAfterToday  = date > new Date().setHours(23,59,59,999);

    // Disable based on class settings
    const isDisabled = (isBeforeToday && !allowPast) || (isAfterToday && !allowFuture);
    if (isDisabled) {
      cell.classList.add('disabled');
      cell.style.opacity = 0.3;
      cell.style.pointerEvents = 'none';
    } else {
      cell.onclick = () => loadDrillForDate(student, code, iso);
      if (isToday) cell.style.border = '2px solid #ffa500';
    }

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);

  document.getElementById('prev-month').onclick = () => {
    calendarState[student] = {
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
    };
    buildCalendar(student, code);
  };
  document.getElementById('next-month').onclick = () => {
    calendarState[student] = {
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
    };
    buildCalendar(student, code);
  };
}

  // ─── end buildCalendar ───

  function handlePast(code,key,student){
    const cls = getClasses()[code];
    const drills = cls.customDrills[key]||cls.drills;
    if(!confirm(`Preview for ${key}?\n\n${drills.join('\n')}\n\nProceed?`)) return;
    renderDrillsWithDate(code, drills, key, student, true);
  }

 function renderDrillsWithDate(code, drills, dateKey, student, isLate) {
   let idx=0, pos=0;
   const accuracyDiv = document.getElementById('student-accuracy');
  accuracyDiv.textContent = '';

   function updateAcc(){
     const spans = document.querySelectorAll('.char');
     const errs = [...spans].filter(s => s.classList.contains('error')).length;
     const pct  = Math.max(0, Math.round((spans.length-errs)/spans.length*100));
     accuracyDiv.textContent = `Accuracy: ${pct}%`;
   }

    function loadOne(){
      promptEl.innerHTML='';
      drills[idx].split('').forEach(ch=>{
        const span=document.createElement('span');
        span.className='char'; span.textContent=ch;
        promptEl.append(span);
      });
      pos=0; mark(); feedbackEl.textContent=''; nextBtn.disabled=true;
      nextBtn.textContent = idx<drills.length-1?'Next':'Submit';
      updateAcc();
    }
    function mark(){
      document.querySelectorAll('.char').forEach(s=>s.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }
    document.onkeydown=e=>{
      if(studentDash.classList.contains('hidden')) return;
      if(e.key==='Backspace'){ e.preventDefault(); if(pos>0){ pos--; const spans=document.querySelectorAll('.char');
          spans[pos].classList.remove('correct','error'); mark(); updateAcc(); nextBtn.disabled=true; } return; }
      if(e.key.length!==1||pos>=drills[idx].length){ e.preventDefault(); return; }
      const spans=document.querySelectorAll('.char');
      spans[pos].classList.remove('current');
      if(e.key===drills[idx][pos]) spans[pos].classList.add('correct');
      else { spans[pos].classList.add('error'); feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`; }
      pos++; mark(); updateAcc(); if(pos>=spans.length) nextBtn.disabled=false;
    };
    nextBtn.onclick=()=>{
      const spans=document.querySelectorAll('.char');
      const corr=[...spans].filter(s=>s.classList.contains('correct')).length;
      const errs=[...spans].filter(s=>s.classList.contains('error')).length;
      const pct = Math.round((corr/spans.length)*100);
      const users=getUsers();
      users[student].progress[dateKey] = users[student].progress[dateKey]||[];
      users[student].progress[dateKey].push({drill:idx,correct:corr,errors:errs,accuracy:pct,late:isLate});
      saveUsers(users);
      if(idx<drills.length-1) { idx++; loadOne(); }
      else { buildCalendar(student, code); promptEl.textContent='Completed!'; nextBtn.disabled=true; }
    };
    loadOne();
  }
  function loadDrills(code, student){
    const today=new Date().toISOString().split('T')[0];
    const cls=getClasses()[code];
    renderDrillsWithDate(code, cls.customDrills[today]||cls.drills, today, student, false);
  }

  // ─── Teacher side ───
function renderTeacher(t) {
  show('teacher-dashboard');
  document.getElementById('teacher-name').textContent = t;

  const container = document.getElementById('student-progress-table');
  container.innerHTML = '';

  (usersData[t].classrooms || []).forEach(code => {
    const c = getClasses()[code];
    const students = Object.values(usersData).filter(u => u.role === 'student' && u.classroom === code);
    const prog = getProgress();
    let html = `
      <div class="class-card card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;">
          <div>
            <strong>${c.name}</strong> (Code: ${code})
            <button class="btn secondary" id="delete-selected-${code}">DELETE CHECKED ASSIGNMENTS</button>
          </div>
          <div>
            <button class="custom-btn" data-code="${code}">Customize Drills</button>
            <button class="bulk-btn"    data-code="${code}">Bulk Upload</button>
            <button class="btn primary edit-class" data-code="${code}">EDIT CLASS</button>
            <br/>
            <label style="font-size:0.85em;">
              <input type="checkbox"
                     class="allow-past"
                     data-code="${code}"
                     ${c.allowPast ? 'checked' : ''} />
              Students can complete <strong>past</strong> lessons
            </label>
            <label style="font-size:0.85em; margin-left:1em;">
              <input type="checkbox"
                     class="allow-future"
                     data-code="${code}"
                     ${c.allowFuture ? 'checked' : ''} />
              Students can complete <strong>future</strong> lessons
            </label>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Delete</th>
              <th>Student</th>
              <th>Date</th>
              <th>Prompt</th>
              <th>Accuracy</th>
              <th>WPM</th>
            </tr>
          </thead>
          <tbody>
            ${
              students.map(s => {
                const studentProg = Object.entries(prog)
                  .filter(([key]) => key.startsWith(`${s.username}_${code}_`))
                  .map(([key, val]) => {
                    const [, , date] = key.split('_');
                    return `
                      <tr>
                        <td><input type="checkbox" class="del-assignment" data-key="${key}" /></td>
                        <td>${s.username}</td>
                        <td>${date}</td>
                        <td>${val.prompt}</td>
                        <td>${val.accuracy}%</td>
                        <td>${val.wpm}</td>
                      </tr>
                    `;
                  }).join('');
                return studentProg || `
                  <tr>
                    <td></td>
                    <td>${s.username}</td>
                    <td colspan="4" style="text-align:center;font-style:italic;">No drills completed yet</td>
                  </tr>
                `;
              }).join('')
            }
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML += html;

    // ─── Button Handlers ───
    document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => {
      renderCustomizeDrills(code);
    };
    document.querySelector(`.bulk-btn[data-code="${code}"]`).onclick = () => {
      renderBulkUpload(code);
    };
    document.querySelector(`.edit-class[data-code="${code}"]`).onclick = () => {
      const newName = prompt("Rename this class:");
      if (!newName) return;
      const all = getClasses();
      all[code].name = newName;
      saveClasses(all);
      renderTeacher(t);
    };
    document.getElementById(`delete-selected-${code}`).onclick = () => {
      const checkboxes = document.querySelectorAll('.del-assignment:checked');
      const p = getProgress();
      checkboxes.forEach(cb => {
        delete p[cb.dataset.key];
      });
      saveProgress(p);
      renderTeacher(t);
    };

    // ─── Select-All checkbox ───
    const selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.onchange = e => {
      const checked = e.target.checked;
      document.querySelectorAll(`.del-assignment`).forEach(cb => {
        cb.checked = checked;
      });
    };
    const th = document.querySelectorAll('.class-card table thead tr')[document.querySelectorAll('.class-card').length - 1].children[0];
    th.appendChild(selectAll);

    // ─── Persist allow-past / allow-future ───
    document.querySelector(`.allow-past[data-code="${code}"]`).onchange = e => {
      const all = getClasses();
      all[code].allowPast = e.target.checked;
      saveClasses(all);
    };
    document.querySelector(`.allow-future[data-code="${code}"]`).onchange = e => {
      const all = getClasses();
      all[code].allowFuture = e.target.checked;
      saveClasses(all);
    };
  });
}

  // ─── Admin ───
  function enterAdmin(){
    logoutBtn.style.display='block';
    const existing = document.getElementById('admin');
    if(existing) existing.remove();
    const panel = document.createElement('div');
    panel.id='admin'; panel.style.padding='1em';
    panel.innerHTML = `
      <h2>Admin Panel</h2>
      <button id="cleanup-students">Delete orphan students</button>
      <button id="cleanup-teachers">Delete orphan teachers</button>
      <table border="1" style="width:100%;margin-top:1em;">
        <tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr>
        <tbody id="admin-body"></tbody>
      </table>`;
    document.body.appendChild(panel);

    const users   = getUsers();
    const classes = getClasses();
    const valid   = new Set(Object.keys(classes));
    const body    = document.getElementById('admin-body');
    body.innerHTML='';

    Object.entries(users).forEach(([u,d])=>{
      let info = d.role==='teacher' ? (d.classrooms||[]).join(', ') : d.classroomCode||'';
      if (d.role==='student' && !valid.has(d.classroomCode)) info = `<span style="color:red">${info||'none'}</span>`;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u}</td><td>${d.role}</td><td>${info}</td>
                      <td><button data-user="${u}" class="del-user">Delete</button></td>`;
      body.appendChild(tr);
    });

    document.querySelectorAll('.del-user').forEach(b=>{
      b.onclick = ()=>{
        const u=b.dataset.user;
        if(!confirm(`Delete ${u}?`)) return;
        deleteUser(u);
        enterAdmin();
      };
    });
    document.getElementById('cleanup-students').onclick = ()=>{
      if(!confirm('Delete orphan students?')) return;
      const us=getUsers();
      Object.entries(us).forEach(([u,d])=>{
        if(d.role==='student' && !valid.has(d.classroomCode)) delete us[u];
      });
      saveUsers(us); enterAdmin();
    };
    document.getElementById('cleanup-teachers').onclick = ()=>{
      if(!confirm('Delete orphan teachers?')) return;
      const us=getUsers();
      Object.entries(us).forEach(([u,d])=>{
        if(d.role==='teacher' && (!d.classrooms||d.classrooms.length===0)) delete us[u];
      });
      saveUsers(us); enterAdmin();
    };
  }

  function deleteUser(u){
    const us = getUsers(), cl=getClasses();
    if (us[u].role==='teacher') {
      us[u].classrooms.forEach(c=>delete cl[c]);
      saveClasses(cl);
    } else {
      const cc=us[u].classroomCode;
      if (cl[cc]) cl[cc].students=cl[cc].students.filter(x=>x!==u);
      saveClasses(cl);
    }
    delete us[u];
    saveUsers(us);
  }

} // end initApp







