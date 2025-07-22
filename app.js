// Version 0.0.8
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.0.8 loaded");
  showVersion();
  initApp();
});

function showVersion() {
  const v = document.createElement("div");
  v.textContent = "version 0.0.8";
  Object.assign(v.style, {
    position: "fixed", bottom: "5px", right: "10px",
    fontSize: "0.8em", color: "gray", pointerEvents: "none"
  });
  document.body.appendChild(v);
}

function initApp() {
  // Elements
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

  const teacherNameEl = document.getElementById("teacher-name");
  const studentProgressTable = document.getElementById("student-progress-table");

  const studentDashboard = document.getElementById("student-dashboard");
  const studentNameEl = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  let isSignUp = false;

  // UI Mode
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

  // Login/Sign-up
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

  // Create class
  createClassBtn.onclick = () => {
    const cname = newClassIn.value.trim(); if (!cname) return;
    const code = 'C' + Math.floor(100000 + Math.random() * 900000);
    const classes = getClasses();
    classes[code] = { name: cname, teacher: teacherNameEl.textContent, students: [], drills: [], customDrills: {} };
    saveClasses(classes);
    const users = getUsers();
    users[teacherNameEl.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`;
    renderTeacher(teacherNameEl.textContent);
  };

  // Render teacher
  function renderTeacher(teacher) {
    const classes = getClasses();
    const users = getUsers();
    let html = '';
    (users[teacher].classrooms || []).forEach(code => {
      const cls = classes[code]; if (!cls) return;
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

  // Render student
  function renderStudent(code, student) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = (classes[code]?.customDrills?.[today]) || classes[code]?.drills || [
      "The quick brown fox jumps over the lazy dog.",
      "Typing practice improves both speed and accuracy.",
      "Accuracy over speed."
    ];
    let idx = 0, pos = 0;
    function load() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => {
        const sp = document.createElement('span'); sp.className = 'char'; sp.textContent = ch;
        promptEl.appendChild(sp);
      });
      pos = 0; mark(); nextBtn.disabled = true; feedbackEl.textContent = '';
    }
    function mark() {
      document.querySelectorAll('.char').forEach(c => c.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }
    document.onkeydown = e => {
      if (studentDashboard.classList.contains('hidden')) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (pos > 0) { pos--; document.querySelectorAll('.char')[pos].classList.remove('correct','error'); mark(); nextBtn.disabled=true; }
        return;
      }
      if (e.key.length!==1 || pos>=drills[idx].length) { e.preventDefault(); return; }
      const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if (e.key===drills[idx][pos]) spans[pos].classList.add('correct'); else { spans[pos].classList.add('error'); feedbackEl.textContent = `Expected "${drills[idx][pos]}", got "${e.key}"`; }
      pos++; mark(); if (pos>=spans.length) nextBtn.disabled=false;
    };
    nextBtn.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const corr = [...spans].filter(s=>s.classList.contains('correct')).length;
      const err = [...spans].filter(s=>s.classList.contains('error')).length;
      const acc = Math.round((corr/spans.length)*100);
      const users = getUsers();
      users[student].progress[today] = users[student].progress[today]||[];
      users[student].progress[today].push({drill:idx,correct:corr,errors:err,accuracy:acc});
      saveUsers(users);
      if (idx+1<drills.length) { idx++; load(); } else { promptEl.textContent = "Done for today!"; nextBtn.style.display='none'; }
    };
    load();
  }
}
