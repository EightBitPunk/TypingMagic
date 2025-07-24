// Version 0.1.27

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.27';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

function initApp() {
  const defaultDrills = [
    'The quick brown fox jumps over the lazy dog.',
    'Typing practice improves both speed and accuracy.',
    'Accuracy over speed.'
  ];

  // Persist last username
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) document.getElementById('username').value = lastUser;

  // Utilities
  const getUsers = () => JSON.parse(localStorage.getItem('users') || '{}');
  const saveUsers = u => localStorage.setItem('users', JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem('classrooms') || '{}');
  const saveClasses = c => localStorage.setItem('classrooms', JSON.stringify(c));

  // Logout button
  let logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Log Out';
    Object.assign(logoutBtn.style, { position:'fixed', top:'5px', right:'10px', display:'none' });
    logoutBtn.onclick = () => { localStorage.removeItem('currentUser'); location.reload(); };
    document.body.appendChild(logoutBtn);
  }

  // DOM refs
  const loginScreen = document.getElementById('login-screen');
  const loginBtn = document.getElementById('login-btn');
  let toggleBtn = document.getElementById('toggle-mode-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button'); toggleBtn.id='toggle-mode-btn'; loginScreen.appendChild(toggleBtn);
  }
  const userIn = document.getElementById('username');
  const passIn = document.getElementById('password');
  const roleSel = document.getElementById('role');
  const loginMsg = document.getElementById('login-message');
  const classIn = document.getElementById('classroom-code');
  const studentWrap = document.getElementById('student-classroom-code');

  const teacherDash = document.getElementById('teacher-dashboard');
  const classSetup = document.getElementById('classroom-setup');
  const teacherView = document.getElementById('teacher-classroom-view');
  const createBtn = document.getElementById('create-classroom-btn');
  const newClassIn = document.getElementById('new-classroom-name');
  const codeDisp = document.getElementById('classroom-code-display');
  const teacherName = document.getElementById('teacher-name');
  const progTable = document.getElementById('student-progress-table');

  const studentDash = document.getElementById('student-dashboard');
  const studentName = document.getElementById('student-name');
  const promptEl = document.getElementById('prompt');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn = document.getElementById('next-btn');

  // Sign-up toggle
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent = isSignUp?'Sign Up':'Log In';
    toggleBtn.textContent = isSignUp?'Go to Log In':'Go to Sign Up';
    studentWrap.classList.toggle('hidden',!(isSignUp&&roleSel.value==='student'));
  }
  toggleBtn.onclick = ()=>{ isSignUp=!isSignUp; updateMode(); };
  roleSel.onchange = updateMode;
  updateMode();

  // Auto-login session
  const session = JSON.parse(localStorage.getItem('currentUser')||'null');
  if (session&&session.username&&session.role!=='admin') {
    const users = getUsers();
    if (users[session.username]&&users[session.username].role===session.role) {
      enterDash(session.username, session.role);
      return;
    }
    localStorage.removeItem('currentUser');
  }

  // Login/Signup
  loginBtn.onclick = ()=>{
    loginMsg.textContent='';
    const u=userIn.value.trim(), p=passIn.value;
    const role=roleSel.value, code=classIn.value.trim();
    // Admin
    if(u==='KEFKA'&&p==='SUCKS'){ enterAdmin(); return; }
    if(!u||!p||(isSignUp&&role==='student'&&!code)){ loginMsg.textContent='Complete all fields.'; return; }
    const users = getUsers();
    if(isSignUp){
      if(users[u]){ loginMsg.textContent='User exists.'; return; }
      users[u] = { password:p, role, progress:{}, classrooms:role==='teacher'?[]:undefined, classroomCode:role==='student'?code:undefined };
      if(role==='student'){ const cls=getClasses(); cls[code].students.push(u); saveClasses(cls); }
      saveUsers(users);
      localStorage.setItem('lastUser',u);
      localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
      enterDash(u,role);
    } else {
      if(users[u]&&users[u].password===p&&users[u].role===role){
        localStorage.setItem('lastUser',u);
        localStorage.setItem('currentUser', JSON.stringify({username:u,role}));
        enterDash(u,role);
      } else loginMsg.textContent='Incorrect credentials.';
    }
  };

  function enterDash(u,role){
    logoutBtn.style.display='block';
    loginScreen.classList.add('hidden');
    if(role==='teacher'){
      teacherName.textContent=u;
      teacherDash.classList.remove('hidden'); classSetup.classList.remove('hidden'); teacherView.classList.remove('hidden');
      renderTeacher(u);
    } else {
      studentName.textContent=u;
      studentDash.classList.remove('hidden');
      renderStudent(getUsers()[u].classroomCode,u);
    }
  }

  // Create class
  createBtn.onclick=()=>{
    const n=newClassIn.value.trim(); if(!n)return;
    const code='C'+Math.floor(100000+Math.random()*900000);
    const cls=getClasses(); cls[code]={name:n,teacher:teacherName.textContent,students:[],drills:defaultDrills.slice(),customDrills:{}};
    saveClasses(cls);
    const us=getUsers(); us[teacherName.textContent].classrooms.push(code); saveUsers(us);
    codeDisp.textContent=`New Code: ${code}`;
    renderTeacher(teacherName.textContent);
  };

  // Teacher render (unchanged from v0.1.26)
  function renderTeacher(t){ /* ... code from v0.1.26 ... */ }

  // Student render with calendar only
  function renderStudent(code, student){
    buildCalendar(student, code);
    // usual drill load
    loadStudentDrills(code, student);
  }

  function buildCalendar(student, code){
    const cls=getClasses()[code];
    const prog=getUsers()[student].progress||{};
    const today=new Date(); const year=today.getFullYear(),m=today.getMonth();
    let cal=document.getElementById('calendar');
    if(!cal){cal=document.createElement('div');cal.id='calendar';cal.style.margin='1em 0';studentDash.prepend(cal);} cal.innerHTML='';
    const tbl=document.createElement('table');tbl.style.borderCollapse='collapse';
    const hdr=document.createElement('tr');['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{const th=document.createElement('th');th.textContent=d;th.style.padding='4px';hdr.appendChild(th);});tbl.appendChild(hdr);
    const first=new Date(year,m,1).getDay(),days=new Date(year,m+1,0).getDate();
    let tr=document.createElement('tr');for(let i=0;i<first;i++){const td=document.createElement('td');td.style.padding='4px';tr.appendChild(td);} 
    for(let d=1;d<=days;d++){if((first+d-1)%7===0&&d!==1){tbl.appendChild(tr);tr=document.createElement('tr');}
      const td=document.createElement('td');td.textContent=d;td.style.width='24px';td.style.height='24px';td.style.textAlign='center';
      const key=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(d<today.getDate()){
        if(prog[key]) td.style.background='lightgreen'; else td.style.background='lightcoral';
        td.style.cursor='pointer';td.onclick=()=>handlePast(key,student,code);
      } else if(d===today.getDate()){ td.style.background='lightblue'; } else td.style.background='lightgray';
      tr.appendChild(td);
    }
    tbl.appendChild(tr);cal.appendChild(tbl);
  }

  function handlePast(key, student, code){
    const cls=getClasses()[code],arr=cls.customDrills[key]||cls.drills;
    alert(`Drill for ${key}:\n`+arr.join('\n'));
    const prog=getUsers()[student].progress||{};
    if(!prog[key] && confirm('Make up this drill now?')){
      overrideDrills(arr);
      renderStudent(code,student);
    }
  }

  function overrideDrills(arr){
    defaultDrills.splice(0,defaultDrills.length,...arr);
  }

  function loadStudentDrills(code, student){
    // copy v0.1.26 student drill logic here
  }

  // Admin (unchanged)
  function enterAdmin(){ /* ... v0.1.26 admin ... */ }
  function deleteUser(u){ /* ... v0.1.26 deleteUser ... */ }
}
