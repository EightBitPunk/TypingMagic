// Version 0.2.13

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ─── Firebase init ─────────────────────
const firebaseConfig = { /* your config */ };
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
        // properly reference the login-message element:
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
function showVersion() { /* unchanged */ }

// ─── Kick things off ────────────────────
window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function initApp() {
  // … all your other initApp code …

  // ─── Login / Sign-up handler ──────────
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

      // mirror into localStorage (with corrected helper above)
      if (!setupUserInLocalStorage(email, role, code)) return;

      // store current user
      localStorage.setItem('lastUser', email);
      localStorage.setItem('currentUser', JSON.stringify({ email, role }));

      // ─── Show the right dashboard ────────
      loginScreen.classList.add('hidden');
      logoutBtn.style.display = 'block';

      if (email === 'magiccaloriecam@gmail.com') {
        document.getElementById('admin-dashboard').classList.remove('hidden');

      } else if (role === 'teacher') {
        teacherName.textContent = email;
        teacherDash.classList.remove('hidden');
        classSetup.classList.remove('hidden');   // ← added
        teacherView.classList.remove('hidden');  // ← added
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

  // … the rest of initApp …
}

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


