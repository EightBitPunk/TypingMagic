// Version 0.1.2

window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.1.2 loaded");
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.2";
  Object.assign(badge.style, { position: "fixed", bottom: "5px", right: "10px", fontSize: "0.8em", color: "gray", pointerEvents: "none" });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // Element refs...
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) { toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn"; loginScreen.appendChild(toggleBtn); }
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
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  const getUsers = () => JSON.parse(localStorage.getItem("users")||"{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms")||"{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  loginBtn.onclick = () => {
    msg.textContent = "";
    const name = userIn.value.trim(), pw = passIn.value, role = roleSel.value, clsCode = codeIn.value.trim();
    if (name === 'KEFKA' && pw === 'SUCKS') { enterAdmin(); return; }
    if (!name||!pw||(isSignUp&&role==='student'&&!clsCode)) { msg.textContent = 'Complete all fields.'; return; }
    const users = getUsers();
    if (isSignUp) {
      if (users[name]) { msg.textContent='User exists.'; return; }
      users[name] = { password:pw, role, progress:{}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?clsCode:undefined };
      if (role==='student') {
        const classes = getClasses(); if(!classes[clsCode]){ msg.textContent='Invalid code.'; delete users[name]; return; }
        classes[clsCode].students.push(name); saveClasses(classes);
      }
      saveUsers(users);
      enterDashboard(name, role);
    } else {
      if (users[name] && users[name].password===pw && users[name].role===role) enterDashboard(name, role);
      else msg.textContent='Incorrect credentials.';
    }
  };

  function enterDashboard(name, role) {
    loginScreen.classList.add("hidden");
    if (role==='teacher') {
      teacherNameEl.textContent=name;
      teacherDashboard.classList.remove("hidden"); classroomSetup.classList.remove("hidden"); teacherClassroomView.classList.remove("hidden"); renderTeacher(name);
    } else {
      studentNameEl.textContent=name;
      studentDashboard.classList.remove("hidden"); renderStudent(getUsers()[name].classroomCode, name);
    }
  }

  // ... teacher and student functions unchanged ...

  // Admin Panel
  function enterAdmin() {
    loginScreen.classList.add('hidden');
    const adminDiv = document.createElement('div'); adminDiv.id='admin-dashboard'; adminDiv.style.padding='1em';
    document.body.appendChild(adminDiv);
    renderAdmin();
  }

  function renderAdmin() {
    const adminDiv = document.getElementById('admin-dashboard');
    const users = getUsers(), classes = getClasses();
    adminDiv.innerHTML = `
      <h2>Admin Panel</h2>
      <table border="1" style="width:100%"><thead>
        <tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr>
      </thead><tbody id="admin-body"></tbody></table>
    `;
    const tbody = document.getElementById('admin-body');
    Object.entries(users).forEach(([u, data]) => {
      let info = '';
      if (data.role === 'teacher') {
        info = (data.classrooms || []).join(', ') || 'No classes';
      } else if (data.role === 'student') {
        info = data.classroomCode || 'Unassigned';
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u}</td>
        <td>${data.role}</td>
        <td>${info}</td>
        <td><button data-user="${u}" class="del-user">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.del-user').forEach(btn => btn.onclick = () => {
      const u = btn.dataset.user;
      if (!confirm(`Delete ${u}?`)) return;
      const allUsers = getUsers(), allClasses = getClasses();
      if (allUsers[u].role==='teacher') {
        (allUsers[u].classrooms||[]).forEach(c=>{ delete allClasses[c]; });
        delete allUsers[u];
      } else {
        const cc = allUsers[u].classroomCode;
        if (cc && allClasses[cc]) allClasses[cc].students = allClasses[cc].students.filter(s=>s!==u);
        delete allUsers[u];
      }
      saveUsers(allUsers); saveClasses(allClasses);
      renderAdmin();
    });
  }
}
