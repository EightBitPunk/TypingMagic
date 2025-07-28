// Version 0.1.41

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.41';
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
  let   toggleBtn   = document.getElementById('toggle-mode-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-mode-btn';
    loginScreen.appendChild(toggleBtn);
  }
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
  if (session && session.username && session.role !== 'admin') {
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
      users[u] = {
        password: p,
        role,
        progress: {},
        classrooms: role==='teacher'?[]:undefined,
        classroomCode: role==='student'?code:undefined
      };
      if (role==='student') {
        const cls = getClasses();
        cls[code].students.push(u);
        saveClasses(cls);
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
    const name = newClassIn.value.trim();
    if (!name) return;
    const newCode = 'C' + Math.floor(100000 + Math.random() * 900000);
    const cls = getClasses();
    cls[newCode] = {
      name, teacher: teacherName.textContent,
      students: [], drills: defaultDrills.slice(),
      customDrills: {}
    };
    saveClasses(cls);
    const us = getUsers();
    us[teacherName.textContent].classrooms.push(newCode);
    saveUsers(us);
    codeDisp.textContent = `New Code: ${newCode}`;
    renderTeacher(teacherName.textContent);
  };

  // Full Teacher View
  function renderTeacher(t) {
    const users = getUsers(), cls = getClasses();
    let html = '';
    (users[t].classrooms || []).forEach(code => {
      const c = cls[code];
      if (!c) return;

      // Class header + controls
      html += `<h3>
        ${c.name} (Code: ${code})
        <button class="custom-btn" data-code="${code}">Customize Drills</button>
        <button class="bulk-btn"   data-code="${code}">Bulk Upload</button>
        <span class="del-class"    data-code="${code}">🗑️</span>
      </h3>`;

      // Bulk file input (hidden)
      html += `<input type="file" id="bulk-file-${code}" accept=".csv,.txt" class="hidden" />`;

      // Editor panel
      html += `<div id="editor-${code}" class="card" style="display:none;">
        <label>Date: <input type="date" id="date-${code}" /></label>
        <label style="margin-left:.5em;">
          <input type="checkbox" id="all-${code}" /> All Classes
        </label><br>
        <textarea id="ta-${code}" rows="4" style="width:100%"></textarea><br>
        <button id="save-${code}"   class="btn primary">Save</button>
        <button id="cancel-${code}" class="btn secondary">Cancel</button>
      </div>`;

      // Progress table
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      (c.students || []).forEach(s => {
        const pr = users[s].progress || {};
        Object.entries(pr).forEach(([d,arr]) => {
          const avg  = arr.length
            ? Math.round(arr.reduce((sum,x)=>sum+x.accuracy,0)/arr.length)
            : 0;
          const err  = arr.reduce((sum,x)=>sum+x.errors,0);
          const late = arr.some(r=>r.late);
          html += `<tr class="${late?'late-row':''}">
            <td>${s} <span class="del-student" data-code="${code}" data-student="${s}">🗑️</span></td>
            <td>${d} <span class="del-date"    data-code="${code}" data-date="${d}">🗑️</span></td>
            <td>${avg}%</td><td>${err}</td>
          </tr>`;
        });
      });
      html += `</table>`;
    });
    progTable.innerHTML = html;

    // Wire up per-class buttons
    (users[t].classrooms || []).forEach(code => {
      const cobj   = cls[code];
      const editor = document.getElementById(`editor-${code}`);
      const di     = document.getElementById(`date-${code}`);
      const ta     = document.getElementById(`ta-${code}`);
      const allCk  = document.getElementById(`all-${code}`);

      // Customize Drills
      document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => {
        if (!di.value) di.value = new Date().toISOString().split('T')[0];
        ta.value = (cobj.customDrills[di.value] || cobj.drills).join('\n');
        allCk.checked = false;
        editor.style.display = 'block';
      };
      di.onchange = () => {
        ta.value = (cobj.customDrills[di.value]||[]).join('\n');
      };
      document.getElementById(`cancel-${code}`).onclick = () => {
        editor.style.display='none';
      };
      document.getElementById(`save-${code}`).onclick = () => {
        const d     = di.value;
        const lines = ta.value.split('\n').map(l=>l.trim()).filter(Boolean);
        const all   = allCk.checked;
        const clsL  = getClasses();
        if (all) {
          users[t].classrooms.forEach(cid => {
            clsL[cid].customDrills = clsL[cid].customDrills||{};
            clsL[cid].customDrills[d] = lines;
          });
        } else {
          clsL[code].customDrills = clsL[code].customDrills||{};
          clsL[code].customDrills[d] = lines;
        }
        saveClasses(clsL);
        renderTeacher(t);
      };

      // Delete Class
      document.querySelector(`.del-class[data-code="${code}"]`).onclick = () => {
        if (!confirm('Delete entire class?')) return;
        const allCl = getClasses(); delete allCl[code]; saveClasses(allCl);
        const uu = getUsers();
        uu[t].classrooms = uu[t].classrooms.filter(c=>c!==code);
        saveUsers(uu);
        renderTeacher(t);
      };

      // Delete Student
      document.querySelectorAll(`.del-student[data-code="${code}"]`).forEach(btn=>{
        btn.onclick = () => {
          const s = btn.dataset.student;
          if (!confirm(`Remove student ${s}?`)) return;
          const cl = getClasses();
          cl[code].students = cl[code].students.filter(x=>x!==s);
          saveClasses(cl);
          renderTeacher(t);
        };
      });

      // Delete Date
      document.querySelectorAll(`.del-date[data-code="${code}"]`).forEach(btn=>{
        btn.onclick = () => {
          const d = btn.dataset.date;
          if (!confirm(`Remove all completions on ${d}?`)) return;
          const uu = getUsers(), cl = getClasses();
          cl[code].students.forEach(s=>{
            if (uu[s]?.progress) delete uu[s].progress[d];
          });
          saveUsers(uu);
          renderTeacher(t);
        };
      });

      // **Bulk Upload** wiring
      const bulkBtn   = document.querySelector(`.bulk-btn[data-code="${code}"]`);
      const fileInput = document.getElementById(`bulk-file-${code}`);
      bulkBtn.onclick = () => {
        fileInput.classList.remove('hidden');
        fileInput.click();
      };
      fileInput.onchange = async (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        const text = await file.text();
        // Parse bracketed format: date [drill][drill]...
        const lines = text.split(/\r?\n/).filter(Boolean);
        const clsLocal = getClasses();
        clsLocal[code].customDrills = clsLocal[code].customDrills||{};
        const applyAll = confirm('Apply these drills to ALL of your classes?');
        lines.forEach(line => {
          //   e.g. 2025-08-01[Sentence, with comma][Another sentence]
          const datePart = line.split('[')[0].trim();
          const drills   = Array.from(line.matchAll(/\[([^\]]+)\]/g))
                              .map(m=>m[1].trim())
                              .filter(Boolean);
          if (!datePart || drills.length===0) return;
          if (applyAll) {
            getUsers()[t].classrooms.forEach(cid=>{
              clsLocal[cid].customDrills = clsLocal[cid].customDrills||{};
              clsLocal[cid].customDrills[datePart] = drills;
            });
          } else {
            clsLocal[code].customDrills[datePart] = drills;
          }
        });
        saveClasses(clsLocal);
        fileInput.value = '';
        fileInput.classList.add('hidden');
        renderTeacher(t);
      };
    });
  }

  // Student view
  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }

  function buildCalendar(student, code) {
    const cls  = getClasses()[code];
    const prog = (getUsers()[student].progress)||{};
    const today = new Date();
    const year  = today.getFullYear(),
          m     = today.getMonth(),
          first = new Date(year,m,1).getDay(),
          days  = new Date(year,m+1,0).getDate(),
          todayD= today.getDate();

    let cal = document.getElementById('calendar');
    cal.innerHTML = '';
    const tbl = document.createElement('table');
    tbl.style.borderCollapse = 'collapse';
    const hdr = document.createElement('tr');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{
      const th = document.createElement('th');
      th.textContent=d; th.style.padding='4px'; hdr.appendChild(th);
    });
    tbl.appendChild(hdr);

    let tr = document.createElement('tr');
    for(let i=0;i<first;i++){
      const td=document.createElement('td'); td.style.padding='4px'; tr.appendChild(td);
    }
    for(let d=1; d<=days; d++){
      if((first+d-1)%7===0 && d!==1){
        tbl.appendChild(tr); tr=document.createElement('tr');
      }
      const td=document.createElement('td');
      td.textContent=d;
      td.style.width='24px'; td.style.height='24px'; td.style.textAlign='center';
      const key=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      td.style.cursor='pointer';

      if (d < todayD) {
        td.style.background = prog[key] ? 'lightgreen' : 'lightcoral';
        if (!prog[key]) td.onclick = ()=>handlePast(code,key,student);
        else            td.onclick = ()=>alert("You've already completed your drill for this day!");
      } else if (d === todayD) {
        td.style.background = prog[key] ? 'lightgreen' : 'lightblue';
      } else {
        td.style.background = 'lightgray';
      }
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
    cal.appendChild(tbl);
  }

  function handlePast(code, key, student) {
    const cls = getClasses()[code];
    const arr = cls.customDrills[key]||cls.drills;
    if(!confirm(`Preview drill for ${key}?\n\n${arr.join('\n')}\n\nMake up now?`)) return;
    renderDrillsWithDate(code, arr, key, student, true);
  }

  function renderDrillsWithDate(code, drills, dateKey, student, isLate) {
    let idx=0, pos=0;
    const statsDiv=document.getElementById('student-stats');
    statsDiv.textContent='';

    function updateAcc(){
      const spans=document.querySelectorAll('.char');
      const errs=[...spans].filter(s=>s.classList.contains('error')).length;
      const pct=Math.max(0,Math.round((spans.length-errs)/spans.length*100));
      statsDiv.textContent=`Accuracy: ${pct}%`;
    }

    function loadOne(){
      promptEl.innerHTML='';
      drills[idx].split('').forEach(ch=>{
        const s=document.createElement('span');
        s.className='char'; s.textContent=ch; promptEl.appendChild(s);
      });
      pos=0; mark(); feedbackEl.textContent=''; nextBtn.disabled=true;
      nextBtn.textContent = idx<drills.length-1 ? 'Next' : 'Submit';
      updateAcc();
    }

    function mark(){
      document.querySelectorAll('.char').forEach(s=>s.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }

    document.onkeydown=e=>{
      if(studentDash.classList.contains('hidden'))return;
      if(e.key==='Backspace'){
        e.preventDefault();
        if(pos>0){
          pos--; const spans=document.querySelectorAll('.char');
          spans[pos].classList.remove('correct','error');
          mark(); updateAcc(); nextBtn.disabled=true;
        }
        return;
      }
      if(e.key.length!==1||pos>=drills[idx].length){e.preventDefault();return;}
      const spans=document.querySelectorAll('.char');
      spans[pos].classList.remove('current');
      if(e.key===drills[idx][pos]){
        spans[pos].classList.add('correct'); feedbackEl.textContent='';
      } else {
        spans[pos].classList.add('error');
        feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`;
      }
      pos++; mark(); updateAcc(); if(pos>=spans.length) nextBtn.disabled=false;
    };

    nextBtn.onclick=()=>{
      const spans=document.querySelectorAll('.char');
      const corr=[...spans].filter(s=>s.classList.contains('correct')).length;
      const errs=[...spans].filter(s=>s.classList.contains('error')).length;
      const pct=Math.max(0,Math.round((corr/spans.length)*100));
      const users=getUsers(), prog=users[student].progress;
      if(!prog[dateKey]) prog[dateKey]=[];
      prog[dateKey].push({drill:idx,correct:corr,errors:errs,accuracy:pct,late:isLate});
      saveUsers(users);

      if(idx<drills.length-1){
        idx++; loadOne();
      } else {
        buildCalendar(student, code);
        promptEl.textContent='Typing Drill Completed!';
        nextBtn.disabled=true;
      }
    };

    loadOne();
  }

  function loadDrills(code, student){
    const cls=getClasses()[code];
    const today=new Date().toISOString().split('T')[0];
    renderDrillsWithDate(code, cls.customDrills[today]||cls.drills, today, student, false);
  }

  // Admin panel
  function enterAdmin(){
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
      </table>
    `;
    document.body.appendChild(panel);

    const users   = getUsers();
    const classes = getClasses();
    const valid   = new Set(Object.keys(classes));
    const body    = document.getElementById('admin-body');
    body.innerHTML = '';

    Object.entries(users).forEach(([u,d])=>{
      let info = d.role==='teacher'
        ? (d.classrooms||[]).join(', ')
        : (d.classroomCode||'');
      if(d.role==='student' && !valid.has(d.classroomCode)) {
        info = `<span style="color:red">${info||'none'}</span>`;
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u}</td><td>${d.role}</td><td>${info}</td>
        <td><button data-user="${u}" class="del-user">Delete</button></td>
      `;
      body.appendChild(tr);
    });

    document.querySelectorAll('.del-user').forEach(b=>{
      b.onclick = ()=>{
        const u = b.dataset.user;
        if(!confirm(`Delete ${u}?`)) return;
        deleteUser(u);
        enterAdmin();
      };
    });

    document.getElementById('cleanup-students').onclick = ()=>{
      if(!confirm('Delete orphan students?')) return;
      const u2 = getUsers();
      Object.entries(u2).forEach(([u,d])=>{
        if(d.role==='student' && !valid.has(d.classroomCode)) {
          delete u2[u];
        }
      });
      saveUsers(u2);
      enterAdmin();
    };

    document.getElementById('cleanup-teachers').onclick = ()=>{
      if(!confirm('Delete orphan teachers?')) return;
      const u2 = getUsers();
      Object.entries(u2).forEach(([u,d])=>{
        if(d.role==='teacher' && (!d.classrooms || d.classrooms.length===0)) {
          delete u2[u];
        }
      });
      saveUsers(u2);
      enterAdmin();
    };
  }

  function deleteUser(u){
    const us = getUsers();
    const cl = getClasses();
    if(us[u].role==='teacher'){
      us[u].classrooms.forEach(c=>delete cl[c]);
      saveClasses(cl);
    } else {
      const cc = us[u].classroomCode;
      if(cl[cc]) cl[cc].students = cl[cc].students.filter(x=>x!==u);
      saveClasses(cl);
    }
    delete us[u];
    saveUsers(us);
  }

} // end initApp
