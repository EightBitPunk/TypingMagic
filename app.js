// Version 0.1.95D

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Firebase config (already tested and working)
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
console.log("✅ Firebase initialized successfully!");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");
const classroomCodeInput = document.getElementById("classroom-code");
const loginBtn = document.getElementById("login-btn");
const toggleModeBtn = document.getElementById("toggle-mode-btn");
const loginMessage = document.getElementById("login-message");
const studentClassroomDiv = document.getElementById("student-classroom-code");

let signUpMode = false;

// Toggle between sign-up and login
toggleModeBtn.onclick = () => {
  signUpMode = !signUpMode;
  toggleModeBtn.textContent = signUpMode ? "Back to Login" : "Sign Up";
  loginBtn.textContent = signUpMode ? "Create Account" : "Log In";
  loginMessage.textContent = "";
};

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.95_Firebase_D';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

// Show classroom code input if role is student
roleSelect.onchange = () => {
  studentClassroomDiv.classList.toggle("hidden", roleSelect.value !== "student");
};

loginBtn.onclick = async () => {
  const email = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;
  const classroomCode = classroomCodeInput.value.trim();

  loginMessage.textContent = "";

  if (!email || !password) {
    loginMessage.textContent = "Please enter name and password.";
    return;
  }

  try {
    let userCredential;
    if (signUpMode) {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;
    console.log("🔐 Firebase Auth success:", user);

    // Store name and role locally (Firebase doesn't store custom roles unless using Firestore)
    const name = email.split("@")[0]; // temporary display name
    if (role === "teacher") {
      document.getElementById("teacher-name").textContent = name;
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("teacher-dashboard").classList.remove("hidden");
    } else if (role === "student") {
      document.getElementById("student-name").textContent = name;
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("student-dashboard").classList.remove("hidden");
    }

    document.getElementById("logout-btn").style.display = "block";
  } catch (error) {
    console.error("❌ Auth error:", error);
    loginMessage.textContent = error.message.replace("Firebase: ", "");
  }
};

// Log out
document.getElementById("logout-btn").onclick = async () => {
  await signOut(auth);
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("teacher-dashboard").classList.add("hidden");
  document.getElementById("student-dashboard").classList.add("hidden");
  document.getElementById("logout-btn").style.display = "none";
};

// Everything below this point is your original logic — unchanged!


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






