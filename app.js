// Version 0.1.71_C

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.71.C';
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


// ─── Student side ───

// Called on login and whenever calendar nav changes
function renderStudent(code, student) {
  buildCalendar(student, code);
  loadDrills(code, student);
}

// Draws calendar with month/year nav and respect to allowPast/allowFuture
function buildCalendar(student, code) {
  const classes     = getClasses();
  const cls         = classes[code] || {};
  const prog        = (getUsers()[student].progress) || {};
  const allowPast   = cls.allowPast   === true;
  const allowFuture = cls.allowFuture === true;

  const container = document.getElementById('calendar');
  container.innerHTML = '';

  // Header
  const monthNames = [ "January","February","March","April","May","June",
                       "July","August","September","October","November","December" ];
  const hdr = document.createElement('div');
  hdr.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  hdr.innerHTML = `
    <button id="prev-month">&#x276E;</button>
    <strong>${monthNames[calMonth]} ${calYear}</strong>
    <button id="next-month">&#x276F;</button>
  `;
  container.appendChild(hdr);

  // Days-of-week header
  const tbl = document.createElement('table');
  tbl.style.borderCollapse = 'collapse';
  const headerRow = document.createElement('tr');
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{
    const th = document.createElement('th');
    th.textContent = d;
    th.style.padding = '4px';
    headerRow.appendChild(th);
  });
  tbl.appendChild(headerRow);

  // Compute
  const firstDay   = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth= new Date(calYear, calMonth+1, 0).getDate();
  let tr = document.createElement('tr');

  // Empty cells
  for (let i=0; i<firstDay; i++){
    const td = document.createElement('td');
    td.style.padding='4px';
    tr.appendChild(td);
  }

  // Date cells
  const todayISO = new Date().toISOString().slice(0,10);
  for (let day=1; day<=daysInMonth; day++){
    if ((firstDay + day -1)%7===0 && day!==1) {
      tbl.appendChild(tr);
      tr = document.createElement('tr');
    }
    const date = new Date(calYear, calMonth, day);
    const iso  = date.toISOString().slice(0,10);
    const td   = document.createElement('td');
    td.textContent = day;
    td.style.textAlign = 'center';
    td.style.padding = '4px';
    td.style.cursor = 'pointer';

    const completed = !!prog[iso];
    const isBefore  = iso < todayISO;
    const isAfter   = iso > todayISO;

    // color
    if (completed)             td.style.background = 'lightgreen';
    else if (isBefore)         td.style.background = 'lightcoral';
    else if (iso === todayISO) td.style.background = 'lightblue';
    else                       td.style.background = 'lightgray';

    // click handler
    td.onclick = () => {
      // past
      if (isBefore && !allowPast) {
        return alert(
          "I'm sorry, currently students can only complete their work on the day it is assigned."
        );
      }
      // future but no drill exists
      const clsDrills = classes[code].customDrills || {};
      const hasDrill  = Array.isArray(clsDrills[iso]) || Array.isArray(classes[code].drills);
      if (isAfter) {
        if (!allowFuture) {
          return alert(
            "I'm sorry, students can only complete their work on the day it is assigned, and can't complete future assignments at this time."
          );
        }
        if (!hasDrill) {
          return alert(
            "I'm sorry, the lesson for this date has not been created yet."
          );
        }
      }
      // normal or late or on-time
      handleDrillDate(code, iso, student, completed);
    };

    tr.appendChild(td);
  }
  tbl.appendChild(tr);
  container.appendChild(tbl);

  // nav
  document.getElementById('prev-month').onclick = () => {
    calMonth--; if (calMonth<0) { calMonth=11; calYear--; }
    buildCalendar(student, code);
  };
  document.getElementById('next-month').onclick = () => {
    calMonth++; if (calMonth>11){ calMonth=0; calYear++; }
    buildCalendar(student, code);
  };
}

// Central handler for clicking any valid date
function handleDrillDate(code, dateKey, student, isCompleted) {
  const cls    = getClasses()[code];
  const drills = cls.customDrills[dateKey] || cls.drills;
  if (isCompleted) {
    // (2) show completed message INSIDE drill box
    promptEl.textContent = '';
    feedbackEl.textContent = `Assignment completed today! You scored ${getUsers()[student].progress[dateKey][0].accuracy}%`;
    nextBtn.disabled = true;
    return;
  }
  // preview / start
  if (!confirm(`Preview drill for ${dateKey}?\n\n${drills.join('\n')}\n\nProceed?`)) {
    return;
  }
  renderDrillsWithDate(code, drills, dateKey, student, /*isLate=*/ dateKey < new Date().toISOString().slice(0,10));
}

// unchanged from before
function renderDrillsWithDate(code, drills, dateKey, student, isLate) {
  // … your existing typing‐drill logic …
}

function loadDrills(code, student) {
  const today = new Date().toISOString().slice(0,10);
  const cls   = getClasses()[code];
  renderDrillsWithDate(
    code,
    (cls.customDrills[today] || cls.drills),
    today, student, false
  );
}
// ─── end Student side ───


// ─── StartTeacherView  ───

function renderTeacher(t) {
  const usersData = getUsers();
  const clsData   = getClasses();
  const container = document.getElementById('student-progress-table');
  container.innerHTML = '';  // clear

  usersData[t].classrooms.forEach(code => {
    const c = clsData[code];
    if (!c) return;

    // Card wrapper
    const card = document.createElement('div');
    card.style = 'margin-bottom:1.5em;padding:1em;border:1px solid #ccc;border-radius:4px;';

    // Header row with Delete Selected + buttons
    const header = document.createElement('div');
    header.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;';
    header.innerHTML = `
      <div>
        <strong>${c.name}</strong> (Code: ${code})
        <button class="btn secondary" id="delete-selected-${code}">
          DELETE SELECTED ASSIGNMENTS
        </button>
      </div>
      <div>
        <button class="custom-btn" data-code="${code}">Customize Drills</button>
        <button class="bulk-btn"   data-code="${code}">Bulk Upload</button>
        <button class="btn primary edit-class" data-code="${code}">EDIT CLASS</button>
      </div>
    `;
    card.appendChild(header);

    // ─── Hidden bulk-upload input ───
    const fileInput = document.createElement('input');
    fileInput.type        = 'file';
    fileInput.id          = `bulk-file-${code}`;
    fileInput.accept      = '.txt';
    fileInput.classList.add('hidden');
    card.appendChild(fileInput);

    // ─── Drill-editor (Customize Drills) ───
    const editorDiv = document.createElement('div');
    editorDiv.id    = `editor-${code}`;
    editorDiv.style = 'display:none;margin-bottom:1em;';
    editorDiv.innerHTML = `
      <label>Date: <input type="date" id="date-${code}" /></label>
      <label style="margin-left:.5em;">
        <input type="checkbox" id="all-${code}" /> All Classes
      </label><br/>
      <textarea id="ta-${code}" rows="4" style="width:100%;margin-top:.5em;"></textarea><br/>
      <button id="save-${code}" class="btn primary" style="margin-right:.5em;">Save</button>
      <button id="cancel-${code}" class="btn secondary">Cancel</button>
    `;
    card.appendChild(editorDiv);

    // ─── Past / future checkboxes ───
    const settings = document.createElement('div');
    settings.style = 'margin-bottom:1em;font-size:0.85em;';
    settings.innerHTML = `
      <label>
        <input type="checkbox" class="allow-past" data-code="${code}"
               ${c.allowPast?'checked':''} />
        Students can complete <strong>past</strong> lessons
      </label><br/>
      <label>
        <input type="checkbox" class="allow-future" data-code="${code}"
               ${c.allowFuture?'checked':''} />
        Students can complete <strong>future</strong> lessons
      </label>
    `;
    card.appendChild(settings);

    // ─── Progress table ───
    const tbl = document.createElement('table');
    tbl.style = 'width:100%;border-collapse:collapse;';
    tbl.innerHTML = `
      <tr>
        <th><input type="checkbox" id="select-all-${code}" /></th>
        <th>Student</th><th>Assignment Date</th>
        <th>Completed Same Day?</th><th>Accuracy</th>
      </tr>
    `;
    (c.students||[]).forEach(s => {
      const prog = (usersData[s]||{}).progress||{};
      Object.entries(prog).forEach(([date, recs]) => {
        const avg    = Math.round(recs.reduce((sum,r)=>sum+r.accuracy,0)/recs.length);
        const late   = recs.some(r=>r.late);
        const lastTs = recs[recs.length-1].timestamp||date;
        const same   = lastTs.startsWith(date)?'YES':lastTs;
        const row = document.createElement('tr');
        if (late) row.classList.add('late-row');
        row.style.borderTop = '1px solid #eee';
        row.innerHTML = `
          <td style="text-align:center;">
            <input type="checkbox" class="del-assignment"
                   data-student="${s}" data-date="${date}" />
          </td>
          <td>${s}</td>
          <td>${date}</td>
          <td>${same}</td>
          <td>${avg}%</td>
        `;
        tbl.appendChild(row);
      });
    });
    card.appendChild(tbl);

    container.appendChild(card);

    // ─── Wire up handlers ───

    // Bulk-upload
    card.querySelector(`.bulk-btn[data-code="${code}"]`)
        .onclick = () => fileInput.click();
    fileInput.onchange = e => handleBulkUpload(e, code);

    // Customize drills
    card.querySelector(`.custom-btn[data-code="${code}"]`)
        .onclick = () => editorDiv.style.display = 'block';
    card.querySelector(`#cancel-${code}`)
        .onclick = () => editorDiv.style.display = 'none';
    card.querySelector(`#save-${code}`)
        .onclick = () => { /* your existing save logic */ renderTeacher(t); };

    // Persist allowPast / allowFuture
    card.querySelector(`.allow-past[data-code="${code}"]`)
        .onchange = e => {
          const all = getClasses();
          all[code].allowPast = e.target.checked;
          saveClasses(all);
        };
    card.querySelector(`.allow-future[data-code="${code}"]`)
        .onchange = e => {
          const all = getClasses();
          all[code].allowFuture = e.target.checked;
          saveClasses(all);
        };

    // DELETE SELECTED ASSIGNMENTS
    document.getElementById(`delete-selected-${code}`)
      .onclick = () => { /* your existing delete logic */ renderTeacher(t); };

    // Select-All
    document.getElementById(`select-all-${code}`)
      .onchange = e => {
        const ch = e.target.checked;
        card.querySelectorAll('.del-assignment')
            .forEach(cb => cb.checked = ch);
      };

    // Edit Class (remove student)
    card.querySelector(`.edit-class[data-code="${code}"]`)
        .onclick = () => { /* your existing edit logic */ renderTeacher(t); };
  });
}

  // ─── StartAdmin Admin ───
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












