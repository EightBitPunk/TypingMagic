// Version 0.1.25

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.25';
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

  // Utilities
  const getUsers = () => JSON.parse(localStorage.getItem('users') || '{}');
  const saveUsers = u => localStorage.setItem('users', JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem('classrooms') || '{}');
  const saveClasses = c => localStorage.setItem('classrooms', JSON.stringify(c));

  // Create Logout button
  let logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Log Out';
    Object.assign(logoutBtn.style, {
      position: 'fixed', top: '5px', right: '10px',
      padding: '0.3em 0.6em', fontSize: '0.9em', display: 'none', cursor: 'pointer'
    });
    document.body.appendChild(logoutBtn);
    logoutBtn.onclick = () => {
      localStorage.removeItem('currentUser');
      location.reload();
    };
  }

  // DOM references
  const loginScreen = document.getElementById('login-screen');
  const loginBtn    = document.getElementById('login-btn');
  let toggleBtn     = document.getElementById('toggle-mode-btn');
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

  // Sign-up toggle
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent  = isSignUp ? 'Sign Up' : 'Log In';
    toggleBtn.textContent = isSignUp ? 'Go to Log In' : 'Go to Sign Up';
    studentWrap.classList.toggle('hidden', !(isSignUp && roleSel.value === 'student'));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // Login persistence
  const session = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (session && session.username && session.role !== 'admin') {
    const users = getUsers();
    if (users[session.username] && users[session.username].role === session.role) {
      enterDash(session.username, session.role);
      return;
    }
    localStorage.removeItem('currentUser');
  }

  // Login / Signup
  loginBtn.onclick = () => {
    loginMsg.textContent = '';
    const u    = userIn.value.trim();
    const p    = passIn.value;
    const role = roleSel.value;
    const code = classIn.value.trim();

    // Admin shortcut
    if (u === 'KEFKA' && p === 'SUCKS') {
      enterAdmin(); showLogout(false);
      return;
    }

    if (!u || !p || (isSignUp && role==='student' && !code)) {
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
        const cls = getClasses(); cls[code].students.push(u); saveClasses(cls);
      }
      saveUsers(users);
      localStorage.setItem('currentUser', JSON.stringify({ username: u, role }));
      enterDash(u, role);
    } else {
      if (users[u] && users[u].password===p && users[u].role===role) {
        localStorage.setItem('currentUser', JSON.stringify({ username: u, role }));
        enterDash(u, role);
      } else {
        loginMsg.textContent = 'Incorrect credentials.';
      }
    }
  };

  function showLogout(show) {
    logoutBtn.style.display = show ? 'block' : 'none';
  }

  function enterDash(u, role) {
    showLogout(true);
    loginScreen.classList.add('hidden');
    if (role==='teacher') {
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

  // Create new class
  createBtn.onclick = () => {
    const name = newClassIn.value.trim(); if (!name) return;
    const code = 'C' + Math.floor(100000 + Math.random()*900000);
    const cls = getClasses();
    cls[code] = { name, teacher:teacherName.textContent, students:[], drills:defaultDrills.slice(), customDrills:{} };
    saveClasses(cls);
    const users = getUsers(); users[teacherName.textContent].classrooms.push(code); saveUsers(users);
    codeDisp.textContent = `New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  // Render Teacher
  function renderTeacher(t) {
    const users = getUsers(), cls = getClasses();
    let html = '';
    users[t].classrooms.forEach(code => {
      const c = cls[code]; if (!c) return;
      html += `<h3>${c.name} (Code:${code}) ` +
              `<button class='custom-btn' data-code='${code}'>Customize Drills</button> ` +
              `<span class='del-class' data-code='${code}'>🗑️</span></h3>`;
      html += `<div id='editor-${code}' style='display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;'>` +
              `<label>Date:<input type='date' id='date-${code}' /></label><br>` +
              `<textarea id='ta-${code}' rows='4' style='width:100%'></textarea><br>` +
              `<label><input type='checkbox' id='all-${code}' /> All classes</label><br>` +
              `<button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button>` +
              `</div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s => {
        const pr = users[s].progress || {};
        Object.entries(pr).forEach(([d, arr]) => {
          const avg = arr.length ? Math.round(arr.reduce((x,y)=>x+y.accuracy,0)/arr.length) : 0;
          const err = arr.reduce((x,y)=>x+y.errors,0);
          html += `<tr><td>${s}<span class='del-student' data-code='${code}' data-student='${s}'>🗑️</span></td>` +
