// Version 0.1.13

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.13";
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

  // DOM refs
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "toggle-mode-btn";
    loginScreen.appendChild(toggleBtn);
  }
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
      if (role==='student') {
        const classes = getClasses();
        classes[clsCode].students.push(name);
        saveClasses(classes);
      }
      saveUsers(users);
      enterDashboard(name, role);
    } else {
      if (users[name] && users[name].password === pw && users[name].role === role) {
        enterDashboard(name, role);
      } else {
        msg.textContent = 'Incorrect credentials.';
      }
    }
  };

  function enterDashboard(name, role) {
    loginScreen.classList.add('hidden');
    if (role === 'teacher') {
      teacherNameEl.textContent = name;
      teacherDashboard.classList.remove('hidden');
      classroomSetup.classList.remove('hidden');
      teacherClassroomView.classList.remove('hidden');
      renderTeacher(name);
    } else {
      studentNameEl.textContent = name;
      studentDashboard.classList.remove('hidden');
      renderStudent(getUsers()[name].classroomCode, name);
    }
  }

  createClassBtn.onclick = () => {
    const cname = newClassIn.value.trim(); if (!cname) return;
    const code = 'C' + Math.floor(100000 + Math.random() * 900000);
    const classes = getClasses();
    classes[code] = {
      name: cname,
      teacher: teacherNameEl.textContent,
      students: [],
      drills: defaultDrills.slice(),
      customDrills: {}
    };
    saveClasses(classes);
    const users = getUsers();
    users[teacherNameEl.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`;
    renderTeacher(teacherNameEl.textContent);
  };

  function renderTeacher(teacher) {
    const users = getUsers();
    const classes = getClasses();
    let html = '';
    (users[teacher].classrooms || []).forEach(code => {
      const cls = classes[code]; if (!cls) return;
      html += `<h3>${cls.name} (Code: ${code})` +
              ` <button class="custom-btn" data-code="${code}">Customize Drills</button>` +
              ` <span class='del-class' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<div id="editor-${code}" class="editor" style="display:none;padding:1em;border:1px solid #ccc;margin-bottom:1em;">` +
              `<label>Date: <input type="date" class="edit-date"></label><br>` +
              `<textarea class="edit-text" rows="4" style="width:100%"></textarea><br>` +
              `<label><input type="checkbox" class="apply-all"> Apply to all classes</label><br>` +
              `<button class="save-btn">Save</button> <button class="cancel-btn">Cancel</button>` +
              `</div>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th><th>Action</th></tr>`;
      cls.students.forEach(s => {
        const prog = users[s].progress || {};
        Object.entries(prog).forEach(([d, arr]) => {
          const avg = arr.length ? Math.round(arr.reduce((a, x) => a + x.accuracy, 0) / arr.length) : 0;
          const err = arr.reduce((a, x) => a + x.errors, 0);
          html += `<tr><td>${s}</td><td>${d}</td><td>${avg}%</td><td>${err}</td>` +
                  `<td><span class='del-student' data-code='${code}' data-student='${s}' style='color:red;cursor:pointer;'>🗑️</span></td></tr>`;
        });
      });
      html += `</table>`;
    });
    studentProgressTable.innerHTML = html;

    // Customize drills handlers
    document.querySelectorAll('.custom-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        const editor = document.getElementById(`editor-${code}`);
        const dateInput = editor.querySelector('.edit-date');
        const textArea = editor.querySelector('.edit-text');
        const applyAllCb = editor.querySelector('.apply-all');
        const saveBtn = editor.querySelector('.save-btn');
        const cancelBtn = editor.querySelector('.cancel-btn');

        // show editor
        editor.style.display = 'block';
        // default to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        // populate drills
        const cls = getClasses()[code];
        const existing = cls.customDrills[today] || cls.drills;
        textArea.value = existing.join('\n');

        cancelBtn.onclick = () => { editor.style.display = 'none'; };
        saveBtn.onclick = () => {
          const selDate = dateInput.value;
          const lines = textArea.value.split('\n').map(l => l.trim()).filter(Boolean);
          const applyAll = applyAllCb.checked;
          const classesLocal = getClasses();
          if (applyAll) {
            users[teacher].classrooms.forEach(cid => {
              classesLocal[cid].customDrills = classesLocal[cid].customDrills || {};
              classesLocal[cid].customDrills[selDate] = lines;
            });
          } else {
            classesLocal[code].customDrills = classesLocal[code].customDrills || {};
            classesLocal[code].customDrills[selDate] = lines;
          }
          saveClasses(classesLocal);
          renderTeacher(teacher);
        };
      };
    });

    // Delete class
    document.querySelectorAll('.del-class').forEach(btn => btn.onclick = () => {
      const code = btn.dataset.code;
      if (!confirm('Delete class?')) return;
      const classesLocal = getClasses(); delete classesLocal[code]; saveClasses(classesLocal);
      const usersLocal = getUsers();
      usersLocal[teacher].classrooms = usersLocal[teacher].classrooms.filter(c => c !== code);
      saveUsers(usersLocal);
      renderTeacher(teacher);
    });

    // Delete student
    document.querySelectorAll('.del-student').forEach(btn => btn.onclick = () => {
      const code = btn.dataset.code;
      const student = btn.dataset.student;
      if (!confirm(`Remove ${student}?`)) return;
      const classesLocal = getClasses();
      classesLocal[code].students = classesLocal[code].students.filter(s => s !== student);
      saveClasses(classesLocal);
      renderTeacher(teacher);
    });
  }

  function renderStudent(code, student) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = (classes[code]?.customDrills?.[today]) || classes[code]?.drills || defaultDrills;
    let idx = 0, pos = 0;
    let accEl = document.getElementById('accuracy-display');
    if (!accEl) { accEl = document.createElement('div'); accEl.id = 'accuracy-display'; accEl.style.margin = '0.5em 0'; studentDashboard.querySelector('#feedback').after(accEl); }
    function updateAcc() {
      const spans = document.querySelectorAll('.char');
      const errors = [...spans].filter(s => s.classList.contains('error')).length;
      const total = spans.length;
      accEl.textContent = `Accuracy: ${Math.max(0, Math.round((total - errors) / total * 100))}%`;
    }
    function load() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => { const sp = document.createElement('span'); sp.className = 'char'; sp.textContent = ch; promptEl.appendChild(sp); });
      pos = 0; mark(); feedbackEl.textContent = ''; nextBtn.disabled = true; accEl.textContent = 'Accuracy: 100%';
    }
    function mark() { document.querySelectorAll('.char').forEach(c => c.classList.remove('current')); document.querySelectorAll('.char')[pos]?.classList.add('current'); }
    document.onkeydown = e => {
      if (studentDashboard.classList.contains('hidden')) return;
      if (e.key === 'Backspace') { e.preventDefault(); if (pos > 0) { pos--; const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('correct', 'error'); mark(); updateAcc(); nextBtn.disabled = true; } return; }
      if (e.key.length !== 1 || pos >= drills[idx].length) { e.preventDefault(); return; }
      const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if (e.key === drills[idx][pos]) { spans[pos].classList.add('correct'); feedbackEl.textContent = ''; }
      else { spans[pos].classList.add('error'); feedbackEl.textContent = `Expected "${drills[idx][pos]}" got "${e.key}"`; }
      pos++; mark(); updateAcc(); if (pos >= spans.length) nextBtn.disabled = false;
    };
    nextBtn.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const corr = [...spans].filter(s => s.classList.contains('correct')).length;
      const err = [...spans].filter(s => s.classList.contains('error')).length;
      const acc = Math.max(0, Math.round((corr / spans.length) * 100));
      const usersLocal = getUsers();
      usersLocal[student].progress[today] = usersLocal[student].progress[today] || [];
      usersLocal[student].progress[today].push({ drill: idx, correct: corr, errors: err, accuracy: acc });
      saveUsers(usersLocal);
      if (idx + 1 < drills.length) { idx++; load(); } else { promptEl.textContent = 'Done!'; nextBtn.style.display = 'none'; }
    };
    load();
  }

  function enterAdmin() {}
  function renderAdmin() {}
}
