// Version 0.0.9
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.0.9 loaded");
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.0.9";
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "5px",
    right: "10px",
    fontSize: "0.8em",
    color: "gray",
    pointerEvents: "none"
  });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // Element refs
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "toggle-mode-btn";
    loginScreen.appendChild(toggleBtn);
  }
  const userIn = document.getElementById("username");
  const passIn = document.getElementById("password");
  const roleSel = document.getElementById("role");
  const msg = document.getElementById("login-message");
  const codeIn = document.getElementById("classroom-code");
  const studentCodeWrap = document.getElementById("student-classroom-code");

  const teacherDashboard = document.getElementById("teacher-dashboard");
  const classroomSetup = document.getElementById("classroom-setup");
  const teacherClassroomView = document.getElementById("teacher-classroom-view");
  const createClassBtn = document.getElementById("create-classroom-btn");
  const newClassIn = document.getElementById("new-classroom-name");
  const codeDisplay = document.getElementById("classroom-code-display");
  const studentProgressTable = document.getElementById("student-progress-table");
  const teacherNameEl = document.getElementById("teacher-name");

  const studentDashboard = document.getElementById("student-dashboard");
  const studentNameEl = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  let isSignUp = false;

  // Toggle Log In/Sign Up
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // Storage helpers
  const getUsers = () => JSON.parse(localStorage.getItem("users") || "{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms") || "{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  // Login/Sign Up handler
  loginBtn.onclick = () => {
    msg.textContent = "";
    const name = userIn.value.trim();
    const pw = passIn.value;
    const role = roleSel.value;
    const clsCode = codeIn.value.trim();
    if (!name || !pw || (isSignUp && role === "student" && !clsCode)) {
      msg.textContent = "Please complete all fields."; return;
    }
    const users = getUsers();
    if (isSignUp) {
      if (users[name]) { msg.textContent = "User exists."; return; }
      users[name] = { password: pw, role, progress: {}, classrooms: role === 'teacher' ? [] : undefined, classroomCode: role === 'student' ? clsCode : undefined };
      if (role === 'student') {
        const classes = getClasses();
        if (!classes[clsCode]) { msg.textContent = "Invalid class code."; delete users[name]; return; }
        classes[clsCode].students.push(name);
        saveClasses(classes);
      }
      saveUsers(users);
      enterDashboard(name, role);
    } else {
      if (users[name] && users[name].password === pw && users[name].role === role) {
        enterDashboard(name, role);
      } else {
        msg.textContent = "Incorrect credentials.";
      }
    }
  };

  function enterDashboard(name, role) {
    loginScreen.classList.add("hidden");
    if (role === 'teacher') {
      teacherNameEl.textContent = name;
      teacherDashboard.classList.remove("hidden");
      classroomSetup.classList.remove("hidden");
      teacherClassroomView.classList.remove("hidden");
      renderTeacher(name);
    } else {
      studentNameEl.textContent = name;
      studentDashboard.classList.remove("hidden");
      renderStudent(getUsers()[name].classroomCode, name);
    }
  }

  // Create Classroom
  createClassBtn.onclick = () => {
    const cname = newClassIn.value.trim(); if (!cname) return;
    const code = 'C' + Math.floor(100000 + Math.random() * 900000);
    const classes = getClasses();
    classes[code] = { name: cname, teacher: teacherNameEl.textContent, students: [], drills: defaultDrills.slice(), customDrills: {} };
    saveClasses(classes);
    const users = getUsers();
    users[teacherNameEl.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`;
    renderTeacher(teacherNameEl.textContent);
  };

  // Render Teacher Dashboard
  function renderTeacher(teacher) {
    const classes = getClasses(); const users = getUsers();
    let html = '';
    (users[teacher].classrooms || []).forEach(code => {
      const cls = classes[code]; if (!cls) return;
      html += `<h3>${cls.name} (Code: ${code}) <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Drills</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s => {
        const prog = users[s].progress || {};
        Object.entries(prog).forEach(([d, arr]) => {
          const total = arr.length;
          const errCount = arr.reduce((a, x) => a + x.errors, 0);
          const acc = Math.round(((total) - errCount) / total * 100);
          html += `<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${acc}%</td><td>${errCount}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    studentProgressTable.innerHTML = html;
    document.querySelectorAll('.del').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        if (!confirm('Delete class?')) return;
        const all = getClasses(); delete all[code]; saveClasses(all);
        const users = getUsers();
        users[teacher].classrooms = users[teacher].classrooms.filter(c => c !== code);
        saveUsers(users);
        renderTeacher(teacher);
      };
    });
  }

  // Render Student Drills
  function renderStudent(code, student) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = (classes[code]?.customDrills?.[today]) || classes[code]?.drills || defaultDrills;
    let idx = 0, pos = 0;
    // create accuracy display
    let accuracyEl = document.getElementById('accuracy-display');
    if (!accuracyEl) {
      accuracyEl = document.createElement('div');
      accuracyEl.id = 'accuracy-display';
      accuracyEl.style.marginTop = '0.5em';
      studentDashboard.querySelector('#feedback').insertAdjacentElement('afterend', accuracyEl);
    }
    function updateAccuracy() {
      const spans = document.querySelectorAll('.char');
      const errors = [...spans].filter(s => s.classList.contains('error')).length;
      const total = spans.length;
      const acc = Math.round(((total - errors) / total) * 100);
      accuracyEl.textContent = `Accuracy: ${acc}%`;
    }
    function loadDrill() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => {
        const span = document.createElement('span'); span.className = 'char'; span.textContent = ch;
        promptEl.appendChild(span);
      });
      pos = 0; markCurrent(); feedbackEl.textContent = '';
      nextBtn.disabled = true; accuracyEl.textContent = 'Accuracy: 100%';
    }
    function markCurrent() {
      document.querySelectorAll('.char').forEach(c => c.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }
    document.onkeydown = e => {
      if (studentDashboard.classList.contains('hidden')) return;
      if (e.key === 'Backspace') {
        e.preventDefault(); if (pos > 0) {
          pos--; const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('correct','error'); markCurrent();
          updateAccuracy(); nextBtn.disabled = true;
        } return;
      }
      if (e.key.length !== 1 || pos >= drills[idx].length) { e.preventDefault(); return; }
      const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if (e.key === drills[idx][pos]) {
        spans[pos].classList.add('correct'); feedbackEl.textContent = '';
      } else {
        spans[pos].classList.add('error'); feedbackEl.textContent = `Expected \"${drills[idx][pos]}\", got \"${e.key}\"`;
      }
      pos++; markCurrent(); updateAccuracy(); if (pos >= spans.length) nextBtn.disabled = false;
    };
    nextBtn.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const corr = [...spans].filter(s => s.classList.contains('correct')).length;
      const err = [...spans].filter(s => s.classList.contains('error')).length;
      const acc = Math.round((corr / spans.length) * 100);
      const users = getUsers(); users[student].progress[today] = users[student].progress[today] || [];
      users[student].progress[today].push({drill: idx, correct: corr, errors: err, accuracy: acc});
      saveUsers(users);
      if (idx + 1 < drills.length) { idx++; loadDrill(); } else { promptEl.textContent = 'Done for today!'; nextBtn.style.display = 'none'; }
    };
    loadDrill();
  }
}
