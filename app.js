// Version 0.0.6
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js v0.0.6 loaded");

  // version badge
  const vBadge = document.createElement("div");
  vBadge.textContent = "version 0.0.6";
  Object.assign(vBadge.style, {
    position: "fixed",
    bottom: "5px",
    right: "10px",
    fontSize: "0.8em",
    color: "gray",
    pointerEvents: "none"
  });
  document.body.appendChild(vBadge);

  initApp();
});

function initApp() {
  // default drills
  const defaultDrills = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Accuracy over speed."
  ];

  // DOM
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
  const createClassBtn = document.getElementById("create-classroom-btn");
  const newClassInp = document.getElementById("new-classroom-name");
  const codeDisplay = document.getElementById("classroom-code-display");
  const progressTbl = document.getElementById("student-progress-table");
  const teacherName = document.getElementById("teacher-name");

  const studentDash = document.getElementById("student-dashboard");
  const studentName = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const fb = document.getElementById("feedback");
  const nxt = document.getElementById("next-btn");

  let isSignUp = false;

  // mode toggle
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentCodeWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // storage
  const getUsers = () => JSON.parse(localStorage.getItem("users")||"{}");
  const saveUsers = u => localStorage.setItem("users", JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms")||"{}");
  const saveClasses = c => localStorage.setItem("classrooms", JSON.stringify(c));

  // login/signup
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
      users[name] = { password: pw, role, progress: {}, classrooms: [], classroomCode: role==='student'?clsCode:undefined };
      if (role==='student') {
        const classes = getClasses();
        if (!classes[clsCode]) { msg.textContent = "Invalid code."; delete users[name]; return; }
        classes[clsCode].students.push(name);
        saveClasses(classes);
      }
      saveUsers(users);
      goDash(name, role);
    } else {
      if (users[name] && users[name].password===pw && users[name].role===role) {
        goDash(name, role);
      } else {
        msg.textContent = "Incorrect credentials.";
      }
    }
  };

  function goDash(name, role) {
    loginScreen.classList.add("hidden");
    const users = getUsers();
    if (role==='teacher') {
      teacherName.textContent = name;
      teacherDash.classList.remove("hidden");
      renderTeacher(name);
    } else {
      studentName.textContent = name;
      studentDash.classList.remove("hidden");
      renderStudent(users[name].classroomCode, name);
    }
  }

  // create class
  createClassBtn.onclick = () => {
    const cname = newClassInp.value.trim();
    if (!cname) return;
    const code = 'C'+Math.floor(100000+Math.random()*900000);
    const classes = getClasses();
    classes[code] = { name: cname, teacher: teacherName.textContent, students: [], drills: defaultDrills, customDrills: {} };
    saveClasses(classes);
    const users = getUsers();
    users[teacherName.textContent].classrooms.push(code);
    saveUsers(users);
    codeDisplay.textContent = `New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  // teacher view
  function renderTeacher(t) {
    const classes = getClasses();
    const users = getUsers();
    let html="";
    (users[t].classrooms||[]).forEach(code=>{
      const cls = classes[code]; if(!cls) return;
      html+=`<h3>${cls.name} (Code: ${code}) <span class='del' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html+=`<table><tr><th>Student</th><th>Date</th><th>#</th><th>Acc</th><th>Err</th></tr>`;
      cls.students.forEach(s=>{
        const prog = users[s].progress||{};
        Object.entries(prog).forEach(([d,arr])=>{
          const total=arr.length, acc=Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/total), err=arr.reduce((a,x)=>a+x.errors,0);
          html+=`<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${acc}%</td><td>${err}</td></tr>`;
        });
      });
      html+=`</table>`;
    });
    progressTbl.innerHTML=html;
    document.querySelectorAll('.del').forEach(btn=>{
      btn.onclick=()=>{
        const code=btn.dataset.code;
        if(!confirm('Delete class?'))return;
        const cls=getClasses(); delete cls[code]; saveClasses(cls);
        const users=getUsers(); users[t].classrooms=users[t].classrooms.filter(c=>c!==code); saveUsers(users);
        renderTeacher(t);
      };
    });
  }

  // student view
  function renderStudent(code,name) {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const drills = classes[code]?.customDrills?.[today] || classes[code]?.drills || defaultDrills;
    let idx=0, pos=0;
    function loadDrill(){
      promptEl.innerHTML='';
      drills[idx].split('').forEach(ch=>{
        const s=document.createElement('span'); s.className='char'; s.textContent=ch; promptEl.appendChild(s);
      }); pos=0; mark(); nxt.disabled=true; fb.textContent='';
    }
    function mark(){ document.querySelectorAll('.char').forEach(c=>c.classList.remove('current')); document.querySelectorAll('.char')[pos]?.classList.add('current'); }
    document.onkeydown=e=>{
      if(studentDash.classList.contains('hidden'))return;
      if(e.key==='Backspace'){e.preventDefault(); if(pos>0){pos--; document.querySelectorAll('.char')[pos].classList.remove('correct','error'); mark(); nxt.disabled=true;} return;}
      if(e.key.length!==1||pos>=drills[idx].length){e.preventDefault();return;}
      const spans=document.querySelectorAll('.char'); spans[pos].classList.remove('current');
      if(e.key===drills[idx][pos]) spans[pos].classList.add('correct'); else {spans[pos].classList.add('error'); fb.textContent=`Expected "${drills[idx][pos]}", got "${e.key}"`;}
      pos++; mark(); if(pos>=spans.length) nxt.disabled=false;
    };
    nxt.onclick=()=>{
      const spans=document.querySelectorAll('.char'); const corr=[...spans].filter(s=>s.classList.contains('correct')).length;
      const err=[...spans].filter(s=>s.classList.contains('error')).length; const acc=Math.round((corr/spans.length)*100);
      const users=getUsers(); users[name].progress[today]=users[name].progress[today]||[];
      users[name].progress[today].push({drill:idx,correct:corr,errors:err,accuracy:acc}); saveUsers(users);
      if(idx+1<drills.length){idx++; loadDrill();}else{promptEl.textContent="Done for today!"; nxt.style.display='none';}
    };
    loadDrill();
  }
}
