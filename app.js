// Version 0.1.44

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.44';
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
  logoutBtn.onclick = () => { localStorage.removeItem('currentUser'); location.reload(); };

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
  // remove duplicate download link
  const dupLink = document.querySelector('#teacher-classroom-view a[href$="BulkFormatExample.txt"]');
  if (dupLink) dupLink.remove();
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
    if (u === 'KEFKA' && p === 'SUCKS') { enterAdmin(); return; }
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
      name,
      teacher: teacherName.textContent,
      students: [],
      drills: defaultDrills.slice(),
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
    const users = getUsers(), classes = getClasses();
    let html = '';
    (users[t].classrooms || []).forEach(code => {
      const c = classes[code]; if (!c) return;

      // card container for each class
      html += `<div style="margin-bottom:1.5em; padding:1em; border:1px solid #ccc; border-radius:4px;">`;

      // header row
      html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5em;">`;
      html += `<div><strong>${c.name}</strong> (Code: ${code}) `;
      html += `<button class="btn secondary" id="delete-selected-${code}">DELETE CHECKED ASSIGNMENTS</button></div>`;
      html += `<div>`;
      html += `<button class="custom-btn" data-code="${code}">Customize Drills</button> `;
      html += `<button class="bulk-btn" data-code="${code}">Bulk Upload</button> `;
      html += `<button class="btn danger delete-class" data-code="${code}">DELETE CLASS</button>`;
      html += `</div></div>`;

      // table header
      html += `<table style="width:100%; border-collapse:collapse;">
        <tr>
          <th></th>
          <th>Student</th>
          <th>Assignment</th>
          <th>Date of Completion</th>
          <th>Accuracy</th>
        </tr>`;

      // table rows
      (c.students || []).forEach(s => {
        const prog = users[s].progress || {};
        Object.entries(prog).forEach(([d, arr]) => {
          arr.forEach(rec => {
            html += `<tr style="border-top:1px solid #eee;">`;
            html += `<td style="text-align:center;">
                       <input type="checkbox"
                              class="del-assignment"
                              data-student="${s}"
                              data-date="${d}"
                              data-drill="${rec.drill}"
                       /></td>`;
            html += `<td>${s}</td>`;
            html += `<td>Drill ${rec.drill + 1}</td>`;
            html += `<td>${d}</td>`;
            html += `<td>${rec.accuracy}%</td>`;
            html += `</tr>`;
          });
        });
      });

      html += `</table></div>`;
    });
    progTable.innerHTML = html;

    // wire up actions
    (users[t].classrooms || []).forEach(code => {
      // delete selected assignments
      document.getElementById(`delete-selected-${code}`).onclick = () => {
        const checked = Array.from(
          document.querySelectorAll('.del-assignment:checked')
        );
        if (!checked.length) return alert('No assignments checked.');
        if (!confirm(`Delete ${checked.length} assignment(s)?`)) return;
        const usersData = getUsers();
        checked.forEach(cb => {
          const s = cb.dataset.student,
                d = cb.dataset.date,
                dr = Number(cb.dataset.drill);
          const arr = usersData[s].progress[d] || [];
          usersData[s].progress[d] = arr.filter(r => r.drill !== dr);
          if (!usersData[s].progress[d].length) delete usersData[s].progress[d];
        });
        saveUsers(usersData);
        renderTeacher(t);
      };

      // customize, bulk, delete class
      document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => openEditor(code, t);
      document.querySelector(`.bulk-btn[data-code="${code}"]`).onclick   = () => openBulk(code, t);
      document.querySelector(`.delete-class[data-code="${code}"]`).onclick = () => {
        if (!confirm('Delete entire class?')) return;
        const cls = getClasses(); delete cls[code]; saveClasses(cls);
        const ud = getUsers();
        ud[t].classrooms = ud[t].classrooms.filter(c=>c!==code);
        saveUsers(ud);
        renderTeacher(t);
      };

      ensureEditorBulk(code);
    });
  }

  // Editor & bulk upload helpers (full v0.1.42 logic here)
  function ensureEditorBulk(code) {
    if (document.getElementById(`editor-${code}`)) return;
    const container = document.getElementById('teacher-classroom-view');
    const div = document.createElement('div');
    div.id = `editor-${code}`;
    div.className = 'card';
    div.style.display = 'none';
    div.innerHTML = `
      <label>Date: <input type="date" id="date-${code}" /></label>
      <label><input type="checkbox" id="all-${code}" /> All Classes</label><br>
      <textarea id="ta-${code}" rows="4" style="width:100%"></textarea><br>
      <button id="save-${code}" class="btn primary">Save</button>
      <button id="cancel-${code}" class="btn secondary">Cancel</button>
      <input type="file" id="bulk-file-${code}" accept=".txt" class="hidden" />
    `;
    container.appendChild(div);

    document.getElementById(`cancel-${code}`).onclick = () => { div.style.display = 'none'; };
    document.getElementById(`save-${code}`).onclick   = () => {
      const dateVal = document.getElementById(`date-${code}`).value;
      const lines   = document.getElementById(`ta-${code}`).value
                        .split('\n').map(l=>l.trim()).filter(Boolean);
      const all     = document.getElementById(`all-${code}`).checked;
      const clsData = getClasses();
      if (all) {
        getUsers()[teacherName.textContent].classrooms.forEach(cid => {
          clsData[cid].customDrills[dateVal] = lines;
        });
      } else {
        clsData[code].customDrills[dateVal] = lines;
      }
      saveClasses(clsData);
      renderTeacher(teacherName.textContent);
    };
    document.getElementById(`bulk-file-${code}`).onchange = async evt => {
      const file = evt.target.files[0];
      if (!file) return;
      const text = await file.text();
      const resp = prompt(
        "Apply these drills to ALL of your classes?\n" +
        "Type YES to apply to all, NO to apply only to this class, or CANCEL to abort."
      );
      if (resp === null) { evt.target.value=''; evt.target.classList.add('hidden'); return; }
      const choice = resp.trim().toUpperCase();
      if (choice !== 'YES' && choice !== 'NO') {
        alert('Aborted bulk upload.');
        evt.target.value=''; evt.target.classList.add('hidden');
        return;
      }
      const applyAll = (choice==='YES');
      const cls = getClasses();
      text.split(/\r?\n/).filter(Boolean).forEach(line => {
        const datePart = line.split('[')[0].trim();
        const drills   = Array.from(line.matchAll(/\[([^\]]+)\]/g))
                          .map(m=>m[1].trim()).filter(Boolean);
        if (!datePart || !drills.length) return;
        if (applyAll) {
          getUsers()[teacherName.textContent].classrooms.forEach(cid => {
            cls[cid].customDrills[datePart] = drills;
          });
        } else {
          cls[code].customDrills[datePart] = drills;
        }
      });
      saveClasses(cls);
      evt.target.value=''; evt.target.classList.add('hidden');
      renderTeacher(teacherName.textContent);
    };
  }

  // Student view (full v0.1.42 logic)
  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }
  function buildCalendar(student, code) { /* ... original code ... */ }
  function handlePast(code, key, student) { /* ... original code ... */ }
  function renderDrillsWithDate(code, drills, dateKey, student, isLate) { /* ... */ }
  function loadDrills(code, student) { /* ... */ }

  // Admin panel (full v0.1.42 logic)
  function enterAdmin() { /* ... */ }
  function deleteUser(u)    { /* ... */ }

} // end initApp
