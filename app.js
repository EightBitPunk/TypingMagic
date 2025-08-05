// app.js – Version 0.2.15

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── LocalStorage getters/setters ─────
const getUsers    = () => JSON.parse(localStorage.getItem('users')    || '{}');
const saveUsers   = u => localStorage.setItem('users', JSON.stringify(u));
const getClasses  = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
const saveClasses = c => localStorage.setItem('classrooms', JSON.stringify(c));

// ─── Mirror signup into LocalStorage ───
function setupUserInLocalStorage(email, role, code) {
  const users = getUsers();
  if (!users[email]) {
    users[email] = {
      role,
      classrooms: role === 'teacher' ? [] : undefined,
      classroomCode: role === 'student' ? code : undefined,
      progress: {}
    };
    if (role === 'student') {
      const classes = getClasses();
      if (!classes[code]) {
        document.getElementById('login-message').textContent = 'Classroom code not found.';
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
  badge.textContent = 'version 0.2.15';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

// ─── Main entrypoint ───────────────────
window.addEventListener('DOMContentLoaded', () => {
  showVersion();
  initApp();
});

function initApp() {
  // ─── Cached DOM refs ─────────────────
  const loginScreen  = document.getElementById('login-screen');
  const loginBtn     = document.getElementById('login-btn');
  const toggleBtn    = document.getElementById('toggle-mode-btn');
  const userIn       = document.getElementById('username');
  const passIn       = document.getElementById('password');
  const roleSel      = document.getElementById('role');
  const classIn      = document.getElementById('classroom-code');
  const loginMsg     = document.getElementById('login-message');
  const studentWrap  = document.getElementById('student-classroom-code');
  const logoutBtn    = document.getElementById('logout-btn');
  const teacherDash  = document.getElementById('teacher-dashboard');
  const classSetup   = document.getElementById('classroom-setup');
  const teacherView  = document.getElementById('teacher-classroom-view');
  const studentDash  = document.getElementById('student-dashboard');
  const studentName  = document.getElementById('student-name');
  const teacherName  = document.getElementById('teacher-name');
  const createBtn    = document.getElementById('create-classroom-btn');
  const newClassIn   = document.getElementById('new-classroom-name');
  const codeDisp     = document.getElementById('classroom-code-display');
  const calendarEl   = document.getElementById('calendar');
  const promptEl     = document.getElementById('prompt');
  const feedbackEl   = document.getElementById('feedback');
  const nextBtn      = document.getElementById('next-btn');
  const statsEl      = document.getElementById('student-stats');

  // ─── LocalStorage helpers ───────────
  const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser') || 'null');

  // ─── Versioned state ─────────────────
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  // ─── Sign‑up vs Login toggle ─────────
  let signUpMode = false;
  function updateMode() {
    loginBtn.textContent  = signUpMode ? 'Create Account' : 'Log In';
    toggleBtn.textContent = signUpMode ? 'Back to Login'   : 'Sign Up';
    studentWrap.classList.toggle('hidden', roleSel.value !== 'student' || !signUpMode);
    loginMsg.textContent = '';
  }
  toggleBtn.onclick = () => { signUpMode = !signUpMode; updateMode(); };
  roleSel.onchange  = () => studentWrap.classList.toggle('hidden', roleSel.value !== 'student');
  updateMode();

  // ─── Logout ─────────────────────────
  logoutBtn.style.display = 'none';
  logoutBtn.onclick = async () => {
    await signOut(auth);
    location.reload();
  };

  // ─── Login/Sign Up Handler ──────────
  loginBtn.onclick = async () => {
    loginMsg.textContent = '';
    const email = userIn.value.trim();
    const password = passIn.value;
    const role = roleSel.value;
    const code = classIn.value.trim();
    if (!email || !password || (signUpMode && role==='student' && !code)) {
      loginMsg.textContent = 'Complete all fields.'; return;
    }
    try {
      let cred;
      if (signUpMode) {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      if (!setupUserInLocalStorage(email, role, code)) return;
      localStorage.setItem('lastUser', email);
      localStorage.setItem('currentUser', JSON.stringify({ email, role }));

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
      console.error('Auth error:', err);
      loginMsg.textContent = err.message.replace('Firebase: ', '');
    }
  };

  // ─── Create Classroom ───────────────
  createBtn.onclick = () => {
    const name = newClassIn.value.trim();
    if (!name) { alert('Enter a class name.'); return; }
    const newCode = 'C' + (100000 + Math.floor(Math.random()*900000));
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

  // ─── Student view ───────────────────
  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }
  function loadDrills(code, student) {
    const today = new Date().toISOString().slice(0,10);
    const cls = getClasses()[code];
    renderDrillsWithDate(code, cls.customDrills[today]||cls.drills, today, student, false);
  }
  
  function buildCalendar(student, code) {
    const cls  = getClasses()[code];
    const prog = (getUsers()[student].progress)||{};
    calendarEl.innerHTML = '';

    // Header
    const monthNames = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
    const hdr = document.createElement('div');
    hdr.style = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    hdr.innerHTML = `
      <button id="prev-month">&lt; Prev</button>
      <strong>${monthNames[calMonth]} ${calYear}</strong>
      <button id="next-month">Next &gt;</button>
    `;
    calendarEl.appendChild(hdr);

    // Table
    const tbl = document.createElement('table');
    tbl.style.borderCollapse = 'collapse';
    const headerRow = document.createElement('tr');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const th = document.createElement('th'); th.textContent = d; th.style.padding = '4px';
      headerRow.appendChild(th);
    });
    tbl.appendChild(headerRow);

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    let tr = document.createElement('tr');

    for (let i = 0; i < firstDay; i++) {
      const td = document.createElement('td'); td.style.padding = '4px'; tr.appendChild(td);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      if ((firstDay + day - 1) % 7 === 0 && day !== 1) { tbl.appendChild(tr); tr = document.createElement('tr'); }
      const td = document.createElement('td');
      td.textContent = day;
      td.style = 'width:24px;height:24px;text-align:center;cursor:pointer';
      const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (prog[key]) {
        td.style.background = 'lightgreen'; td.onclick = () => alert("Completed");
      } else {
        const todayKey = new Date().toISOString().slice(0,10);
        td.style.background = key < todayKey ? 'lightcoral'
                            : key === todayKey ? 'lightblue'
                            : 'lightgray';
        if (key < todayKey) td.onclick = () => handlePast(code, key, student);
      }
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
    calendarEl.appendChild(tbl);

    document.getElementById('prev-month').onclick = () => { calMonth--; if (calMonth<0){calMonth=11;calYear--;} buildCalendar(student, code); };
    document.getElementById('next-month').onclick = () => { calMonth++; if (calMonth>11){calMonth=0;calYear++;} buildCalendar(student, code); };
  }

  function handlePast(code, key, student) {
    const cls = getClasses()[code];
    const drills = cls.customDrills[key]||cls.drills;
    if (!confirm(`Preview for ${key}\n\n${drills.join('\n')}`)) return;
    renderDrillsWithDate(code, drills, key, student, true);
  }

  function renderDrillsWithDate(code, drills, dateKey, student, isLate) {
    let idx=0, pos=0;
    statsEl.textContent=''; promptEl.innerHTML='';
    drills[idx].split('').forEach(ch=>{
      const span=document.createElement('span'); span.textContent=ch; span.className='char'; promptEl.appendChild(span);
    });
    nextBtn.disabled=true;

    function updateAcc() {
      const spans=[...promptEl.querySelectorAll('.char')];
      const errs=spans.filter(s=>s.classList.contains('error')).length;
      statsEl.textContent = `Accuracy: ${Math.round((spans.length-errs)/spans.length*100)}%`;
    }
    document.onkeydown = e => {
      if (e.key==='Backspace') {
        e.preventDefault(); if (pos>0) { pos--; const spans=promptEl.querySelectorAll('.char'); spans[pos].classList.remove('correct','error'); updateAcc(); nextBtn.disabled=true; } return; }
      if (e.key.length!==1 || pos>=drills[idx].length) { e.preventDefault(); return; }
      const spans=promptEl.querySelectorAll('.char'); spans[pos].classList.remove('current');
