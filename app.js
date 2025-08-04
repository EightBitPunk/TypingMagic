// Version 0.2.03

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ─── Firebase init ─────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBIMcBtlLhHhBaAnzSDQIp5S608lyEgo-o",
  authDomain: "typingmastery-acf2f.firebaseapp.com",
  projectId: "typingmastery-acf2f",
  storageBucket: "typingmastery-acf2f.appspot.com",
  messagingSenderId: "199688909073",
  appId: "1:199688909073:web:689e8c7e8fa6167170dcb0"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log("✅ Firebase initialized successfully!");

// 🔧 Handle localStorage user setup
function setupUserInLocalStorage(email, role, code) {
  const users = getUsers();
  if (!users[email]) {
    users[email] = {
      role,
      classrooms: role === "teacher" ? [] : undefined,
      classroomCode: role === "student" ? code : undefined
    };

    if (role === "student") {
      const classes = getClasses();
      if (!classes[code]) {
        loginMessage.textContent = "Classroom code not found.";
        return false;
      }
      classes[code].students.push(email);
      saveClasses(classes);
    }

    saveUsers(users);
  }
  return true;
}

// ─── Show version badge ─────────────────
function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.2.03';
  Object.assign(badge.style, {
    position: 'fixed', bottom: '5px', right: '10px',
    fontSize: '0.8em', color: 'gray',
    background: 'rgba(255,255,255,0.8)', padding: '2px 5px',
    borderRadius: '3px', pointerEvents: 'none'
  });
  document.body.appendChild(badge);
}

// ─── Kick things off ────────────────────
window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function initApp() {
  // ─── Helpers ───
  const defaultDrills = [
    'The quick brown fox jumps over the lazy dog.',
    'Typing practice improves both speed and accuracy.',
    'Accuracy over speed.'
  ];
  const getUsers   = () => JSON.parse(localStorage.getItem('users')    || '{}');
  const saveUsers  = u  => localStorage.setItem('users', JSON.stringify(u));
  const getClasses = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const saveClasses= c  => localStorage.setItem('classrooms', JSON.stringify(c));
  const getCurrentUser = () =>
    JSON.parse(localStorage.getItem('currentUser') || 'null');

    // ─── Calendar state for student view ───
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  
  // ─── Login / Logout UI wiring ───
  const logoutBtn   = document.getElementById('logout-btn');
  const loginScreen = document.getElementById('login-screen');
  const loginBtn    = document.getElementById('login-btn');
  let   toggleBtn   = document.getElementById('toggle-mode-btn');
  const userIn      = document.getElementById('username');
  const passIn      = document.getElementById('password');
  const roleSel     = document.getElementById('role');
  const classIn     = document.getElementById('classroom-code');
  const loginMsg    = document.getElementById('login-message');
  const studentWrap = document.getElementById('student-classroom-code');
  const teacherDash = document.getElementById('teacher-dashboard');
  const classSetup  = document.getElementById('classroom-setup');
  const teacherView = document.getElementById('teacher-classroom-view');
  const studentDash = document.getElementById('student-dashboard');
  const studentName = document.getElementById('student-name');
  const teacherName = document.getElementById('teacher-name');
  const createBtn   = document.getElementById('create-classroom-btn');
  const newClassIn  = document.getElementById('new-classroom-name');
  const codeDisp    = document.getElementById('classroom-code-display');
  const progTable   = document.getElementById('student-progress-table');

  // Restore last username
  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) userIn.value = lastUser;

  // Toggle sign-up / login
  let isSignUp = false;
  function updateMode() {
    loginBtn.textContent  = isSignUp ? 'Sign Up' : 'Log In';
    toggleBtn.textContent = isSignUp ? 'Go to Log In' : 'Go to Sign Up';
    studentWrap.classList.toggle('hidden', !(isSignUp && roleSel.value==='student'));
  }
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-mode-btn';
    loginScreen.appendChild(toggleBtn);
  }
  toggleBtn.onclick = ()=> { isSignUp = !isSignUp; updateMode(); };
  roleSel.onchange  = updateMode;
  updateMode();

  logoutBtn.style.display = 'none';
  logoutBtn.onclick = ()=> {
    localStorage.removeItem('currentUser');
    location.reload();
  };

  loginBtn.onclick = async () => {
    loginMsg.textContent = "";

    const email = userIn.value.trim();
    const password = passIn.value;
    const role = roleSel.value;
    const code = classIn.value.trim();

    // Basic front‐end check:
    if (!email || !password || (signUpMode && role==="student" && !code)) {
      loginMsg.textContent = "Complete all fields.";
      return;
    }

    try {
      let cred;
      if (signUpMode) {
        // Create in Firebase:
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in via Firebase:
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      console.log("🔐 Firebase Auth success:", cred.user);

      // Mirror them into localStorage so your old dashboards/data code still works:
      if (!setupUserInLocalStorage(email, role, code)) {
        // e.g. bad classroom code for student
        return;
      }

      // Now show the correct view:
      if (email === "magiccaloriecam@gmail.com") {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("admin-dashboard").classList.remove("hidden");
      }
      else if (role === "teacher") {
        document.getElementById("teacher-name").textContent = email;
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("teacher-dashboard").classList.remove("hidden");
        renderTeacher(email);
      } else {
        document.getElementById("student-name").textContent = email;
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("student-dashboard").classList.remove("hidden");
        renderStudent(code, email);
      }

      logoutBtn.style.display = "block";
    } catch (err) {
      console.error("❌ Auth error:", err);
      loginMsg.textContent = err.message.replace("Firebase: ", "");
    }
  };

    const users = getUsers();
    if (isSignUp) {
      if (users[u]) { loginMsg.textContent='User exists.'; return; }
      users[u] = {
        password: p,
        role: r,
        progress: {},
        classrooms: r==='teacher'?[]:undefined,
        classroomCode: r==='student'?c:undefined
      };
      if (r==='student') {
        const classes = getClasses();
        classes[c].students.push(u);
        saveClasses(classes);
      }
      saveUsers(users);
      localStorage.setItem('lastUser', u);
      localStorage.setItem('currentUser', JSON.stringify({username:u,role:r}));
      enterDash(u, r);
    } else {
      if (users[u] && users[u].password===p && users[u].role===r) {
        localStorage.setItem('lastUser', u);
        localStorage.setItem('currentUser', JSON.stringify({username:u,role:r}));
        enterDash(u, r);
      } else {
        loginMsg.textContent='Incorrect credentials.';
      }
    }
  };

  function enterDash(u, r) {
    logoutBtn.style.display = 'block';
    loginScreen.classList.add('hidden');
    if (r==='teacher') {
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
    const name = newClassIn.value.trim();
    if (!name) return;
    const newCode = 'C'+(100000 + Math.floor(Math.random()*900000));
    const classes = getClasses();
    classes[newCode] = {
      name,
      teacher: teacherName.textContent,
      students: [],
      drills: defaultDrills.slice(),
      customDrills: {}
    };
    saveClasses(classes);
    const users = getUsers();
    users[teacherName.textContent].classrooms.push(newCode);
    saveUsers(users);
    codeDisp.textContent = `New Code: ${newCode}`;
    renderTeacher(teacherName.textContent);
  };


  // ─── Drill Editor & Bulk Upload ───

  function openEditor(user, code) {
    const classes = getClasses()[code];
    const di  = document.getElementById(`date-${code}`);
    const ta  = document.getElementById(`ta-${code}`);
    const ed  = document.getElementById(`editor-${code}`);
    if (!di.value) di.value = new Date().toISOString().split('T')[0];
    ta.value = (classes.customDrills[di.value]||classes.drills).join('\n');
    document.getElementById(`all-${code}`).checked = false;
    ed.style.display = 'block';
  }
  function openBulk(user, code) {
    const inp = document.getElementById(`bulk-file-${code}`);
    inp.classList.remove('hidden');
    inp.click();
  }
  async function handleBulkUpload(evt, code) {
    const file = evt.target.files[0]; if (!file) return;
    const text = await file.text();
    const ans  = prompt(
      "Apply these drills to ALL of your classes?\n"+
      "YES=All, NO=Only this class, CANCEL=Abort"
    );
    if (!ans) { evt.target.value=''; evt.target.classList.add('hidden'); return; }
    const choice = ans.trim().toUpperCase();
    if (choice!=='YES'&&choice!=='NO') return alert('Aborted.');
    const applyAll = choice==='YES';
    const classes = getClasses();
    text.split(/\r?\n/).filter(Boolean).forEach(line=>{
      const datePart = line.split('[')[0].trim();
      const drills   = Array.from(line.matchAll(/\[([^\]]+)\]/g))
                        .map(m=>m[1].trim()).filter(Boolean);
      if (!datePart||!drills.length) return;
      if (applyAll) {
        getUsers()[getCurrentUser().username].classrooms
          .forEach(cid=> classes[cid].customDrills[datePart]=drills);
      } else {
        classes[code].customDrills[datePart]=drills;
      }
    });
    saveClasses(classes);
    evt.target.value=''; evt.target.classList.add('hidden');
    renderTeacher(getCurrentUser().username);
  }


  // ─── Student side ───

  const promptEl   = document.getElementById('prompt');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn    = document.getElementById('next-btn');

  function renderStudent(code, student) {
    buildCalendar(student, code);
    loadDrills(code, student);
  }

  // ─── NEW buildCalendar with month/year and navigation ───
  function buildCalendar(student, code) {
    const cls  = getClasses()[code];
    const prog = (getUsers()[student].progress)||{};
    const container = document.getElementById('calendar');
    container.innerHTML = '';  // clear out

    // Header with Prev/MonthName/Next
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    const hdr = document.createElement('div');
    hdr.style = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    hdr.innerHTML = `
      <button id="prev-month">&lt; Prev</button>
      <strong>${monthNames[calMonth]} ${calYear}</strong>
      <button id="next-month">Next &gt;</button>
    `;
    container.appendChild(hdr);

    // Build the days‐of‐week row
    const tbl = document.createElement('table');
    tbl.style.borderCollapse = 'collapse';
    const headerRow = document.createElement('tr');
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const th = document.createElement('th');
      th.textContent = d;
      th.style.padding = '4px';
      headerRow.appendChild(th);
    });
    tbl.appendChild(headerRow);

    // Compute first weekday and days in month
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    let tr = document.createElement('tr');

    // Empty cells before month start
    for (let i = 0; i < firstDay; i++) {
      const td = document.createElement('td');
      td.style.padding = '4px';
      tr.appendChild(td);
    }

    // Fill each day
    for (let day = 1; day <= daysInMonth; day++) {
      if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
        tbl.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = day;
      td.style.width = '24px';
      td.style.height = '24px';
      td.style.textAlign = 'center';
      td.style.cursor = 'pointer';

      const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (prog[key]) {
        td.style.background = 'lightgreen';
        td.onclick = () => alert("You've already completed this drill.");
      } else {
        td.style.background = (new Date().toISOString().split('T')[0] > key)
                            ? 'lightcoral'
                            : (new Date().toISOString().split('T')[0] === key?'lightblue':'lightgray');
        if (new Date(key) < new Date()) {
          td.onclick = () => handlePast(code, key, student);
        }
      }

      tr.appendChild(td);
    }

    tbl.appendChild(tr);
    container.appendChild(tbl);

    // Wire up Prev / Next buttons
    document.getElementById('prev-month').onclick = () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalendar(student, code);
    };
    document.getElementById('next-month').onclick = () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      buildCalendar(student, code);
    };
  }
  // ─── end buildCalendar ───

  function handlePast(code,key,student){
    const cls = getClasses()[code];
    const drills = cls.customDrills[key]||cls.drills;
    if(!confirm(`Preview for ${key}?\n\n${drills.join('\n')}\n\nProceed?`)) return;
    renderDrillsWithDate(code, drills, key, student, true);
  }
  function renderDrillsWithDate(code, drills, dateKey, student, isLate){
    let idx=0,pos=0;
    const stats=document.getElementById('student-stats');
    stats.textContent='';
    function updateAcc(){
      const spans=[...document.querySelectorAll('.char')];
      const errs=spans.filter(s=>s.classList.contains('error')).length;
      stats.textContent=`Accuracy: ${Math.round((spans.length-errs)/spans.length*100)}%`;
    }
    function loadOne(){
      promptEl.innerHTML='';
      drills[idx].split('').forEach(ch=>{
        const span=document.createElement('span');
        span.className='char'; span.textContent=ch;
        promptEl.append(span);
      });
      pos=0; mark(); feedbackEl.textContent=''; nextBtn.disabled=true;
      nextBtn.textContent = idx<drills.length-1?'Next':'Submit';
      updateAcc();
    }
    function mark(){
      document.querySelectorAll('.char').forEach(s=>s.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }
    document.onkeydown=e=>{
      if(studentDash.classList.contains('hidden')) return;
      if(e.key==='Backspace'){ e.preventDefault(); if(pos>0){ pos--; const spans=document.querySelectorAll('.char');
          spans[pos].classList.remove('correct','error'); mark(); updateAcc(); nextBtn.disabled=true; } return; }
      if(e.key.length!==1||pos>=drills[idx].length){ e.preventDefault(); return; }
      const spans=document.querySelectorAll('.char');
      spans[pos].classList.remove('current');
      if(e.key===drills[idx][pos]) spans[pos].classList.add('correct');
      else { spans[pos].classList.add('error'); feedbackEl.textContent=`Expected "${drills[idx][pos]}" got "${e.key}"`; }
      pos++; mark(); updateAcc(); if(pos>=spans.length) nextBtn.disabled=false;
    };
    nextBtn.onclick=()=>{
      const spans=document.querySelectorAll('.char');
      const corr=[...spans].filter(s=>s.classList.contains('correct')).length;
      const errs=[...spans].filter(s=>s.classList.contains('error')).length;
      const pct = Math.round((corr/spans.length)*100);
      const users=getUsers();
      users[student].progress[dateKey] = users[student].progress[dateKey]||[];
      users[student].progress[dateKey].push({drill:idx,correct:corr,errors:errs,accuracy:pct,late:isLate});
      saveUsers(users);
      if(idx<drills.length-1) { idx++; loadOne(); }
      else { buildCalendar(student, code); promptEl.textContent='Completed!'; nextBtn.disabled=true; }
    };
    loadOne();
  }
  function loadDrills(code, student){
    const today=new Date().toISOString().split('T')[0];
    const cls=getClasses()[code];
    renderDrillsWithDate(code, cls.customDrills[today]||cls.drills, today, student, false);
  }

  // ─── StartTeacherView  
  
// ─── Start Teacher View ───
function renderTeacher(t) {
  const usersData = getUsers();
  const clsData   = getClasses();
  const container = document.getElementById('student-progress-table');
  container.innerHTML = '';  // clear out any old content

  usersData[t].classrooms.forEach(code => {
    const c = clsData[code];
    if (!c) return;

    // ─── Card wrapper ───
    const card = document.createElement('div');
    card.style = 'margin-bottom:1.5em;padding:1em;border:1px solid #ccc;border-radius:4px;';

    // ─── Header row ───
    const header = document.createElement('div');
    header.style = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;';
    header.innerHTML = `
      <div>
        <strong>${c.name}</strong> (Code: ${code})
        <button class="btn secondary" id="delete-selected-${code}">
          DELETE SELECTED ASSIGNMENTS
        </button>
      </div>
      <div>
        <button class="custom-btn" data-code="${code}">Customize Drills</button>
        <button class="bulk-btn"   data-code="${code}">Bulk Upload</button>
        <button class="btn primary toggle-edit" data-code="${code}">EDIT CLASS</button>
      </div>
    `;
    card.appendChild(header);

    // ─── Hidden file input for Bulk Upload ───
    const fileInput = document.createElement('input');
    fileInput.type    = 'file';
    fileInput.id      = `bulk-file-${code}`;
    fileInput.accept  = '.txt';
    fileInput.classList.add('hidden');
    card.appendChild(fileInput);

    // ─── Drill‐editor panel ───
    const editor = document.createElement('div');
    editor.id    = `editor-${code}`;
    editor.style = 'display:none;margin-bottom:1em;';
    editor.innerHTML = `
      <label>Date: <input type="date" id="date-${code}" /></label>
      <label style="margin-left:.5em;">
        <input type="checkbox" id="all-${code}" /> All Classes
      </label><br/>
      <textarea id="ta-${code}" rows="4" style="width:100%;margin-top:.5em;"></textarea><br/>
      <button id="save-${code}" class="btn primary" style="margin-right:.5em;">Save</button>
      <button id="cancel-${code}" class="btn secondary">Cancel</button>
    `;
    card.appendChild(editor);

    // ─── Edit‐Class dropdown panel ───
    const editPanel = document.createElement('div');
    editPanel.id    = `edit-panel-${code}`;
    editPanel.style = 'display:none;border:1px solid #ddd;padding:1em;margin-bottom:1em;background:#fafafa;border-radius:4px;';
    editPanel.innerHTML = `
      <label>Rename Class:
        <input type="text" id="rename-${code}" value="${c.name}" />
      </label>
      <button class="btn primary" id="save-name-${code}" style="margin-left:.5em;">Save Name</button>
      <hr/>
      <label>Delete Student:
        <select id="delete-student-select-${code}">
          <option value="">-- choose student --</option>
          ${ (c.students||[]).map(s => `<option value="${s}">${s}</option>`).join('') }
        </select>
      </label>
      <button class="btn secondary" id="delete-student-btn-${code}" disabled>Delete Student</button>
      <hr/>
      <button class="btn" id="delete-class-${code}"
              style="background:#e74c3c;color:white;border:none;padding:.5em 1em;">
        🗑️ Delete Class
      </button>
    `;
    card.appendChild(editPanel);

    // ─── Progress table ───
    const tbl = document.createElement('table');
    tbl.style = 'width:100%;border-collapse:collapse;margin-top:1em;';
    tbl.innerHTML = `
      <tr>
        <th><input type="checkbox" id="select-all-${code}" /></th>
        <th>Student</th><th>Assignment Date</th><th>Completed Same Day?</th><th>Accuracy</th>
      </tr>
    `;
    (c.students||[]).forEach(s => {
      const prog = (usersData[s]||{}).progress||{};
      Object.entries(prog).forEach(([date, recs]) => {
        const avg    = Math.round(recs.reduce((a,r)=>a+r.accuracy,0)/recs.length);
        const late   = recs.some(r=>r.late);
        const lastTs = recs[recs.length-1].timestamp||date;
        const same   = lastTs.startsWith(date)?'YES':lastTs;
        const row = document.createElement('tr');
        if (late) row.classList.add('late-row');
        row.style.borderTop = '1px solid #eee';
        row.innerHTML = `
          <td style="text-align:center;">
            <input type="checkbox" class="del-assignment"
                   data-student="${s}" data-date="${date}" />
          </td>
          <td>${s}</td><td>${date}</td><td>${same}</td><td>${avg}%</td>
        `;
        tbl.appendChild(row);
      });
    });
    card.appendChild(tbl);

    // ─── Append card to container ───
    container.appendChild(card);

    // ─── Wire up handlers ───

    // Bulk Upload
    card.querySelector(`.bulk-btn[data-code="${code}"]`).onclick = () => fileInput.click();
    fileInput.onchange = e => handleBulkUpload(e, code);

    // Customize Drills
    card.querySelector(`.custom-btn[data-code="${code}"]`).onclick = () => {
      const ed = card.querySelector(`#editor-${code}`);
      const di = ed.querySelector(`#date-${code}`);
      const ta = ed.querySelector(`#ta-${code}`);
      if (!di.value) di.value = new Date().toISOString().slice(0,10);
      const cls   = getClasses()[code];
      const drills = cls.customDrills[di.value] || cls.drills;
      ta.value = drills.join('\n');
      ed.style.display = 'block';
    };

    // Date‐picker inside editor
    {
      const di = card.querySelector(`#date-${code}`);
      const ta = card.querySelector(`#ta-${code}`);
      di.onchange = () => {
        const cls    = getClasses()[code];
        const drills = cls.customDrills[di.value] || cls.drills;
        ta.value = drills.join('\n');
      };
    }

    // Cancel editor
    card.querySelector(`#cancel-${code}`).onclick = () => editor.style.display = 'none';

    // Save editor
    card.querySelector(`#save-${code}`).onclick = () => {
      const ed       = card.querySelector(`#editor-${code}`);
      const d        = ed.querySelector(`#date-${code}`).value;
      const lines    = ed.querySelector(`#ta-${code}`)
                         .value.split('\n').map(l=>l.trim()).filter(Boolean);
      const applyAll = ed.querySelector(`#all-${code}`).checked;
      const allClasses = getClasses();
      if (applyAll) {
        usersData[t].classrooms.forEach(cid => {
          allClasses[cid].customDrills = allClasses[cid].customDrills||{};
          allClasses[cid].customDrills[d] = lines;
        });
      } else {
        allClasses[code].customDrills = allClasses[code].customDrills||{};
        allClasses[code].customDrills[d] = lines;
      }
      saveClasses(allClasses);
      renderTeacher(t);
    };

    // Toggle EDIT CLASS panel
    card.querySelector(`.toggle-edit[data-code="${code}"]`).onclick = () => {
      editPanel.style.display = editPanel.style.display === 'none' ? 'block' : 'none';
    };

    // Rename class
    card.querySelector(`#save-name-${code}`).onclick = () => {
      const newName = card.querySelector(`#rename-${code}`).value.trim();
      if (!newName) return alert('Name cannot be empty.');
      const all = getClasses();
      all[code].name = newName;
      saveClasses(all);
      renderTeacher(t);
    };

    // Enable delete‐student button when selected
    const sel = card.querySelector(`#delete-student-select-${code}`);
    sel.onchange = () => {
      card.querySelector(`#delete-student-btn-${code}`).disabled = !sel.value;
    };

    // Delete student
    card.querySelector(`#delete-student-btn-${code}`).onclick = () => {
      const student = sel.value;
      if (!confirm(`Permanently delete student ${student}?`)) return;
      const classes = getClasses();
      classes[code].students = classes[code].students.filter(s=>s!==student);
      saveClasses(classes);
      const users = getUsers();
      delete users[student];
      saveUsers(users);
      renderTeacher(t);
    };

    // Delete entire class
    card.querySelector(`#delete-class-${code}`).onclick = () => {
      if (!confirm(`Permanently delete class “${c.name}”? This cannot be undone.`)) return;
      const classes = getClasses(); delete classes[code]; saveClasses(classes);
      const users   = getUsers();
      users[t].classrooms = users[t].classrooms.filter(c=>c!==code);
      saveUsers(users);
      renderTeacher(t);
    };

    // Delete selected assignments
    card.querySelector(`#delete-selected-${code}`).onclick = () => {
      const boxes = Array.from(card.querySelectorAll('.del-assignment:checked'));
      if (!boxes.length) return alert('No assignments selected.');
      if (!confirm(`Delete ${boxes.length} assignment(s)?`)) return;
      boxes.forEach(cb => {
        const s = cb.dataset.student, d = cb.dataset.date;
        delete usersData[s].progress[d];
      });
      saveUsers(usersData);
      renderTeacher(t);
    };

    // Select-all checkbox
    card.querySelector(`#select-all-${code}`).onchange = e => {
      card.querySelectorAll('.del-assignment')
          .forEach(cb => cb.checked = e.target.checked);
    };
  });
}
// ─── End renderTeacher ───
  


  // ─── StartAdmin Admin ───
  function enterAdmin(){
    logoutBtn.style.display='block';
    const existing = document.getElementById('admin');
    if(existing) existing.remove();
    const panel = document.createElement('div');
    panel.id='admin'; panel.style.padding='1em';
    panel.innerHTML = `
      <h2>Admin Panel</h2>
      <button id="cleanup-students">Delete orphan students</button>
      <button id="cleanup-teachers">Delete orphan teachers</button>
      <table border="1" style="width:100%;margin-top:1em;">
        <tr><th>User</th><th>Role</th><th>Info</th><th>Action</th></tr>
        <tbody id="admin-body"></tbody>
      </table>`;
    document.body.appendChild(panel);

    const users   = getUsers();
    const classes = getClasses();
    const valid   = new Set(Object.keys(classes));
    const body    = document.getElementById('admin-body');
    body.innerHTML='';

    Object.entries(users).forEach(([u,d])=>{
      let info = d.role==='teacher' ? (d.classrooms||[]).join(', ') : d.classroomCode||'';
      if (d.role==='student' && !valid.has(d.classroomCode)) info = `<span style="color:red">${info||'none'}</span>`;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u}</td><td>${d.role}</td><td>${info}</td>
                      <td><button data-user="${u}" class="del-user">Delete</button></td>`;
      body.appendChild(tr);
    });

    document.querySelectorAll('.del-user').forEach(b=>{
      b.onclick = ()=>{
        const u=b.dataset.user;
        if(!confirm(`Delete ${u}?`)) return;
        deleteUser(u);
        enterAdmin();
      };
    });
    document.getElementById('cleanup-students').onclick = ()=>{
      if(!confirm('Delete orphan students?')) return;
      const us=getUsers();
      Object.entries(us).forEach(([u,d])=>{
        if(d.role==='student' && !valid.has(d.classroomCode)) delete us[u];
      });
      saveUsers(us); enterAdmin();
    };
    document.getElementById('cleanup-teachers').onclick = ()=>{
      if(!confirm('Delete orphan teachers?')) return;
      const us=getUsers();
      Object.entries(us).forEach(([u,d])=>{
        if(d.role==='teacher' && (!d.classrooms||d.classrooms.length===0)) delete us[u];
      });
      saveUsers(us); enterAdmin();
    };
  }

  function deleteUser(u){
    const us = getUsers(), cl=getClasses();
    if (us[u].role==='teacher') {
      us[u].classrooms.forEach(c=>delete cl[c]);
      saveClasses(cl);
    } else {
      const cc=us[u].classroomCode;
      if (cl[cc]) cl[cc].students=cl[cc].students.filter(x=>x!==u);
      saveClasses(cl);
    }
    delete us[u];
    saveUsers(us);
  }

// end initApp
