// Version 0.0.5
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.0.5 loaded");

  // Show version tag
  const ver = document.createElement("div");
  ver.textContent = "version 0.0.5";
  Object.assign(ver.style, {
    position: "fixed",
    bottom: "5px",
    right: "10px",
    fontSize: "0.8em",
    color: "gray",
    pointerEvents: "none"
  });
  document.body.appendChild(ver);

  initApp();
});

function initApp() {
  // DOM references
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
  const studentDash = document.getElementById("student-dashboard");
  const teacherName = document.getElementById("teacher-name");
  const studentName = document.getElementById("student-name");
  const progressTbl = document.getElementById("student-progress-table");
  const createClassBtn = document.getElementById("create-classroom-btn");
  const newClassInp = document.getElementById("new-classroom-name");
  const codeDisplay = document.getElementById("classroom-code-display");

  let isSignUp = false;

  // Toggle log in / sign up UI
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.addEventListener("click", () => { isSignUp = !isSignUp; updateMode(); });
  roleSel.addEventListener("change", updateMode);
  updateMode();

  // Storage helpers
  const getUsers = () => JSON.parse(localStorage.getItem("users")||"{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms")||"{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  // Login / SignUp handler
  loginBtn.onclick = () => {
    msg.textContent = "";
    const name = userIn.value.trim();
    const pw = passIn.value;
    const role = roleSel.value;
    const classroomCode = codeIn.value.trim();
    if (!name || !pw || (isSignUp && role === "student" && !classroomCode)) {
      msg.textContent = "Please fill all required fields.";
      return;
    }
    const users = getUsers();
    if (isSignUp) {
      if (users[name]) { msg.textContent = "User already exists."; return; }
      users[name] = { password: pw, role, progress: {}, classrooms: [], classroomCode: (role==="student"?classroomCode:undefined) };
      if (role === "student") {
        const classes = getClasses();
        if (!classes[classroomCode]) { msg.textContent = "Invalid classroom code."; delete users[name]; return; }
        classes[classroomCode].students.push(name);
        saveClasses(classes);
      }
      saveUsers(users);
      goDash(name, role);
    } else {
      if (users[name] && users[name].password === pw && users[name].role === role) {
        goDash(name, role);
      } else {
        msg.textContent = "Incorrect credentials.";
      }
    }
  };

  // Navigate to dashboard
  function goDash(name, role) {
    loginScreen.classList.add("hidden");
    const users = getUsers();
    const me = users[name];
    if (role === "teacher") {
      teacherName.textContent = name;
      teacherDash.classList.remove("hidden");
      showTeacher(name);
    } else {
      studentName.textContent = name;
      studentDash.classList.remove("hidden");
      showStudent(me.classroomCode, name);
    }
  }

  // Create classroom for teacher
  createClassBtn.onclick = () => {
    const cname = newClassInp.value.trim();
    if (!cname) return;
    const code = "C" + Math.floor(100000+Math.random()*900000);
    const classes = getClasses();
    classes[code] = { name: cname, teacher: teacherName.textContent, students: [], drills: [], customDrills: {} };
    saveClasses(classes);
    const users = getUsers();
    users[teacherName.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`;
    showTeacher(teacherName.textContent);
  };

  // Render teacher dashboard
  function showTeacher(t) {
    const users = getUsers(), classes = getClasses();
    let html = "";
    (users[t].classrooms||[]).forEach(code => {
      const cls = classes[code]; if (!cls) return;
      html += `<h3>${cls.name} (Code: ${code}) <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html += `<table><tr><th>Student</th><th>Date</th><th>#</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s => {
        const prog = users[s].progress||{};
        Object.entries(prog).forEach(([d, arr]) => {
          const total = arr.length;
          const acc = Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/total);
          const err = arr.reduce((a,x)=>a+x.errors,0);
          html += `<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${acc}%</td><td>${err}</td></tr>`;
        });
      });
      html += `</table>`;
    });
    progressTbl.innerHTML = html;
    document.querySelectorAll('.del').forEach(btn=>{
      btn.onclick = ()=>{
        const code = btn.dataset.code;
        if (!confirm('Delete class?')) return;
        delete getClasses()[code];
        const us = getUsers();
        us[t].classrooms = us[t].classrooms.filter(c=>c!==code);
        saveClasses(getClasses()); saveUsers(us);
        showTeacher(t);
      };
    });
  }

  // Render student view
  function showStudent(code, name) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = classes[code]?.customDrills?.[today] || classes[code]?.drills || [
      "The quick brown fox jumps over the lazy dog.",
      "Typing practice improves both speed and accuracy.",
      "Accuracy over speed."
    ];
    const promptEl = document.getElementById('prompt');
    const fb = document.getElementById('feedback');
    const nxt = document.getElementById('next-btn');
    let idx = 0, pos = 0;
    function load() {
      promptEl.innerHTML = "";
      drills[idx].split('').forEach(ch=>{
        const s = document.createElement('span'); s.className='char'; s.textContent=ch;
        promptEl.appendChild(s);
      }); pos=0; mark(); nxt.disabled=true; fb.textContent="";
    }
    function mark() {
      document.querySelectorAll('.char').forEach(c=>c.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }
    document.onkeydown = e => {
      if (studentDash.classList.contains('hidden')) return;
      if (e.key==='Backspace'){ e.preventDefault(); if(pos>0){ pos--; document.querySelectorAll('.char')[pos].classList.remove('correct','error'); mark(); nxt.disabled=true;} return; }
      if (e.key.length!==1||pos>=drills[idx].length){ e.preventDefault(); return; }
      const spans = document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if (e.key===drills[idx][pos]) spans[pos].classList.add('correct');
      else { spans[pos].classList.add('error'); fb.textContent=`Expected "${drills[idx][pos]}", got "${e.key}"`; }
      pos++; mark(); if(pos>=spans.length) nxt.disabled=false;
    };
    nxt.onclick = () => {
      const spans = document.querySelectorAll('.char');
      const corr = [...spans].filter(s=>s.classList.contains('correct')).length;
      const err = [...spans].filter(s=>s.classList.contains('error')).length;
      const acc = Math.round((corr/spans.length)*100);
      const us = getUsers();
      us[name].progress[today] = us[name].progress[today]||[];
      us[name].progress[today].push({drill:idx,correct:corr,errors:err,accuracy:acc});
      saveUsers(us);
      if(idx+1<drills.length){ idx++; load(); } else { promptEl.textContent="Done!"; nxt.style.display='none'; }
    };
    load();
  }
}
