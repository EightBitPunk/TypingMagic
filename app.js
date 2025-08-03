// Version 0.1.95B

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
      apiKey: "AIzaSyBIMcBtlLhHhBaAnzSDQIp5S608lyEgo-o",
      authDomain: "typingmastery-acf2f.firebaseapp.com",
      projectId: "typingmastery-acf2f",
      storageBucket: "typingmastery-acf2f.appspot.com",
      messagingSenderId: "199688909073",
      appId: "1:199688909073:web:689e8c7e8fa6167170dcb0"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
console.log("✅ Firebase initialized successfully!", app);

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.95_Firebase_B';
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
  const getCurrentUserLocal = () =>
    JSON.parse(localStorage.getItem('currentUser') || 'null');

  // ─── Today helper (local date) ───
  function getToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth()+1).padStart(2,'0');
    const dd   = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

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

  // Remove legacy lastUser stuff since Firebase uses emails

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
    auth.signOut().then(() => {
      localStorage.removeItem('currentUser');
      location.reload();
    });
  };

  loginBtn.onclick = async () => {
    loginMsg.textContent = '';
    const email = userIn.value.trim();
    const password = passIn.value;
    const role = roleSel.value;
    const classCode = classIn.value.trim();

    if (!email || !password || (isSignUp && role==='student' && !classCode)) {
      loginMsg.textContent = 'Complete all fields.';
      return;
    }

    try {
      if (isSignUp) {
        // Create Firebase user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        // Now add to localStorage users & classrooms for your app data
        const users = getUsers();
        if (users[email]) {
          loginMsg.textContent = 'User already exists locally.';
          return;
        }
        users[email] = {
          password: '', // no need to store password locally now
          role,
          progress: {},
          classrooms: role==='teacher'?[]:undefined,
          classroomCode: role==='student'?classCode:undefined
        };
        if (role==='student') {
          const classes = getClasses();
          if (!classes[classCode]) {
            loginMsg.textContent = 'Invalid classroom code.';
            // Also consider deleting Firebase user just created? For simplicity, just alert.
            return;
          }
          classes[classCode].students.push(email);
          saveClasses(classes);
        }
        saveUsers(users);
        localStorage.setItem('currentUser', JSON.stringify({username: email, role}));
        enterDash(email, role);
      } else {
        // Sign In user
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const users = getUsers();
        if (!users[email]) {
          loginMsg.textContent = 'No user data found for this email.';
          return;
        }
        if (users[email].role !== role) {
          loginMsg.textContent = `Role mismatch for user (${users[email].role} vs selected ${role}).`;
          return;
        }
        localStorage.setItem('currentUser', JSON.stringify({username: email, role}));
        enterDash(email, role);
      }
    } catch (error) {
      loginMsg.textContent = error.message || 'Authentication failed.';
    }
  };

  // Check Firebase auth state on load, auto-login if session exists
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in.
      const users = getUsers();
      if (users[user.email]) {
        const role = users[user.email].role;
        localStorage.setItem('currentUser', JSON.stringify({username: user.email, role}));
        enterDash(user.email, role);
      } else {
        // No local data, sign out Firebase and show login screen
        auth.signOut();
      }
    }
  });

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
    if (!di.value) di.value = getToday();
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
        Object.values(classes).forEach(cl=>{
          cl.customDrills[datePart] = drills;
        });
      } else {
        classes[code].customDrills[datePart] = drills;
      }
    });
    saveClasses(classes);
    alert('Bulk drills updated.');
    evt.target.value=''; evt.target.classList.add('hidden');
  }

  // ─── Teacher Dashboard Rendering ───
  function renderTeacher(u) {
    const users = getUsers();
    const classes = getClasses();
    progTable.innerHTML = '';
    const tUser = users[u];
    if (!tUser || !tUser.classrooms) return;
    tUser.classrooms.forEach(code => {
      const cl = classes[code];
      if (!cl) return;
      const div = document.createElement('div');
      div.className = 'classroom-card card';
      div.innerHTML = `
        <h4>${cl.name} (${code})</h4>
        <button id="edit-${code}" class="btn secondary small">Edit Drills</button>
        <button id="bulk-${code}" class="btn secondary small">Bulk Upload</button>
        <input type="file" id="bulk-file-${code}" class="hidden" accept=".txt" />
        <input type="date" id="date-${code}" />
        <textarea id="ta-${code}" rows="5" class="hidden"></textarea>
        <label><input type="checkbox" id="all-${code}" /> Apply to All Classes</label>
        <button id="save-${code}" class="btn primary small hidden">Save</button>
        <div class="student-list">
          <h5>Students</h5>
          <ul id="students-${code}"></ul>
        </div>
      `;
      progTable.appendChild(div);

      document.getElementById(`edit-${code}`).onclick = () => openEditor(u, code);
      document.getElementById(`bulk-${code}`).onclick = () => openBulk(u, code);
      document.getElementById(`bulk-file-${code}`).onchange = (e) => handleBulkUpload(e, code);
      document.getElementById(`save-${code}`).onclick = () => saveDrills(u, code);

      // Fill students
      const studentList = document.getElementById(`students-${code}`);
      studentList.innerHTML = '';
      cl.students.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        studentList.appendChild(li);
      });
    });
  }
  function saveDrills(u, code) {
    const dateInput = document.getElementById(`date-${code}`);
    const textArea  = document.getElementById(`ta-${code}`);
    const allCheck  = document.getElementById(`all-${code}`);
    if (!dateInput.value) {
      alert('Pick a date.');
      return;
    }
    const drills = textArea.value.split('\n').map(s=>s.trim()).filter(Boolean);
    if (!drills.length) {
      alert('Enter drills.');
      return;
    }
    const classes = getClasses();
    if (allCheck.checked) {
      Object.values(classes).forEach(cl=>{
        cl.customDrills[dateInput.value] = drills;
      });
    } else {
      classes[code].customDrills[dateInput.value] = drills;
    }
    saveClasses(classes);
    alert('Drills saved.');
  }


  // ─── Student Dashboard ───
  const promptEl = document.getElementById('prompt');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn = document.getElementById('next-btn');
  const calendarEl = document.getElementById('calendar');
  const statsEl = document.getElementById('student-stats');

  let currentDrills = [];
  let currentIndex = 0;
  let currentUser = null;

  function renderStudent(classCode, user) {
    currentUser = user;
    renderCalendar();
    loadDrillsForDate(getToday());
  }

  function loadDrillsForDate(date) {
    const classes = getClasses();
    if (!classes) return;
    const cl = classes[currentUser && getUsers()[currentUser].classroomCode];
    if (!cl) return;
    currentDrills = cl.customDrills[date] || cl.drills;
    currentIndex = 0;
    renderPrompt();
    updateNextBtn();
  }

  function renderPrompt() {
    if (!currentDrills.length) {
      promptEl.textContent = "No drills for today.";
      nextBtn.disabled = true;
      return;
    }
    promptEl.textContent = currentDrills[currentIndex];
    feedbackEl.textContent = '';
    nextBtn.disabled = false;
  }

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex >= currentDrills.length) {
      currentIndex = 0;
    }
    renderPrompt();
  };

  function updateNextBtn() {
    nextBtn.disabled = currentDrills.length === 0;
  }

  // ─── Calendar Rendering ───
  function renderCalendar() {
    calendarEl.innerHTML = '';
    const d = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startDay = d.getDay();

    const table = document.createElement('table');
    table.className = 'calendar-table';

    // Header
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      headerRow.appendChild(th);
    });
    header.appendChild(headerRow);
    table.appendChild(header);

    const body = document.createElement('tbody');
    let row = document.createElement('tr');
    let dayCount = 1;

    for(let i=0; i<42; i++) {
      if(i < startDay || dayCount > daysInMonth) {
        const td = document.createElement('td');
        td.textContent = '';
        row.appendChild(td);
      } else {
        const td = document.createElement('td');
        td.textContent = dayCount;
        td.tabIndex = 0;
        td.onclick = () => loadDrillsForDate(formatDate(calYear, calMonth, dayCount));
        row.appendChild(td);
        dayCount++;
      }
      if ((i+1)%7 === 0) {
        body.appendChild(row);
        row = document.createElement('tr');
      }
    }
    table.appendChild(body);
    calendarEl.appendChild(table);
  }

  function formatDate(year, month, day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
}




