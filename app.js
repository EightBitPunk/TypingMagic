// Version 0.1.10 - reverted to 0.1.6 baseline and prepping Edit Drills fixes

window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.1.10 loaded");
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.10";
  Object.assign(badge.style, { position: "fixed", bottom: "5px", right: "10px", fontSize: "0.8em", color: "gray", pointerEvents: "none" });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // DOM refs
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

  const getUsers = () => JSON.parse(localStorage.getItem("users") || "{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms") || "{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  loginBtn.onclick = () => {
    msg.textContent = "";
    const name = userIn.value.trim(), pw = passIn.value, role = roleSel.value, clsCode = codeIn.value.trim();
    if (name === 'KEFKA' && pw === 'SUCKS') { enterAdmin(); return; }
    if (!name || !pw || (isSignUp && role === 'student' && !clsCode)) { msg.textContent = 'Complete all fields.'; return; }
    const users = getUsers();
    if (isSignUp) {
      if (users[name]) { msg.textContent = 'User exists.'; return; }
      users[name] = { password: pw, role, progress: {}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?clsCode:undefined };
      if (role==='student') { const classes = getClasses(); classes[clsCode].students.push(name); saveClasses(classes); }
      saveUsers(users); enterDashboard(name, role); return;
    }
    if (users[name] && users[name].password === pw && users[name].role === role) enterDashboard(name, role);
    else msg.textContent = 'Incorrect credentials.';
  };

  function enterDashboard(name, role) {
    loginScreen.classList.add('hidden');
    if (role==='teacher'){
      teacherNameEl.textContent = name;
      teacherDashboard.classList.remove('hidden'); classroomSetup.classList.remove('hidden'); teacherClassroomView.classList.remove('hidden');
      renderTeacher(name);
    } else {
      studentNameEl.textContent = name; studentDashboard.classList.remove('hidden'); renderStudent(getUsers()[name].classroomCode, name);
    }
  }

  createClassBtn.onclick = () => {
    const cname = newClassIn.value.trim(); if(!cname)return;
    const code = 'C'+Math.floor(100000+Math.random()*900000);
    const classes = getClasses(); classes[code] = { name:cname, teacher:teacherNameEl.textContent, students:[], drills:defaultDrills.slice(), customDrills:{} };
    saveClasses(classes);
    const users = getUsers(); users[teacherNameEl.textContent].classrooms.push(code); saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`; renderTeacher(teacherNameEl.textContent);
  };

  function renderTeacher(teacher) {
    const users = getUsers(), classes = getClasses(); let html='';
    (users[teacher].classrooms||[]).forEach(code=>{
      const cls = classes[code]; if(!cls) return;
      html += `<h3>${cls.name} (Code: ${code}) <button data-date='${code}'>Edit by Date</button> <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<div id='editor-${code}' style='display:none; margin-bottom:1em; background:#f9f9f9; padding:1em; border:1px solid #ccc;'>
        <label>Select Date: <select id='date-select-${code}'></select></label><br>
        <textarea id='drill-text-${code}' rows='4' style='width:100%;'></textarea><br>
        <label><input type='checkbox' id='apply-all-${code}'> Apply to all classes</label><br>
        <button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button>
      </div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>#Drills</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s=>{
        const prog = users[s].progress||{};
        Object.entries(prog).forEach(([d,arr])=>{
          const total = arr.length;
          const avg = Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/total);
          const err = arr.reduce((a,x)=>a+x.errors,0);
          html += `<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${avg}%</td><td>${err}</td></tr>`;
        });
      }); html+='</table>';
    });
    studentProgressTable.innerHTML = html;

    // Edit by date
    users[teacher].classrooms.forEach(code => {
      const btn = document.querySelector(`[data-date='${code}']`);
      const editor = document.getElementById(`editor-${code}`);
      const dateSelect = document.getElementById(`date-select-${code}`);
      const textArea = document.getElementById(`drill-text-${code}`);
      const saveBtn = document.getElementById(`save-${code}`);
      const cancelBtn = document.getElementById(`cancel-${code}`);
      btn.onclick = () => {
        editor.style.display = 'block';
        // populate dates (last 7 days)
        dateSelect.innerHTML = '';
        for (let i=0; i<7; i++) {
          const dt = new Date(); dt.setDate(dt.getDate()-i);
          const ds = dt.toISOString().split('T')[0];
          const opt = document.createElement('option'); opt.value=ds; opt.textContent=ds;
          dateSelect.appendChild(opt);
        }
        const sel = dateSelect.value;
        const existing = classes[code].customDrills[sel] || classes[code].drills;
        textArea.value = existing.join('\n');
      };
      cancelBtn.onclick = () => { editor.style.display = 'none'; };
      saveBtn.onclick = () => {
        const sel = dateSelect.value;
        const lines = textArea.value.split('\n').map(l=>l.trim()).filter(Boolean);
        const applyAll = document.getElementById(`apply-all-${code}`).checked;
        const classesLocal = getClasses();
        if (applyAll) {
          users[teacher].classrooms.forEach(cid => {
            classesLocal[cid].customDrills = classesLocal[cid].customDrills || {};
            classesLocal[cid].customDrills[sel] = lines;
          });
        } else {
          classesLocal[code].customDrills = classesLocal[code].customDrills || {};
          classesLocal[code].customDrills[sel] = lines;
        }
        saveClasses(classesLocal);
        editor.style.display = 'none';
      };
    });

    // Delete
    document.querySelectorAll('.del').forEach(btn=>btn.onclick=()=>{
      const code = btn.dataset.code; if(!confirm('Delete class?')) return;
      const classesLocal = getClasses(); delete classesLocal[code]; saveClasses(classesLocal);
      const users = getUsers(); users[teacher].classrooms = users[teacher].classrooms.filter(c=>c!==code); saveUsers(users);
      renderTeacher(teacher);
    });
  }

  function renderStudent(code, student) {
    // unchanged from 0.1.6
  }

  function enterAdmin() { /* unchanged */ }
  function renderAdmin() { /* unchanged */ }
}
