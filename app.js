// Version 0.2.14

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ─── Firebase init ─────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBIMcBtlLhHhBaAnzSDQIp5S608lyEgo-o",
  authDomain: "typingmastery-acf2f.firebaseapp.com",
  projectId: "typingmastery-acf2f",
  storageBucket: "typingmastery-acf2f.appspot.com",
  messagingSenderId: "199688909073",
  appId: "1:199688909073:web:689e8c7e8fa6167170dcb0"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── Helpers for localStorage mirror ───
const getUsers    = () => JSON.parse(localStorage.getItem('users')    || '{}');
const saveUsers   = u  => localStorage.setItem('users', JSON.stringify(u));
const getClasses  = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
const saveClasses = c  => localStorage.setItem('classrooms', JSON.stringify(c));

function setupUserInLocalStorage(email, role, code) {
  const users = getUsers();
  if (!users[email]) {
    users[email] = {
      role,
      classrooms: role === "teacher" ? [] : undefined,
      classroomCode: role === "student" ? code : undefined
    };
    if (role === "student") {
      const classes = getClasses();
      if (!classes[code]) {
        document.getElementById("login-message").textContent = "Classroom code not found.";
        return false;
      }
      classes[code].students.push(email);
      saveClasses(classes);
    }
    saveUsers(users);
  }
  return true;
}

// ─── Show version badge ─────────────────
function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.2.14';
  Object.assign(badge.style, {
    position: 'fixed',
    bottom: '5px',
    right: '10px',
    fontSize: '0.8em',
    color: 'gray',
    background: 'rgba(255,255,255,0.8)',
    padding: '2px 5px',
    borderRadius: '3px',
    pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

// ─── Kick things off ────────────────────
window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function initApp() {
  // ─── Grab the DOM ──────────────────────
  const loginScreen = document.getElementById('login-screen');
  const loginBtn    = document.getElementById('login-btn');
  const toggleBtn   = document.getElementById('toggle-mode-btn');
  const userIn      = document.getElementById('username');
  const passIn      = document.getElementById('password');
  const roleSel     = document.getElementById('role');
  const classIn     = document.getElementById('classroom-code');
  const loginMsg    = document.getElementById('login-message');
  const studentWrap = document.getElementById('student-classroom-code');
  const logoutBtn   = document.getElementById('logout-btn');
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
  const promptEl    = document.getElementById('prompt');
  const feedbackEl  = document.getElementById('feedback');
  const nextBtn     = document.getElementById('next-btn');
  const calendarEl  = document.getElementById('calendar');
  const statsEl     = document.getElementById('student-stats');

  // restore last username
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) userIn.value = lastUser;

  // sign-up vs login toggle
  let signUpMode = false;
  function updateMode() {
    loginBtn.textContent  = signUpMode ? 'Create Account' : 'Log In';
    toggleBtn.textContent = signUpMode ? 'Back to Login'   : 'Sign Up';
    studentWrap.classList.toggle('hidden', roleSel.value!=='student' || !signUpMode);
    loginMsg.textContent = '';
  }
  toggleBtn.onclick = () => { signUpMode = !signUpMode; updateMode(); };
  roleSel.onchange  = () => studentWrap.classList.toggle('hidden', roleSel.value!=='student');
  updateMode();

  // ─── Logout ────────────────────────────
  logoutBtn.style.display = 'none';
  logoutBtn.onclick = async () => {
    await signOut(auth);
    location.reload();
  };

  // ─── Login / Sign-up handler ───────────
  loginBtn.onclick = async () => {
    loginMsg.textContent = '';
    const email    = userIn.value.trim();
    const password = passIn.value;
    const role     = roleSel.value;
    const code     = classIn.value.trim();

    if (!email || !password || (signUpMode && role==='student' && !code)) {
      loginMsg.textContent = 'Complete all fields.';
      return;
    }

    try {
      let cred;
      if (signUpMode) {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }

      // mirror into localStorage
      if (!setupUserInLocalStorage(email, role, code)) return;
      localStorage.setItem('lastUser', email);
      localStorage.setItem('currentUser', JSON.stringify({ email, role }));

      // show dashboards
      loginScreen.classList.add('hidden');
      logoutBtn.style.display = 'block';

      if (email === 'magiccaloriecam@gmail.com') {
        document.getElementById('admin-dashboard').classList.remove('hidden');
      }
      else if (role === 'teacher') {
        teacherName.textContent = email;
        teacherDash.classList.remove('hidden');
        classSetup.classList.remove('hidden');
        teacherView.classList.remove('hidden');
        renderTeacher(email);
      } else {
        studentName.textContent = email;
        studentDash.classList.remove('hidden');
        renderStudent(code, email);
      }

    } catch (err) {
      console.error('❌ Auth error:', err);
      loginMsg.textContent = err.message.replace('Firebase: ', '');
    }
  };

  // ─── Create Classroom ─────────────────
  createBtn.onclick = () => {
    const name = newClassIn.value.trim();
    if (!name) return alert('Enter a class name.');
    const newCode = 'C' + (100000 + Math.floor(Math.random() * 900000));
    const classes = getClasses();
    classes[newCode] = {
      name,
      teacher: teacherName.textContent,
      students: [],
      drills: [
        'The quick brown fox jumps over the lazy dog.',
        'Typing practice improves both speed and accuracy.',
        'Accuracy over speed.'
      ],
      customDrills: {}
    };
    saveClasses(classes);

    const users = getUsers();
    users[teacherName.textContent].classrooms.push(newCode);
    saveUsers(users);

    codeDisp.textContent = `New Code: ${newCode}`;
    renderTeacher(teacherName.textContent);
  };

  // ─── Student calendar & drills ────────
  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }
  function loadDrills(code, student) {
    const today = new Date().toISOString().slice(0,10);
    const cls   = getClasses()[code];
    renderDrillsWithDate(code, cls.customDrills[today]||cls.drills, today, student, false);
  }

  function buildCalendar(student, code) {
    const cls  = getClasses()[code];
    const prog = getUsers()[student].progress || {};
    calendarEl.innerHTML = '';

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const hdr = document.createElement('div');
    hdr.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    hdr.innerHTML = `
      <button id="prev-month">&lt;</button>
      <strong>${monthNames[calMonth]} ${calYear}</strong>
      <button id="next-month">&gt;</button>
    `;
    calendarEl.appendChild(hdr);

    const tbl = document.createElement('table');
    tbl.style = 'border-collapse:collapse;width:100%';
    const headerRow = document.createElement('tr');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{
      const th = document.createElement('th'); th.textContent = d; th.style.padding='4px';
      headerRow.appendChild(th);
    });
    tbl.appendChild(headerRow);

    let tr = document.createElement('tr');
    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();

    for (let i=0; i<firstDay; i++) {
      const td = document.createElement('td'); td.style.padding='4px';
      tr.appendChild(td);
    }
    for (let d=1; d<=daysInMonth; d++) {
      if ((firstDay + d - 1) % 7 === 0 && d>1) {
        tbl.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = d;
      td.style = 'width:24px;height:24px;text-align:center;cursor:pointer';
      const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; 

      if (prog[key]) {
        td.style.background='lightgreen';
        td.onclick = ()=>alert("Completed");
      } else {
        const todayKey = new Date().toISOString().slice(0,10);
        td.style.background = key < todayKey ? 'lightcoral'
                            : key === todayKey ? 'lightblue'
                            : 'lightgray';
        if (key < todayKey) td.onclick = ()=>handlePast(code,key,student);
      }
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
    calendarEl.appendChild(tbl);

    document.getElementById('prev-month').onclick = ()=>{
      calMonth--; if (calMonth<0){ calMonth=11; calYear--; }
      buildCalendar(student, code);
    };
    document.getElementById('next-month').onclick = ()=>{
      calMonth++; if (calMonth>11){ calMonth=0; calYear++; }
      buildCalendar(student, code);
    };
  }

  function handlePast(code, key, student) {
    const cls    = getClasses()[code];
    const drills = cls.customDrills[key]||cls.drills;
    if (!confirm(`Preview for ${key}\n\n${drills.join('\n')}`)) return;
    renderDrillsWithDate(code, drills, key, student, true);
  }

  function renderDrillsWithDate(code, drills, dateKey, student, isLate) {
    /* same drill-rendering logic as before */
  }
}

// ─── Teacher / Admin helpers ───
function renderTeacher(u) { /* unchanged */ }
function enterAdmin()       { /* unchanged */ }
function deleteUser(u)      { /* unchanged */ }


// ─── Teacher / Admin helpers (outside initApp) ───
function renderTeacher(u) {
  const users   = JSON.parse(localStorage.getItem('users')    || '{}');
  const classes = JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const container = document.getElementById('student-progress-table');
  container.innerHTML = '';

  (users[u].classrooms||[]).forEach(code => {
    const c = classes[code]; if (!c) return;
    const card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML = `
      <h4>${c.name} (${code})</h4>
      <button class="bulk-btn" data-code="${code}">Bulk Upload</button>
      <button class="custom-btn" data-code="${code}">Customize Drills</button>
      <div id="students-${code}"><strong>Students:</strong><ul></ul></div>
      <div id="assignments-${code}"><strong>Assignments:</strong><table><tr><th>Date</th><th>Avg % Acc</th></tr></table></div>
    `;
    container.appendChild(card);

    // wire bulk + custom drills (you can hook up same handlers as before)
    card.querySelector('.bulk-btn').onclick = ()=> openBulk(u, code);
    card.querySelector('.custom-btn').onclick = ()=> openEditor(u, code);

    // fill students
    const ul = card.querySelector(`#students-${code} ul`);
    c.students.forEach(s => {
      const li = document.createElement('li'); li.textContent = s;
      ul.appendChild(li);
    });
    // fill assignments
    const tbl = card.querySelector(`#assignments-${code} table`);
    Object.entries(users).forEach(([stu, data])=>{
      const prog = (data.progress||{})[code]||[];
      prog.forEach(rec=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${rec.dateKey}</td><td>${rec.accuracy}%</td>`;
        tbl.appendChild(tr);
      });
    });
  });
}

function enterAdmin() {
  // your existing admin panel code
}

function deleteUser(u) {
  // your existing deleteUser logic
}
