// Version 0.1.22

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.22";
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

  // DOM references
  const loginScreen = document.getElementById("login-screen");
  const loginBtn    = document.getElementById("login-btn");
  let   toggleBtn   = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn";
    loginScreen.appendChild(toggleBtn);
  }
  const userIn     = document.getElementById("username");
  const passIn     = document.getElementById("password");
  const roleSel    = document.getElementById("role");
  const loginMsg   = document.getElementById("login-message");
  const classIn    = document.getElementById("classroom-code");
  const studentWrap= document.getElementById("student-classroom-code");

  const teacherDash = document.getElementById("teacher-dashboard");
  const classSetup  = document.getElementById("classroom-setup");
  const teacherView = document.getElementById("teacher-classroom-view");
  const createBtn   = document.getElementById("create-classroom-btn");
  const newClassIn  = document.getElementById("new-classroom-name");
  const codeDisp    = document.getElementById("classroom-code-display");
  const teacherName = document.getElementById("teacher-name");
  const progTable   = document.getElementById("student-progress-table");

  const studentDash = document.getElementById("student-dashboard");
  const studentName = document.getElementById("student-name");
  const promptEl    = document.getElementById("prompt");
  const feedbackEl  = document.getElementById("feedback");
  const nextBtn     = document.getElementById("next-btn");

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

  // Login / Signup
  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const u = userIn.value.trim(), p = passIn.value;
    const role = roleSel.value, code = classIn.value.trim();

    // Admin shortcut
    if (u === "KEFKA" && p === "SUCKS") {
      enterAdmin(); return;
    }

    if (!u || !p || (isSignUp && role === "student" && !code)) {
      loginMsg.textContent = "Complete all fields.";
      return;
    }
    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent = "User exists."; return; }
      users[u] = { password: p, role, progress: {}, classrooms: role==='teacher'?[]:undefined, classroomCode: role==='student'?code:undefined };
      if (role==='student') {
        const cls = getClasses(); cls[code].students.push(u); saveClasses(cls);
      }
      saveUsers(users);
      enterDash(u, role);
    } else {
      if (users[u] && users[u].password === p && users[u].role === role) {
        enterDash(u, role);
      } else {
        loginMsg.textContent = "Incorrect credentials.";
      }
    }
  };

  function enterDash(u, role) {
    loginScreen.classList.add("hidden");
    if (role === "teacher") {
      teacherName.textContent = u;
      teacherDash.classList.remove("hidden");
      classSetup.classList.remove("hidden");
      teacherView.classList.remove("hidden");
      renderTeacher(u);
    } else {
      studentName.textContent = u;
      studentDash.classList.remove("hidden");
      renderStudent(getUsers()[u].classroomCode, u);
    }
  }

  // Create new class
  createBtn.onclick = () => {
    const name = newClassIn.value.trim(); if (!name) return;
    const code = "C" + Math.floor(100000 + Math.random()*900000);
    const cls = getClasses();
    cls[code] = { name, teacher:teacherName.textContent, students:[], drills:defaultDrills.slice(), customDrills:{} };
    saveClasses(cls);
    const users = getUsers(); users[teacherName.textContent].classrooms.push(code); saveUsers(users);
    codeDisp.textContent = `New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  // Render Teacher Dashboard
  function renderTeacher(t) {
    const users = getUsers(), cls = getClasses();
    let html = "";
    users[t].classrooms.forEach(code => {
      const c = cls[code]; if (!c) return;
      html += `<h3>${c.name} (Code: ${code}) ` +
              `<button class="custom-btn" data-code="${code}">Customize Drills</button> ` +
              `<span class="del-class" data-code="${code}">🗑️</span></h3>`;

      // Editor panel
      html += `<div id="editor-${code}" style="display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;">` +
              `<label>Date: <input type="date" id="date-${code}" /></label><br>` +
              `<textarea id="ta-${code}" rows="4" style="width:100%"></textarea><br>` +
              `<label><input type="checkbox" id="all-${code}" /> Apply to all classes</label><br>` +
              `<button id="save-${code}">Save</button> <button id="cancel-${code}">Cancel</button>` +
              `</div>`;

      // Student progress table
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s => {
        const pr = users[s].progress || {};
        Object.entries(pr).forEach(([d, arr]) => {
          const avg = arr.length ? Math.round(arr.reduce((x,y)=>x+y.accuracy,0)/arr.length) : 0;
          const err = arr.reduce((x,y)=>x+y.errors,0);
          html += `<tr>` +
                  `<td>${s} <span class="del-student" data-code="${code}" data-student="${s}">🗑️</span></td>` +
                  `<td>${d} <span class="del-date" data-code="${code}" data-date="${d}">🗑️</span></td>` +
                  `<td>${avg}%</td><td>${err}</td>` +
                  `</tr>`;
        });
      });
      html += `</table>`;
    });
    progTable.innerHTML = html;

    // Handlers
    users[t].classrooms.forEach(code => {
      const cobj = cls[code];
      const editor = document.getElementById(`editor-${code}`);
      const dateInput = document.getElementById(`date-${code}`);
      const ta = document.getElementById(`ta-${code}`);

      // Customize button
      document.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => {
        if (!dateInput.value) dateInput.value = new Date().toISOString().split("T")[0];
        const arr = cobj.customDrills[dateInput.value] || [];
        ta.value = arr.join("\n");
        editor.style.display = "block";
      };

      // Date change loads saved drill (or empty)
      dateInput.onchange = () => {
        const arr = cobj.customDrills[dateInput.value] || [];
        ta.value = arr.join("\n");
      };

      // Cancel
      document.getElementById(`cancel-${code}`).onclick = () => editor.style.display = "none";

      // Save
      document.getElementById(`save-${code}`).onclick = () => {
        const d = dateInput.value;
        const lines = ta.value.split("\n").map(l=>l.trim()).filter(Boolean);
        const all = document.getElementById(`all-${code}`).checked;
        const clsLocal = getClasses();
        if (all) {
          users[t].classrooms.forEach(cid => {
            clsLocal[cid].customDrills = clsLocal[cid].customDrills || {};
            clsLocal[cid].customDrills[d] = lines;
          });
        } else {
          clsLocal[code].customDrills = clsLocal[code].customDrills || {};
          clsLocal[code].customDrills[d] = lines;
        }
        saveClasses(clsLocal);
        renderTeacher(t);
      };

      // Delete class
      document.querySelector(`.del-class[data-code="${code}"]`).onclick = () => {
        if (!confirm("Delete class?")) return;
        const clsLocal = getClasses(); delete clsLocal[code]; saveClasses(clsLocal);
        const uu = getUsers();
        uu[t].classrooms = uu[t].classrooms.filter(c=>c!==code);
        saveUsers(uu);
        renderTeacher(t);
      };

      // Delete student
      document.querySelectorAll(`.del-student[data-code="${code}"]`).forEach(btn => btn.onclick = () => {
        const s = btn.dataset.student;
        if (!confirm(`Remove ${s}?`)) return;
        const clsLocal = getClasses();
        clsLocal[code].students = clsLocal[code].students.filter(x=>x!==s);
        saveClasses(clsLocal);
        renderTeacher(t);
      }));

      // Delete date progress
      document.querySelectorAll(`.del-date[data-code="${code}"]`).forEach(btn => btn.onclick = () => {
        const d = btn.dataset.date;
        if (!confirm(`Remove all lessons on ${d}?`)) return;
        const uu = getUsers(), clsLocal = getClasses();
        clsLocal[code].students.forEach(s => {
          if (uu[s] && uu[s].progress) delete uu[s].progress[d];
        });
        saveUsers(uu);
        renderTeacher(t);
      }));
    });
  }

  // Student flow unchanged from 0.1.21
  function renderStudent(code, student) {
    const cls = getClasses();
    const today = new Date().toISOString().split("T")[0];
    const drills = cls[code].customDrills[today] || cls[code].drills;
    let idx=0, pos=0;
    let accEl = document.getElementById('accuracy-display');
    if (!accEl) {
      accEl = document.createElement('div'); accEl.id = 'accuracy-display';
      accEl.style.margin = '0.5em 0';
      studentDash.querySelector('#feedback').after(accEl);
    }
    function updateAcc() {
      const spans = document.querySelectorAll('.char');
      const errs  = [...spans].filter(s=>s.classList.contains('error')).length;
      accEl.textContent = `Accuracy: ${Math.max(0, Math.round((spans.length-errs)/spans.length*100))}%`;
    }
    function loadDrill() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => {
        const sp = document.createElement('span'); sp.className = 'char'; sp.textContent = ch;
        promptEl.appendChild(sp);
      });
      pos = 0; mark(); feedbackEl.textContent = ''; nextBtn.disabled = true; updateAcc();
    }
    function mark() {
      const spans = document.querySelectorAll('.char'); spans.forEach(s=>s.classList.remove('current'));
      spans[pos]?.classList.add('current');
    }
    document.onkeydown = e => {
      if (studentDash.classList.contains('hidden')) return;
      if (e.key === 'Backspace') {
        e.preventDefault(); if (pos>0) { pos--; const spans=document.querySelectorAll('.char'); spans[pos].classList.remove('correct','error'); mark(); updateAcc(); nextBtn.disabled=true; } return;
      }
      if (e.key.length!==1 || pos>=drills[idx].length) { e.preventDefault(); return; }
      const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if (e.key === drills[idx][pos]) { spans[pos].classList.add('correct'); feedbackEl.textContent=''; }
      else { spans[pos].classList.add('error'); feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`; }
      pos++; mark(); updateAcc(); if (pos>=spans.length) nextBtn.disabled=false;
    };
    nextBtn.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const corr = [...spans].filter(s=>s.classList.contains('correct')).length;
      const errs = [...spans].filter(s=>s.classList.contains('error')).length;
      const acc  = Math.max(0, Math.round((corr/spans.length)*100));
      const uu = getUsers();
      uu[student].progress[today] = uu[student].progress[today]||[];
      uu[student].progress[today].push({drill:idx,correct:corr,errors:errs,accuracy:acc});
      saveUsers(uu);
      if (idx+1<drills.length) { idx++; loadDrill(); } else { promptEl.textContent='Done!'; nextBtn.style.display='none'; }
    };
    loadDrill();
  }

  // Admin panel with cleanup
  function enterAdmin() {
    const panel = document.getElementById('admin') || document.createElement('div');
    panel.id = 'admin';
    panel.innerHTML = `
      <h2>Admin Panel</h2>
      <button id="cleanup-students">Delete all orphan students</button>
      <button id="cleanup-teachers">Delete all orphan teachers</button>
      <table border="1" style="width:100%">
        <tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr>
        <tbody id="admin-body"></tbody>
      </table>
    `;
    document.body.appendChild(panel);
    const body = document.getElementById('admin-body');
    body.innerHTML = '';
    const users = getUsers(), classes = getClasses();
    const validClasses = new Set(Object.keys(classes));
    Object.entries(users).forEach(([u,data]) => {
      let info = '';
      if (data.role==='teacher') info = (data.classrooms||[]).join(', ') || '<i>none</i>';
      else {
        const cc = data.classroomCode;
        info = cc && validClasses.has(cc)
          ? cc
          : `<span style="color:red">${cc||'none'}</span>`;
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u}</td><td>${data.role}</td><td>${info}</td>
        <td><button data-user="${u}" class="del-user">Delete</button></td>`;
      body.appendChild(tr);
    });

    // individual deletes
    document.querySelectorAll('.del-user').forEach(btn=>btn.onclick=()=>{
      const u = btn.dataset.user;
      if (!confirm(`Delete ${u}?`)) return;
      deleteUser(u);
      enterAdmin();
    });
    // cleanup orphans
    document.getElementById('cleanup-students').onclick = () => {
      if (!confirm('Delete all orphan students?')) return;
      const us = getUsers();
      Object.entries(us).forEach(([u,d]) => {
        if (d.role==='student' && !validClasses.has(d.classroomCode)) delete us[u];
      });
      saveUsers(us);
      enterAdmin();
    };
    document.getElementById('cleanup-teachers').onclick = () => {
      if (!confirm('Delete all orphan teachers?')) return;
      const us = getUsers();
      Object.entries(us).forEach(([u,d]) => {
        if (d.role==='teacher' && (!d.classrooms||d.classrooms.length===0)) delete us[u];
      });
      saveUsers(us);
      enterAdmin();
    };
  }

  function deleteUser(u) {
    const us = getUsers(), cls = getClasses();
    if (us[u].role==='teacher') {
      us[u].classrooms.forEach(c=>delete cls[c]);
      saveClasses(cls);
    } else {
      const cc = us[u].classroomCode;
      if (cls[cc]) cls[cc].students = cls[cc].students.filter(x=>x!==u);
      saveClasses(cls);
    }
    delete us[u]; saveUsers(us);
  }
}
