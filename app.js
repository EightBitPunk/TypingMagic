// Version 0.0.7
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.0.7 loaded");

  // version badge
  const badge = document.createElement("div");
  badge.textContent = "version 0.0.7";
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "5px",
    right: "10px",
    fontSize: "0.8em",
    color: "gray",
    pointerEvents: "none"
  });
  document.body.appendChild(badge);

  initApp();
});

function initApp() {
  // Default drill set
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // Get elements
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

  const teacherDash = document.getElementById("teacher-dashboard");
  const createBtn = document.getElementById("create-classroom-btn");
  const newClassIn = document.getElementById("new-classroom-name");
  const codeDisplay = document.getElementById("classroom-code-display");
  const progressTbl = document.getElementById("student-progress-table");
  const teacherNameEl = document.getElementById("teacher-name");

  const studentDash = document.getElementById("student-dashboard");
  const studentNameEl = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  let isSignUp = false;

  // Toggle UI mode
  function updateModeUI() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.addEventListener("click", () => { isSignUp = !isSignUp; updateModeUI(); });
  roleSel.addEventListener("change", updateModeUI);
  updateModeUI();

  // Storage helpers
  const getUsers = () => JSON.parse(localStorage.getItem("users") || "{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms") || "{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  // Login/Sign-up handler
  loginBtn.onclick = () => {
    msg.textContent = "";
    const name = userIn.value.trim();
    const pw = passIn.value;
    const role = roleSel.value;
    const clsCode = codeIn.value.trim();
    if (!name || !pw || (isSignUp && role === "student" && !clsCode)) {
      msg.textContent = "Please fill all required fields.";
      return;
    }
    const users = getUsers();
    if (isSignUp) {
      if (users[name]) { msg.textContent = "User already exists."; return; }
      users[name] = { password: pw, role, progress: {}, classrooms: [], classroomCode: role === 'student' ? clsCode : undefined };
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
    const users = getUsers();
    if (role === 'teacher') {
      teacherNameEl.textContent = name;
      teacherDash.classList.remove("hidden");
      renderTeacher(name);
    } else {
      studentNameEl.textContent = name;
      studentDash.classList.remove("hidden");
      renderStudent(users[name].classroomCode, name);
    }
  }

  // Create classroom
  createBtn.onclick = () => {
    const cname = newClassIn.value.trim();
    if (!cname) return;
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

  // Render teacher dashboard
  function renderTeacher(teacher) {
    const classes = getClasses();
    const users = getUsers();
    let html = "";
    (users[teacher].classrooms || []).forEach(code => {
      const cls = classes[code];
      if (!cls) return;
      html += `<h3>${cls.name} (Code: ${code}) <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Drills</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s => {
        const prog = users[s].progress || {};
        Object.entries(prog).forEach(([d, arr]) => {
          const total = arr.length;
          const acc = Math.round(arr.reduce((a, x) => a + x.accuracy, 0) / total);
          const err = arr.reduce((a, x) => a + x.errors, 0);
          html += `<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${acc}%</td><td>${err}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    progressTbl.innerHTML = html;
    document.querySelectorAll('.del').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        if (!confirm('Delete class?')) return;
        const classes = getClasses(); delete classes[code]; saveClasses(classes);
        const users = getUsers(); users[teacher].classrooms = users[teacher].classrooms.filter(c => c !== code); saveUsers(users);
        renderTeacher(teacher);
      };
    });
  }

  // Render student drills
  function renderStudent(code, student) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = (classes[code]?.customDrills?.[today]) || classes[code]?.drills || defaultDrills;
    let idx = 0, pos = 0;

    function loadDrill() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        promptEl.appendChild(span);
      });
      pos = 0;
      markCurrent();
      nextBtn.disabled = true;
      feedbackEl.textContent = '';
    }

    function markCurrent() {
      document.querySelectorAll('.char').forEach(c => c.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }

    document.onkeydown = e => {
      if (studentDash.classList.contains('hidden')) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (pos > 0) {
          pos--;
          document.querySelectorAll('.char')[pos].classList.remove('correct', 'error');
          markCurrent();
          nextBtn.disabled = true;
        }
        return;
      }
      if (e.key.length !== 1 || pos >= drills[idx].length) {
        e.preventDefault();
        return;
      }
      const spans = document.querySelectorAll('.char');
      spans[pos].classList.remove('current');
      if (e.key === drills[idx][pos]) spans[pos].classList.add('correct');
      else {
        spans[pos].classList.add('error');
        feedbackEl.textContent = `Expected "${drills[idx][pos]}", got "${e.key}"`;
      }
      pos++;
      markCurrent();
      if (pos >= spans.length) nextBtn.disabled = false;
    };

    nextBtn.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const correctCount = [...spans].filter(s => s.classList.contains('correct')).length;
      const errorCount = [...spans].filter(s => s.classList.contains('error')).length;
      const accuracy = Math.round((correctCount / spans.length) * 100);
      const users = getUsers();
      users[student].progress[today] = users[student].progress[today] || [];
      users[student].progress[today].push({ drill: idx, correct: correctCount, errors: errorCount, accuracy });
      saveUsers(users);
      if (idx + 1 < drills.length) { idx++; loadDrill(); }
      else { promptEl.textContent = "Done for today!"; nextBtn.style.display = 'none'; }
    };

    loadDrill();
  }
}
