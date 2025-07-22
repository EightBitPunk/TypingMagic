// Version 0.1.7

window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.1.7 loaded");
  showVersion(); initApp();
});

function showVersion() {
  const badge = document.createElement("div"); badge.textContent = "version 0.1.7";
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
  const userIn = document.getElementById("username"), passIn = document.getElementById("password");
  const roleSel = document.getElementById("role"), msg = document.getElementById("login-message");
  const codeIn = document.getElementById("classroom-code"), studentCodeWrap = document.getElementById("student-classroom-code");

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
  const promptEl = document.getElementById("prompt"), feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode; updateMode();

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
      if (role==='student'){
        const classes = getClasses(); if(!classes[clsCode]){ msg.textContent = 'Invalid code.'; delete users[name]; return; }
        classes[clsCode].students.push(name); saveClasses(classes);
      }
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
    const cname = newClassIn.value.trim(); if(!cname) return;
    const code = 'C'+Math.floor(100000+Math.random()*900000);
    const classes = getClasses();
    classes[code] = { name: cname, teacher: teacherNameEl.textContent, students: [], drills: defaultDrills.slice(), customDrills: {} };
    saveClasses(classes);
    const users = getUsers(); users[teacherNameEl.textContent].classrooms.push(code); saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`; renderTeacher(teacherNameEl.textContent);
  };

  function renderTeacher(teacher) {
    const users = getUsers(), classes = getClasses();
    let html = '';
    (users[teacher].classrooms||[]).forEach(code=>{
      const cls = classes[code]; if(!cls) return;
      html += `<h3>${cls.name} (Code:${code})`+
              ` <button class="edit-btn" data-code="${code}">Edit Drills</button>`+
              ` <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<div id="edit-container-${code}" class="edit-container" style="display:none;margin-bottom:1em;">`+
              `<label>Date: <input type="date" class="edit-date"></label><br>`+
              `<textarea class="edit-text" rows="4" style="width:100%;"></textarea><br>`+
              `<label><input type="checkbox" class="apply-all"> Apply to all</label><br>`+
              `<button class="save-drills" data-code="${code}">Save</button> `+
              `<button class="cancel-edit" data-code="${code}">Cancel</button>`+
              `</div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Avg Acc</th><th>Errors</th></tr>`;
      cls.students.forEach(s=>{
        const prog=users[s].progress||{};
        Object.entries(prog).forEach(([d,arr])=>{
          const avgAcc=arr.length?Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/arr.length):0;
          const totalErr=arr.reduce((a,x)=>a+x.errors,0);
          html+=`<tr><td>${s}</td><td>${d}</td><td>${avgAcc}%</td><td>${totalErr}</td></tr>`;
        });
      });
      html+=`</table>`;
    });
    studentProgressTable.innerHTML = html;

    // Edit btn
    document.querySelectorAll('.edit-btn').forEach(btn=>{
      btn.onclick = () => {
        const code = btn.dataset.code;
        const cls = getClasses()[code];
        const container = document.getElementById(`edit-container-${code}`);
        container.style.display = 'block';
        const dateInput = container.querySelector('.edit-date');
        const textArea = container.querySelector('.edit-text');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        const existing = cls.customDrills?.[today] || cls.drills;
        textArea.value = existing.join('\n');

        container.querySelector('.cancel-edit').onclick = () => { container.style.display = 'none'; };
        container.querySelector('.save-drills').onclick = () => {
          const newDate = dateInput.value;
          const lines = textArea.value.split('\n').map(l=>l.trim()).filter(Boolean);
          const applyAll = container.querySelector('.apply-all').checked;
          const classesLocal = getClasses();
          if (applyAll) {
            users[teacher].classrooms.forEach(cid=>{
              classesLocal[cid].customDrills = classesLocal[cid].customDrills||{};
              classesLocal[cid].customDrills[newDate] = lines;
            });
          } else {
            classesLocal[code].customDrills = classesLocal[code].customDrills||{};
            classesLocal[code].customDrills[newDate] = lines;
          }
          saveClasses(classesLocal);
          renderTeacher(teacher);
        };
      };
    });

    // Delete
    document.querySelectorAll('.del').forEach(btn=>btn.onclick=()=>{
      const code=btn.dataset.code; if(!confirm('Delete class?'))return;
      const classesLocal = getClasses(); delete classesLocal[code]; saveClasses(classesLocal);
      const users = getUsers(); users[teacher].classrooms = users[teacher].classrooms.filter(c=>c!==code); saveUsers(users);
      renderTeacher(teacher);
    });
  }

  function renderStudent(code, student) { /* unchanged */ }
  function enterAdmin() { /* unchanged */ }
  function renderAdmin() { /* unchanged */ }
}
