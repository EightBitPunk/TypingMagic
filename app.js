// Version 0.1.16

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.16";
  Object.assign(badge.style, {
    position: "fixed", bottom: "5px", right: "10px",
    fontSize: "0.8em", color: "gray",
    background: "rgba(255,255,255,0.8)", padding: "2px 5px",
    borderRadius: "3px", pointerEvents: "none"
  });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // Element references
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn"; loginScreen.appendChild(toggleBtn);
  }
  const usernameIn = document.getElementById("username");
  const passwordIn = document.getElementById("password");
  const roleSel = document.getElementById("role");
  const loginMsg = document.getElementById("login-message");
  const classCodeIn = document.getElementById("classroom-code");
  const studentCodeWrap = document.getElementById("student-classroom-code");

  const teacherDashboard = document.getElementById("teacher-dashboard");
  const classroomSetup = document.getElementById("classroom-setup");
  const teacherClassroomView = document.getElementById("teacher-classroom-view");
  const createClassBtn = document.getElementById("create-classroom-btn");
  const newClassIn = document.getElementById("new-classroom-name");
  const classCodeDisplay = document.getElementById("classroom-code-display");
  const teacherName = document.getElementById("teacher-name");
  const studentProgressTable = document.getElementById("student-progress-table");

  const studentDashboard = document.getElementById("student-dashboard");
  const studentName = document.getElementById("student-name");
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

  function getUsers() { return JSON.parse(localStorage.getItem("users") || "{}"); }
  function saveUsers(u) { localStorage.setItem("users", JSON.stringify(u)); }
  function getClasses() { return JSON.parse(localStorage.getItem("classrooms") || "{}"); }
  function saveClasses(c) { localStorage.setItem("classrooms", JSON.stringify(c)); }

  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const u = usernameIn.value.trim(); const p = passwordIn.value;
    const role = roleSel.value; const code = classCodeIn.value.trim();
    if (u === 'KEFKA' && p === 'SUCKS') { enterAdmin(); return; }
    if (!u || !p || (isSignUp && role==='student' && !code)) { loginMsg.textContent='Fill required fields.'; return; }
    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent='User exists.'; return; }
      users[u] = { password:p, role, progress:{}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?code:undefined };
      if (role==='student') {
        const classes = getClasses(); classes[code].students.push(u); saveClasses(classes);
      }
      saveUsers(users); enterDashboard(u, role);
    } else {
      if (users[u] && users[u].password===p && users[u].role===role) enterDashboard(u, role);
      else loginMsg.textContent='Incorrect credentials.';
    }
  };

  function enterDashboard(user, role) {
    loginScreen.classList.add('hidden');
    if (role==='teacher') {
      teacherName.textContent = user;
      teacherDashboard.classList.remove('hidden'); classroomSetup.classList.remove('hidden'); teacherClassroomView.classList.remove('hidden');
      renderTeacher(user);
    } else {
      studentName.textContent = user;
      studentDashboard.classList.remove('hidden'); renderStudent(getUsers()[user].classroomCode, user);
    }
  }

  createClassBtn.onclick = () => {
    const name = newClassIn.value.trim(); if (!name) return;
    const code = 'C'+Math.floor(100000+Math.random()*900000);
    const classes = getClasses();
    classes[code] = { name, teacher:teacherName.textContent, students:[], drills:defaultDrills.slice(), customDrills:{} };
    saveClasses(classes);
    const users = getUsers(); users[teacherName.textContent].classrooms.push(code); saveUsers(users);
    classCodeDisplay.textContent = `New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  function renderTeacher(teacher) {
    const users = getUsers(), classes = getClasses();
    let html = '';
    users[teacher].classrooms.forEach(code => {
      const cls = classes[code]; if (!cls) return;
      html += `<h3>${cls.name} (Code:${code}) ` +
              `<button class='custom-btn' data-code='${code}'>Customize Drills</button> ` +
              `<span class='del-class' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      // Inline editor
      html += `<div id='editor-${code}' style='display:none;border:1px solid #ccc;padding:8px;margin-bottom:8px;'>` +
              `<label>Date: <input type='date' id='date-${code}' /></label><br>` +
              `<textarea id='textarea-${code}' rows='4' style='width:100%'></textarea><br>` +
              `<label><input type='checkbox' id='all-${code}' /> Apply to all</label><br>` +
              `<button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button>` +
              `</div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s => {
        const prog = users[s].progress||{};
        Object.entries(prog).forEach(([d,arr]) => {
          const avg = arr.length?Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/arr.length):0;
          const err = arr.reduce((a,x)=>a+x.errors,0);
          html += `<tr><td>${s} <span class='del-student' data-code='${code}' data-student='${s}' style='color:red;cursor:pointer;'>🗑️</span></td>` +
                  `<td>${d} <span class='del-date' data-code='${code}' data-date='${d}' style='color:red;cursor:pointer;'>🗑️</span></td>` +
                  `<td>${avg}%</td><td>${err}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    studentProgressTable.innerHTML = html;

    // Handlers
    users[teacher].classrooms.forEach(code => {
      // customize
      document.querySelector(`.custom-btn[data-code='${code}']`).onclick = () => {
        const cls = getClasses()[code];
        const editor = document.getElementById(`editor-${code}`);
        const dateInp = document.getElementById(`date-${code}`);
        const ta = document.getElementById(`textarea-${code}`);
        dateInp.value = new Date().toISOString().split('T')[0];
        const existing = cls.customDrills[dateInp.value]||cls.drills;
        ta.value = existing.join("\n");
        editor.style.display = 'block';
        document.getElementById(`cancel-${code}`).onclick = () => editor.style.display='none';
        document.getElementById(`save-${code}`).onclick = () => {
          const d = dateInp.value;
          const lines = ta.value.split("\n").map(l=>l.trim()).filter(Boolean);
          const all = document.getElementById(`all-${code}`).checked;
          const classesLocal = getClasses();
          if(all) users[teacher].classrooms.forEach(cid => { classesLocal[cid].customDrills[cid] = classesLocal[cid].customDrills[cid]||{}; classesLocal[cid].customDrills[d]=lines; });
          else { classesLocal[code].customDrills = classesLocal[code].customDrills||{}; classesLocal[code].customDrills[d]=lines; }
          saveClasses(classesLocal);
          renderTeacher(teacher);
        };
      };
      // delete class
      document.querySelector(`.del-class[data-code='${code}']`).onclick = () => {
        if(confirm('Delete class?')){ const cls=getClasses(); delete cls[code]; saveClasses(cls); const u=getUsers(); u[teacher].classrooms=u[teacher].classrooms.filter(c=>c!==code); saveUsers(u); renderTeacher(teacher);}      };
      // delete student
      document.querySelectorAll(`.del-student[data-code='${code}']`).forEach(btn=>btn.onclick=()=>{
        const s=btn.dataset.student; if(confirm(`Remove ${s}?`)){ const cls=getClasses(); cls[code].students=cls[code].students.filter(x=>x!==s); saveClasses(cls); renderTeacher(teacher);}      });
      // delete date
      document.querySelectorAll(`.del-date[data-code='${code}']`).forEach(btn=>btn.onclick=()=>{
        const d=btn.dataset.date;
        if(confirm(`Remove all lessons on ${d}?`)){
          const u=getUsers(), cls=getClasses();
          cls[code].students.forEach(s=>{ if(u[s]&&u[s].progress) delete u[s].progress[d]; });
          saveUsers(u);
          renderTeacher(teacher);
        }
      });
    });
  }

  function renderStudent(code, student) {
    // unchanged student logic
  }

  function enterAdmin() {}
  function renderAdmin() {}
}
