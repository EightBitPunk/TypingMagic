// Version 0.1.62

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.62';
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
    const cls  = getClasses()[code];
    const prog = (getUsers()[student].progress)||{};
    const container = document.getElementById('calendar');
    container.innerHTML = '';  // clear out

    // Header with Prev/MonthName/Next
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    const hdr = document.createElement('div');
    hdr.style = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    hdr.innerHTML = `
      <button id="prev-month">&lt; Prev</button>
      <strong>${monthNames[calMonth]} ${calYear}</strong>
      <button id="next-month">Next &gt;</button>
    `;
    container.appendChild(hdr);

    // Build the days‐of‐week row
    const tbl = document.createElement('table');
    tbl.style.borderCollapse = 'collapse';
    const headerRow = document.createElement('tr');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const th = document.createElement('th');
      th.textContent = d;
      th.style.padding = '4px';
      headerRow.appendChild(th);
    });
    tbl.appendChild(headerRow);

    // Compute first weekday and days in month
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    let tr = document.createElement('tr');

    // Empty cells before month start
    for (let i = 0; i < firstDay; i++) {
      const td = document.createElement('td');
      td.style.padding = '4px';
      tr.appendChild(td);
    }

    // Fill each day
    for (let day = 1; day <= daysInMonth; day++) {
      if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
        tbl.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = day;
      td.style.width = '24px';
      td.style.height = '24px';
      td.style.textAlign = 'center';
      td.style.cursor = 'pointer';

      const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (prog[key]) {
        td.style.background = 'lightgreen';
        td.onclick = () => alert("You've already completed this drill.");
      } else {
        td.style.background = (new Date().toISOString().split('T')[0] > key)
                            ? 'lightcoral'
                            : (new Date().toISOString().split('T')[0] === key?'lightblue':'lightgray');
        if (new Date(key) < new Date()) {
          td.onclick = () => handlePast(code, key, student);
        }
      }

      tr.appendChild(td);
    }

    tbl.appendChild(tr);
    container.appendChild(tbl);

    // Wire up Prev / Next buttons
    document.getElementById('prev-month').onclick = () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalendar(student, code);
    };
    document.getElementById('next-month').onclick = () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
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
    const usersData = getUsers(), clsData = getClasses();
    const container = document.getElementById('student-progress-table');
    let html = '';

    (usersData[t].classrooms || []).forEach(code => {
      const c = clsData[code];
      if (!c) return;

      html += `
      <div style="margin-bottom:1.5em;padding:1em;border:1px solid #ccc;border-radius:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;">
          <div>
            <strong>${c.name}</strong> (Code: ${code})
            <button class="btn secondary" id="delete-selected-${code}">DELETE CHECKED ASSIGNMENTS</button>
          </div>
          <div>
            <button class="custom-btn" data-code="${code}">Customize Drills</button>
            <button class="bulk-btn" data-code="${code}">Bulk Upload</button>
            <button class="btn primary edit-class" data-code="${code}">EDIT CLASS</button>
          </div>
        </div>
        <input type="file" id="bulk-file-${code}" accept=".txt" class="hidden" />

        <div id="editor-${code}" style="display:none;margin-bottom:1em;">
          <label>Date: <input type="date" id="date-${code}" /></label>
          <label><input type="checkbox" id="all-${code}" /> All Classes</label><br>
          <textarea id="ta-${code}" rows="4" style="width:100%;margin-top:.5em;"></textarea><br>
          <button id="save-${code}" class="btn primary">Save</button>
          <button id="cancel-${code}" class="btn secondary">Cancel</button>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th><input type="checkbox" id="select-all-${code}" /></th>
            <th>Student</th><th>Assignment Date</th><th>Completed Same Day?</th><th>Accuracy</th>
          </tr>`;

      c.students.forEach(s => {
        const prog = usersData[s].progress||{};
        Object.entries(prog).forEach(([date,records]) => {
          const avg = Math.round(records.reduce((a,r)=>a+r.accuracy,0)/records.length);
          const late = records.some(r=>r.late);
          const lastTs = records[records.length-1].timestamp||date;
          html += `
          <tr${late?' class="late-row"':''} style="border-top:1px solid #eee;">
            <td style="text-align:center;"><input type="checkbox" class="del-assignment" data-student="${s}" data-date="${date}" /></td>
            <td>${s}</td><td>${date}</td><td>${lastTs.startsWith(date)?'YES':lastTs}</td><td>${avg}%</td>
          </tr>`;
        });
      });

      html += `</table></div>`;
    });

    container.innerHTML = html;

    // ─── Wire up all buttons ───
    (usersData[t].classrooms||[]).forEach(code => {
      // Customize
      document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = ()=> openEditor(t,code);
      // Bulk
      document.querySelector(`.bulk-btn[data-code="${code}"]`).onclick   = ()=> openBulk(t,code);
      document.getElementById(`bulk-file-${code}`).onchange            = e=> handleBulkUpload(e,code);
      // Delete‐checked
      document.getElementById(`delete-selected-${code}`).onclick       = () => {
        const boxes = [...document.querySelectorAll('.del-assignment:checked')];
        if (!boxes.length) { alert('No assignments checked.'); return; }
        if (!confirm(`Delete ${boxes.length} record(s)?`)) return;
        boxes.forEach(cb=>{
          const s = cb.dataset.student, d = cb.dataset.date;
          usersData[s].progress[d] = usersData[s].progress[d].filter(r=>r.date!==d);
          if (!usersData[s].progress[d].length) delete usersData[s].progress[d];
        });
        saveUsers(usersData);
        renderTeacher(t);
      };
      // Select-all
      document.getElementById(`select-all-${code}`).onchange = e => {
        const ch = e.target.checked;
        document.querySelectorAll('.del-assignment').forEach(cb=>cb.checked=ch);
      };
      // Edit class
      document.querySelector(`.edit-class[data-code="${code}"]`).onclick = ()=>{
        const cls = clsData[code];
        const student = prompt(`DELETE STUDENT:\n${cls.students.join('\n')}\n\nExact name to remove?`);
        if (!student) return;
        if (!cls.students.includes(student)) return alert('Not in this class.');
        if (!confirm(`Delete ${student}?`)) return;
        cls.students = cls.students.filter(s=>s!==student);
        const us = getUsers(); delete us[student];
        saveUsers(us); saveClasses(clsData);
        renderTeacher(t);
      };
      // Cancel editor
      document.getElementById(`cancel-${code}`).onclick = ()=> {
        document.getElementById(`editor-${code}`).style.display = 'none';
      };
      // Save editor
      document.getElementById(`save-${code}`).onclick = ()=> {
        const d     = document.getElementById(`date-${code}`).value;
        const lines = document.getElementById(`ta-${code}`).value
                         .split('\n').map(l=>l.trim()).filter(Boolean);
        const all   = document.getElementById(`all-${code}`).checked;
        const classes = getClasses();
        if (all) {
          getUsers()[t].classrooms.forEach(cid=>{
            classes[cid].customDrills = classes[cid].customDrills||{};
            classes[cid].customDrills[d]=lines;
          });
        } else {
          classes[code].customDrills = classes[code].customDrills||{};
          classes[code].customDrills[d]=lines;
        }
        saveClasses(classes);
        renderTeacher(t);
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




