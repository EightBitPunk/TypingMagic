// Version 0.2.01

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
console.log("✅ Firebase initialized successfully!");

// 🔧 Handle localStorage user setup
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
        loginMessage.textContent = "Classroom code not found.";
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
  badge.textContent = 'version 0.2.01';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

// ─── Kick things off ────────────────────
window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function initApp() {
  // ─── Grab all the buttons & inputs ───
  const usernameInput        = document.getElementById("username");
  const passwordInput        = document.getElementById("password");
  const roleSelect           = document.getElementById("role");
  const classroomCodeInput   = document.getElementById("classroom-code");
  const loginBtn             = document.getElementById("login-btn");
  const toggleModeBtn        = document.getElementById("toggle-mode-btn");
  const loginMessage         = document.getElementById("login-message");
  const studentClassroomDiv  = document.getElementById("student-classroom-code");
  const logoutBtn            = document.getElementById("logout-btn");
  const createBtn            = document.getElementById("create-classroom-btn");
  const newClassInput        = document.getElementById("new-classroom-name");
  const classCodeDisplay     = document.getElementById("classroom-code-display");
  const progTable            = document.getElementById("student-progress-table");
  studentClassroomDiv.classList.add("hidden");

  // ─── Drill/calendar helpers ───────────
  function getToday() {
    const d  = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth()+1).padStart(2,'0');
    const dd   = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const getUsers    = () => JSON.parse(localStorage.getItem('users')    || '{}');
  const saveUsers   = u  => localStorage.setItem('users', JSON.stringify(u));
  const getClasses  = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const saveClasses = c  => localStorage.setItem('classrooms', JSON.stringify(c));
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  // ─── Sign-up vs Log-in toggle ─────────
  let signUpMode = false;
  toggleModeBtn.onclick = () => {
    signUpMode = !signUpMode;
    toggleModeBtn.textContent = signUpMode ? "Back to Login" : "Sign Up";
    loginBtn.textContent      = signUpMode ? "Create Account" : "Log In";
    studentClassroomDiv.classList.toggle("hidden", roleSelect.value !== "student" || !signUpMode);
    loginMessage.textContent  = "";
    studentClassroomDiv.classList.toggle("hidden", roleSelect.value !== "student");
  };
  roleSelect.onchange = () => {
    studentClassroomDiv.classList.toggle("hidden", roleSelect.value !== "student");
  };

  // ─── Log-in / Sign-up handler ─────────
  loginBtn.onclick = async () => {
    const email    = usernameInput.value.trim();
    const password = passwordInput.value;
    const role     = roleSelect.value;
    const code     = classroomCodeInput.value.trim();

    loginMessage.textContent = "";
    if (!email || !password || (signUpMode && role==='student' && !code)) {
      loginMessage.textContent = "Complete all fields.";
      return;
    }

    try {
      let cred;
      if (signUpMode) {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      console.log("🔐 Firebase Auth success:", cred.user);

      // Temporary display name from email prefix
      const name = email.split("@")[0];

if (!setupUserInLocalStorage(email, role, code)) return;

if (email === "magiccaloriecam@gmail.com") {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-dashboard").classList.remove("hidden");
  return;
}
if (role === "teacher") {
  document.getElementById("teacher-name").textContent = email;
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("teacher-dashboard").classList.remove("hidden");
  renderTeacher(email);
} else {
  document.getElementById("student-name").textContent = email;
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("student-dashboard").classList.remove("hidden");
  renderStudent(code, email);
}



      logoutBtn.style.display = "block";
    } catch (err) {
      console.error("❌ Auth error:", err);
      loginMessage.textContent = err.message.replace("Firebase: ", "");
    }
  };

  // ─── Log-out handler ───────────────────
  logoutBtn.onclick = async () => {
    await signOut(auth);
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("teacher-dashboard").classList.add("hidden");
    document.getElementById("student-dashboard").classList.add("hidden");
    logoutBtn.style.display = "none";
  };

  // ─── CREATE CLASSROOM handler (restored!) ───
  createBtn.onclick = () => {
    const name = newClassInput.value.trim();
    if (!name) return alert("Enter a class name.");
    // generate a code
    const newCode = "C" + (100000 + Math.floor(Math.random()*900000));
    // persist
    const classes = getClasses();
    classes[newCode] = {
      name,
      teacher: document.getElementById("teacher-name").textContent,
      students: [],
      drills: [
        'The quick brown fox jumps over the lazy dog.',
        'Typing practice improves both speed and accuracy.',
        'Accuracy over speed.'
      ],
      customDrills: {}
    };
    saveClasses(classes);
    // show it
    classCodeDisplay.textContent = "New Code: " + newCode;
    // refresh the teacher view
    renderTeacher(document.getElementById("teacher-name").textContent);
  };

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













