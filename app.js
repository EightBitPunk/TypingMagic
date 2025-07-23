// Version 0.1.17

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.17";
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
    toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn"; loginScreen.appendChild(toggleBtn);
  }
  const usernameIn = document.getElementById("username");
  const passwordIn = document.getElementById("password");
  const roleSel = document.getElementById("role");
  const loginMsg = document.getElementById("login-message");
  const codeIn = document.getElementById("classroom-code");
  const studentWrap = document.getElementById("student-classroom-code");

  const teacherDash = document.getElementById("teacher-dashboard");
  const classSetup = document.getElementById("classroom-setup");
  const teacherView = document.getElementById("teacher-classroom-view");
  const createBtn = document.getElementById("create-classroom-btn");
  const newClassIn = document.getElementById("new-classroom-name");
  const classCodeDisp = document.getElementById("classroom-code-display");
  const teacherName = document.getElementById("teacher-name");
  const progressTable = document.getElementById("student-progress-table");

  const studentDash = document.getElementById("student-dashboard");
  const studentName = document.getElementById("student-name");
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  const getUsers = () => JSON.parse(localStorage.getItem("users")||"{}");
  const saveUsers = u => localStorage.setItem("users",JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms")||"{}");
  const saveClasses = c => localStorage.setItem("classrooms",JSON.stringify(c));

  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const u = usernameIn.value.trim(), p = passwordIn.value;
    const role = roleSel.value, code = codeIn.value.trim();
    if(u==='KEFKA'&&p==='SUCKS'){enterAdmin();return;}
    if(!u||!p||(isSignUp&&role==='student'&&!code)){loginMsg.textContent='Fill fields.';return;}
    const users = getUsers();
    if(isSignUp){
      if(users[u]){loginMsg.textContent='Exists.';return;}
      users[u]={password:p,role,progress:{},classrooms:role==='teacher'?[]:undefined,classroomCode:role==='student'?code:undefined};
      if(role==='student'){const cl=getClasses();cl[code].students.push(u);saveClasses(cl);}      
      saveUsers(users);enterDashboard(u,role);
    } else {
      if(users[u]&&users[u].password===p&&users[u].role===role)enterDashboard(u,role);
      else loginMsg.textContent='Bad creds.';
    }
  };

  function enterDashboard(u,role){
    loginScreen.classList.add('hidden');
    if(role==='teacher'){
      teacherName.textContent=u;
      teacherDash.classList.remove('hidden');classSetup.classList.remove('hidden');teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent=u;studentDash.classList.remove('hidden');renderStudent(getUsers()[u].classroomCode,u);
    }
  }

  createBtn.onclick=()=>{
    const n=newClassIn.value.trim();if(!n)return;
    const code='C'+(100000+Math.floor(Math.random()*900000));
    const cl=getClasses();cl[code]={name:n,teacher:teacherName.textContent,students:[],drills:defaultDrills.slice(),customDrills:{}};
    saveClasses(cl);
    const users=getUsers();users[teacherName.textContent].classrooms.push(code);saveUsers(users);
    classCodeDisp.textContent=`New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  function renderTeacher(t){
    const users=getUsers(),cl=getClasses();let html='';
    users[t].classrooms.forEach(code=>{
      const c=cl[code];if(!c)return;
      html+=`<h3>${c.name} (Code:${code}) `+
            `<button class='custom-btn' data-code='${code}'>Customize Drills</button> `+
            `<span class='del-class' data-code='${code}' style='color:red;cursor:pointer;'>🗑️</span></h3>`;
      html+=`<div id='editor-${code}' style='display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;'>`+
            `<label>Date:<input type='date' id='date-${code}' /></label><br>`+
            `<textarea id='ta-${code}' rows='4' style='width:100%'></textarea><br>`+
            `<label><input type='checkbox' id='all-${code}' /> Apply to all</label><br>`+
            `<button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button></div>`;
      html+=`<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s=>{const prog=users[s].progress||{};Object.entries(prog).forEach(([d,a])=>{const avg=a.length?Math.round(a.reduce((x,y)=>x+y.accuracy,0)/a.length):0;const err=a.reduce((x,y)=>x+y.errors,0);html+=`<tr><td>${s}<span class='del-student' data-code='${code}' data-student='${s}' style='color:red;cursor:pointer;margin-left:8px;'>🗑️</span></td>`+`<td>${d}<span class='del-date' data-code='${code}' data-date='${d}' style='color:red;cursor:pointer;margin-left:8px;'>🗑️</span></td><td>${avg}%</td><td>${err}</td></tr>`;});});
      html+=`</table>`;
    });progressTable.innerHTML=html;

    users[t].classrooms.forEach(code=>{
      document.querySelector(`.custom-btn[data-code='${code}']`).onclick=()=>{
        const cobj=getClasses()[code];
        const ed=document.getElementById(`editor-${code}`);
        const di=document.getElementById(`date-${code}`);
        const ta=document.getElementById(`ta-${code}`);
        di.value=new Date().toISOString().split('T')[0];
        const ex=cobj.customDrills[di.value]||cobj.drills;
        ta.value=ex.join("\n");ed.style.display='block';
        document.getElementById(`cancel-${code}`).onclick=()=>ed.style.display='none';
        document.getElementById(`save-${code}`).onclick=()=>{
          const d=di.value;const lines=ta.value.split("\n").map(l=>l.trim()).filter(Boolean);
          const applyAll=document.getElementById(`all-${code}`).checked;
          const clsLocal=getClasses();
          if(applyAll) users[t].classrooms.forEach(cid=>{
            clsLocal[cid].customDrills=clsLocal[cid].customDrills||{};
            clsLocal[cid].customDrills[d]=lines;
          }); else {clsLocal[code].customDrills=clsLocal[code].customDrills||{};clsLocal[code].customDrills[d]=lines;}
          saveClasses(clsLocal);renderTeacher(t);
        };
      };
      document.querySelector(`.del-class[data-code='${code}']`).onclick=()=>{if(confirm('Delete class?')){const cll=getClasses();delete cll[code];saveClasses(cll);const ul=getUsers();ul[t].classrooms=ul[t].classrooms.filter(c=>c!==code);saveUsers(ul);renderTeacher(t);} };
      document.querySelectorAll(`.del-student[data-code='${code}']`).forEach(b=>b.onclick=()=>{const s=b.dataset.student;if(confirm(`Remove ${s}?`)){const ccl=getClasses();ccl[code].students=ccl[code].students.filter(x=>x!==s);saveClasses(ccl);renderTeacher(t);} });
      document.querySelectorAll(`.del-date[data-code='${code}']`).forEach(b=>b.onclick=()=>{const d=b.dataset.date;if(confirm(`Remove all on ${d}?`)){const ul=getUsers();const cll=getClasses();cll[code].students.forEach(s=>{if(ul[s]&&ul[s].progress)delete ul[s].progress[d];});saveUsers(ul);renderTeacher(t);} });
    });
  }

  function renderStudent(code,student){ /* unchanged */ }
  function enterAdmin(){}
  function renderAdmin(){}
}
