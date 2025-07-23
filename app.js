// Version 0.1.20

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.20";
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "5px",
    right: "10px",
    fontSize: "0.8em",
    color: "gray",
    background: "rgba(255,255,255,0.8)",
    padding: "2px 5px",
    borderRadius: "3px",
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

  // Helpers
  const getUsers = () => JSON.parse(localStorage.getItem("users") || "{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms") || "{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  // DOM refs
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn";
    loginScreen.appendChild(toggleBtn);
  }
  const userIn = document.getElementById("username"), passIn = document.getElementById("password");
  const roleSel = document.getElementById("role"), loginMsg = document.getElementById("login-message");
  const classIn = document.getElementById("classroom-code"), studentWrap = document.getElementById("student-classroom-code");

  const teacherDash = document.getElementById("teacher-dashboard");
  const classSetup = document.getElementById("classroom-setup");
  const teacherView = document.getElementById("teacher-classroom-view");
  const createBtn = document.getElementById("create-classroom-btn");
  const newClassIn = document.getElementById("new-classroom-name");
  const codeDisp = document.getElementById("classroom-code-display");
  const teacherName = document.getElementById("teacher-name");
  const progTable = document.getElementById("student-progress-table");

  const studentDash = document.getElementById("student-dashboard");
  const studentName = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  // Sign-up toggle
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // Login/Signup handler
  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const u = userIn.value.trim();
    const p = passIn.value;
    const role = roleSel.value;
    const code = classIn.value.trim();
    if (u === 'KEFKA' && p === 'SUCKS') { enterAdmin(); return; }
    if (!u || !p || (isSignUp && role==='student' && !code)) {
      loginMsg.textContent = 'Complete all fields.'; return;
    }
    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent = 'User exists.'; return; }
      users[u] = { password:p, role, progress:{}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?code:undefined };
      if (role==='student') {
        const classes = getClasses();
        classes[code].students.push(u);
        saveClasses(classes);
      }
      saveUsers(users);
      enterDash(u, role);
    } else {
      if (users[u] && users[u].password===p && users[u].role===role) {
        enterDash(u, role);
      } else {
        loginMsg.textContent = 'Incorrect credentials.';
      }
    }
  };

  function enterDash(u, role) {
    loginScreen.classList.add('hidden');
    if (role==='teacher') {
      teacherName.textContent = u;
      teacherDash.classList.remove('hidden');
      classSetup.classList.remove('hidden');
      teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent = u;
      studentDash.classList.remove('hidden');
      renderStudent(getUsers()[u].classroomCode, u);
    }
  }

  createBtn.onclick = () => {
    const name = newClassIn.value.trim(); if (!name) return;
    const code = 'C' + Math.floor(100000 + Math.random()*900000);
    const classes = getClasses();
    classes[code] = { name, teacher:teacherName.textContent, students:[], drills:defaultDrills.slice(), customDrills:{}, lastEditedDate:null };
    saveClasses(classes);
    const users = getUsers();
    users[teacherName.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisp.textContent = `New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  function renderTeacher(t) {
    const users = getUsers(), classes = getClasses();
    let html = '';
    users[t].classrooms.forEach(code=>{
      const c = classes[code]; if (!c) return;
      html += `<h3>${c.name} (Code: ${code}) `+
              `<button class='custom-btn' data-code='${code}'>Customize Drills</button> `+
              `<span class='del-class' data-code='${code}'>🗑️</span></h3>`;
      html += `<div id='editor-${code}' style='display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;'>`+
              `<label>Date: <input type='date' id='date-${code}' value='${c.lastEditedDate||new Date().toISOString().split("T")[0]}' /></label><br>`+
              `<textarea id='ta-${code}' rows='4' style='width:100%'></textarea><br>`+
              `<label><input type='checkbox' id='all-${code}' /> Apply to all classes</label><br>`+
              `<button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button></div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s=>{
        const prog = users[s].progress||{};
        Object.entries(prog).forEach(([d,arr])=>{
          const avg = arr.length?Math.round(arr.reduce((x,y)=>x+y.accuracy,0)/arr.length):0;
          const err = arr.reduce((x,y)=>x+y.errors,0);
          html += `<tr><td>${s}<span class='del-student' data-code='${code}' data-student='${s}'>🗑️</span></td>`+
                  `<td>${d}<span class='del-date' data-code='${code}' data-date='${d}'>🗑️</span></td>`+
                  `<td>${avg}%</td><td>${err}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    progTable.innerHTML = html;

    users[t].classrooms.forEach(code=>{
      // customize
      const btn = document.querySelector(`.custom-btn[data-code='${code}']`);
      btn.onclick = () => {
        const c = classes[code];
        const ed = document.getElementById(`editor-${code}`);
        const di = document.getElementById(`date-${code}`);
        const ta = document.getElementById(`ta-${code}`);
        // populate drills for selected date
        const dateVal = di.value;
        const arr = c.customDrills[dateVal] || c.drills;
        ta.value = arr.join("\n");
        ed.style.display = 'block';
        document.getElementById(`cancel-${code}`).onclick = () => ed.style.display='none';
        document.getElementById(`save-${code}`).onclick = () => {
          const d = di.value;
          const lines = ta.value.split("\n").map(l=>l.trim()).filter(Boolean);
          const all = document.getElementById(`all-${code}`).checked;
          const clLocal = getClasses();
          if (all) users[t].classrooms.forEach(cid=>{
            clLocal[cid].customDrills = clLocal[cid].customDrills || {};
            clLocal[cid].customDrills[d] = lines;
            clLocal[cid].lastEditedDate = d;
          }); else {
            clLocal[code].customDrills = clLocal[code].customDrills || {};
            clLocal[code].customDrills[d] = lines;
            clLocal[code].lastEditedDate = d;
          }
          saveClasses(clLocal);
          renderTeacher(t);
        };
      };
      // delete class
      document.querySelector(`.del-class[data-code='${code}']`).onclick = () => {
        if (!confirm('Delete class?')) return;
        const clLocal = getClasses(); delete clLocal[code]; saveClasses(clLocal);
        const u = getUsers(); u[t].classrooms = u[t].classrooms.filter(c=>c!==code); saveUsers(u);
        renderTeacher(t);
      };
      // delete student
      document.querySelectorAll(`.del-student[data-code='${code}']`).forEach(b=>b.onclick=()=>{
        const s = b.dataset.student;
        if (!confirm(`Remove ${s}?`)) return;
        const clLocal = getClasses(); clLocal[code].students = clLocal[code].students.filter(x=>x!==s); saveClasses(clLocal);
        renderTeacher(t);
      }));
      // delete date
      document.querySelectorAll(`.del-date[data-code='${code}']`).forEach(b=>b.onclick=()=>{
        const d = b.dataset.date;
        if (!confirm(`Remove all lessons on ${d}?`)) return;
        const uLocal = getUsers(); const clLocal = getClasses();
        clLocal[code].students.forEach(s=>{ if (uLocal[s]?.progress) delete uLocal[s].progress[d]; });
        saveUsers(uLocal);
        renderTeacher(t);
      }));
    });
  }

  function renderStudent(code, student) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = (classes[code].customDrills[today]) || classes[code].drills;
    let idx=0, pos=0;
    let accEl = document.getElementById('accuracy-display');
    if (!accEl) { accEl = document.createElement('div'); accEl.id='accuracy-display'; accEl.style.margin='0.5em 0'; studentDash.querySelector('#feedback').after(accEl); }
    function updateAcc() { const spans=document.querySelectorAll('.char'); const errs=[...spans].filter(s=>s.classList.contains('error')).length; accEl.textContent=`Accuracy: ${Math.max(0,Math.round((spans.length-errs)/spans.length*100))}%`; }
    function load() { promptEl.innerHTML=''; drills[idx].split('').forEach(ch=>{const sp=document.createElement('span');sp.className='char';sp.textContent=ch;promptEl.appendChild(sp);}); pos=0; mark(); feedbackEl.textContent=''; nextBtn.disabled=true; updateAcc(); }
    function mark() { const sp=document.querySelectorAll('.char'); sp.forEach(s=>s.classList.remove('current')); if(sp[pos]) sp[pos].classList.add('current'); }
    document.onkeydown = e => { if (studentDash.classList.contains('hidden')) return; if (e.key==='Backspace') { e.preventDefault(); if(pos>0){ pos--; const sp=document.querySelectorAll('.char'); sp[pos].classList.remove('correct','error'); mark(); updateAcc(); nextBtn.disabled=true;} return;} if(e.key.length!==1||pos>=drills[idx].length){ e.preventDefault(); return;} const sp=document.querySelectorAll('.char'); sp[pos].classList.remove('current'); if(e.key===drills[idx][pos]){ sp[pos].classList.add('correct'); feedbackEl.textContent=''; } else { sp[pos].classList.add('error'); feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`; } pos++; mark(); updateAcc(); if(pos>=sp.length) nextBtn.disabled=false; };
    nextBtn.onclick = () => { const sp=document.querySelectorAll('.char'); const corr=[...sp].filter(s=>s.classList.contains('correct')).length; const errs=[...sp].filter(s=>s.classList.contains('error')).length; const acc=Math.max(0,Math.round((corr/sp.length)*100)); const u=getUsers(); u[student].progress[today]=u[student].progress[today]||[]; u[student].progress[today].push({drill:idx,correct:corr,errors:errs,accuracy:acc}); saveUsers(u); if(idx+1<drills.length){ idx++; load(); } else { promptEl.textContent='Done!'; nextBtn.style.display='none'; }};
    load();
  }

  function enterAdmin() {
    loginScreen.classList.add('hidden');
    const admin = document.createElement('div'); admin.id='admin';
    admin.innerHTML = `
      <h2>Admin Panel</h2>
      <table border="1" style="width:100%"><tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr><tbody id="admin-body"></tbody></table>
    `;
    document.body.appendChild(admin);
    const body = document.getElementById('admin-body');
    const users = getUsers(); const classes = getClasses();
    Object.entries(users).forEach(([u,data]) => {
      let info = '';
      if(data.role==='teacher') info = (data.classrooms||[]).join(', ');
      if(data.role==='student') info = data.classroomCode || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u}</td><td>${data.role}</td><td>${info}</td><td><button data-user="${u}" class="del-user">Delete</button></td>`;
      body.appendChild(tr);
    });
    document.querySelectorAll('.del-user').forEach(btn => btn.onclick = () => {
      const u = btn.dataset.user;
      if(!confirm(`Delete ${u}?`)) return;
      const usersLocal = getUsers(), classesLocal = getClasses();
      if(usersLocal[u].role==='teacher') {
        usersLocal[u].classrooms.forEach(c=>delete classesLocal[c]);
      }
      if(usersLocal[u].role==='student') {
        const cc = usersLocal[u].classroomCode;
        if(classesLocal[cc]) classesLocal[cc].students = classesLocal[cc].students.filter(x=>x!==u);
      }
      delete usersLocal[u]; saveUsers(usersLocal); saveClasses(classesLocal);
      admin.remove(); enterAdmin();
    });
  }

  function renderAdmin(){} // not used
}
