// Version 0.1.18

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  const badge = document.createElement("div");
  badge.textContent = "version 0.1.18";
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

  // DOM refs
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  let toggleBtn = document.getElementById("toggle-mode-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button"); toggleBtn.id = "toggle-mode-btn"; loginScreen.appendChild(toggleBtn);
  }
  const userIn = document.getElementById("username");
  const passIn = document.getElementById("password");
  const roleSel = document.getElementById("role");
  const loginMsg = document.getElementById("login-message");
  const classIn = document.getElementById("classroom-code");
  const studentWrap = document.getElementById("student-classroom-code");

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

  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    studentWrap.classList.toggle("hidden", !(isSignUp && roleSel.value === "student"));
  }
  toggleBtn.onclick = () => { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange = updateMode; updateMode();

  const getUsers = () => JSON.parse(localStorage.getItem("users")||"{}");
  const saveUsers = u => localStorage.setItem("users",JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem("classrooms")||"{}");
  const saveClasses = c => localStorage.setItem("classrooms",JSON.stringify(c));

  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const u = userIn.value.trim(), p = passIn.value;
    const role = roleSel.value, code = classIn.value.trim();
    if(u==='KEFKA'&&p==='SUCKS'){enterAdmin();return;}
    if(!u||!p||(isSignUp&&role==='student'&&!code)){loginMsg.textContent='Fill all fields.';return;}
    const users = getUsers();
    if(isSignUp){
      if(users[u]){loginMsg.textContent='User exists.';return;}
      users[u]={password:p,role,progress:{},classrooms:role==='teacher'?[]:undefined,classroomCode:role==='student'?code:undefined};
      if(role==='student'){const cl=getClasses();cl[code].students.push(u);saveClasses(cl);}
      saveUsers(users);enterDash(u,role);
    } else {
      if(users[u]&&users[u].password===p&&users[u].role===role)enterDash(u,role);
      else loginMsg.textContent='Bad creds.';
    }
  };

  function enterDash(u,role) {
    loginScreen.classList.add('hidden');
    if(role==='teacher'){
      teacherName.textContent=u;
      teacherDash.classList.remove('hidden'); classSetup.classList.remove('hidden'); teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent=u; studentDash.classList.remove('hidden'); renderStudent(getUsers()[u].classroomCode,u);
    }
  }

  createBtn.onclick = () => {
    const n=newClassIn.value.trim();if(!n)return;
    const code='C'+(100000+Math.floor(Math.random()*900000));
    const cl=getClasses();cl[code]={name:n,teacher:teacherName.textContent,students:[],drills:defaultDrills.slice(),customDrills:{}};
    saveClasses(cl);
    const u=getUsers();u[teacherName.textContent].classrooms.push(code);saveUsers(u);
    codeDisp.textContent=`New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  function renderTeacher(t) {
    const u=getUsers(),cl=getClasses();let html='';
    u[t].classrooms.forEach(code=>{
      const c=cl[code];if(!c)return;
      html+=`<h3>${c.name} (Code:${code}) `+
            `<button class='custom-btn' data-code='${code}'>Customize Drills</button> `+
            `<span class='del-class' data-code='${code}'>🗑️</span></h3>`;
      html+=`<div id='editor-${code}' style='display:none;padding:8px;border:1px solid #ccc;margin-bottom:8px;'>`+
            `<label>Date:<input type='date' id='date-${code}' /></label><br>`+
            `<textarea id='ta-${code}' rows='4' style='width:100%'></textarea><br>`+
            `<label><input type='checkbox' id='all-${code}' /> All classes</label><br>`+
            `<button id='save-${code}'>Save</button> <button id='cancel-${code}'>Cancel</button></div>`;
      html+=`<table><tr><th>Student</th><th>Date</th><th>Acc</th><th>Err</th></tr>`;
      c.students.forEach(s=>{const pr=u[s].progress||{};Object.entries(pr).forEach(([d,a])=>{const avg=a.length?Math.round(a.reduce((x,y)=>x+y.accuracy,0)/a.length):0;const err=a.reduce((x,y)=>x+y.errors,0);html+=`<tr><td>${s}<span class='del-student' data-code='${code}' data-student='${s}'>🗑️</span></td>`+`<td>${d}<span class='del-date' data-code='${code}' data-date='${d}'>🗑️</span></td><td>${avg}%</td><td>${err}</td></tr>`;});});html+=`</table>`;
    });progTable.innerHTML=html;

    // customize
    u[t].classrooms.forEach(code=>{
      document.querySelector(`.custom-btn[data-code='${code}']`).onclick=()=>{
        const cobj=getClasses()[code];
        const ed=document.getElementById(`editor-${code}`);
        const di=document.getElementById(`date-${code}`);
        const ta=document.getElementById(`ta-${code}`);
        // load existing or default
        const d0=di.value||new Date().toISOString().split('T')[0]; di.value=d0;
        const arr=cobj.customDrills[d0]||cobj.drills;
        ta.value=arr.join("\n"); ed.style.display='block';
        document.getElementById(`cancel-${code}`).onclick=()=>ed.style.display='none';
        document.getElementById(`save-${code}`).onclick=()=>{
          const d=di.value;
          const lines=ta.value.split("\n").map(l=>l.trim()).filter(Boolean);
          const all=document.getElementById(`all-${code}`).checked;
          const clsLocal=getClasses();
          if(all) u[t].classrooms.forEach(cid=>{clsLocal[cid].customDrills[cid]=clsLocal[cid].customDrills[cid]||{};clsLocal[cid].customDrills[d]=lines;});
          else {clsLocal[code].customDrills=clsLocal[code].customDrills||{};clsLocal[code].customDrills[d]=lines;}
          saveClasses(clsLocal); renderTeacher(t);
        };
      };
      // delete class
      document.querySelector(`.del-class[data-code='${code}']`).onclick=()=>{if(confirm('Delete class?')){const cll=getClasses();delete cll[code];saveClasses(cll);const uu=getUsers();uu[t].classrooms=uu[t].classrooms.filter(c=>c!==code);saveUsers(uu);renderTeacher(t);} };
      // delete student
      document.querySelectorAll(`.del-student[data-code='${code}']`).forEach(btn=>btn.onclick=()=>{const s=btn.dataset.student;if(confirm(`Remove ${s}?`)){const cll=getClasses();cll[code].students=cll[code].students.filter(x=>x!==s);saveClasses(cll);renderTeacher(t);} });
      // delete date
      document.querySelectorAll(`.del-date[data-code='${code}']`).forEach(btn=>btn.onclick=()=>{const d=btn.dataset.date;if(confirm(`Remove all on ${d}?`)){const uu=getUsers(),cll=getClasses();cll[code].students.forEach(s=>{if(uu[s]&&uu[s].progress)delete uu[s].progress[d];});saveUsers(uu);renderTeacher(t);} });
    });
  }

  function renderStudent(c, student) {
    const cl=getClasses(); const today=new Date().toISOString().split('T')[0];
    const drills=(cl[c].customDrills[today])||cl[c].drills;
    let idx=0,pos=0;
    let accEl=document.getElementById('accuracy-display');
    if(!accEl){accEl=document.createElement('div');accEl.id='accuracy-display';accEl.style.margin='0.5em 0';studentDash.querySelector('#feedback').after(accEl);}    
    function updateAcc(){const spans=document.querySelectorAll('.char');const errs=[...spans].filter(s=>s.classList.contains('error')).length;accEl.textContent=`Accuracy: ${Math.max(0,Math.round((spans.length-errs)/spans.length*100))}%`;}    
    function loadDrill(){promptEl.innerHTML='';drills[idx].split('').forEach(ch=>{const s=document.createElement('span');s.className='char';s.textContent=ch;promptEl.appendChild(s);});pos=0;mark();feedbackEl.textContent='';nextBtn.disabled=true;updateAcc();}
    function mark(){const spans=document.querySelectorAll('.char');spans.forEach(s=>s.classList.remove('current'));if(spans[pos])spans[pos].classList.add('current');}
    document.onkeydown=e=>{if(studentDash.classList.contains('hidden'))return;if(e.key==='Backspace'){e.preventDefault();if(pos>0){pos--;const spans=document.querySelectorAll('.char');spans[pos].classList.remove('correct','error');mark();updateAcc();nextBtn.disabled=true;}return;}if(e.key.length!==1||pos>=drills[idx].length){e.preventDefault();return;}const spans=document.querySelectorAll('.char');spans[pos].classList.remove('current');if(e.key===drills[idx][pos]){spans[pos].classList.add('correct');feedbackEl.textContent='';}else{spans[pos].classList.add('error');feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`; }pos++;mark();updateAcc();if(pos>=spans.length)nextBtn.disabled=false;};
    nextBtn.onclick=()=>{const spans=document.querySelectorAll('.char');const corr=[...spans].filter(s=>s.classList.contains('correct')).length;const errs=[...spans].filter(s=>s.classList.contains('error')).length;const acc=Math.max(0,Math.round((corr/spans.length)*100));const uu=getUsers();uu[student].progress[today]=uu[student].progress[today]||[];uu[student].progress[today].push({drill:idx,correct:corr,errors:errs,accuracy:acc});saveUsers(uu);if(idx+1<drills.length){idx++;loadDrill();}else{promptEl.textContent='Done!';nextBtn.style.display='none';}};
    loadDrill();
  }

  function enterAdmin(){}
  function renderAdmin(){}
}
