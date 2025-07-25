// Version 0.1.32

window.addEventListener("DOMContentLoaded", () => {
  showVersion();
  initApp();
});

function showVersion() {
  document.querySelectorAll('.version-badge').forEach(el => el.remove());
  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.textContent = 'version 0.1.32';
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

  const lastUser = localStorage.getItem('lastUser');
  if (lastUser) document.getElementById('username').value = lastUser;

  const getUsers    = () => JSON.parse(localStorage.getItem('users')    || '{}');
  const saveUsers   = u  => localStorage.setItem('users', JSON.stringify(u));
  const getClasses  = () => JSON.parse(localStorage.getItem('classrooms')|| '{}');
  const saveClasses = c  => localStorage.setItem('classrooms', JSON.stringify(c));

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.style.display = 'none';
  logoutBtn.onclick = () => {
    localStorage.removeItem('currentUser');
    location.reload();
  };

  // DOM refs (login/teacher/student/admin) ...
  // [the rest of your initApp code remains identical until we reach the student drill logic]

  // ... renderStudent, buildCalendar, handlePast remain the same ...

  function renderDrillsWithDate(drills, dateKey, student, isLate) {
    let idx=0, pos=0;
    const statsDiv = document.getElementById('student-stats');
    statsDiv.textContent = '';

    function updateAcc() {
      const spans = document.querySelectorAll('.char');
      const errs  = [...spans].filter(s=>s.classList.contains('error')).length;
      const pct   = Math.max(0, Math.round((spans.length-errs)/spans.length*100));
      statsDiv.textContent = `Accuracy: ${pct}%`;
    }

    function loadOne() {
      promptEl.innerHTML = '';
      drills[idx].split('').forEach(ch => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        promptEl.appendChild(s);
      });
      pos = 0;
      mark();
      feedbackEl.textContent = '';
      nextBtn.disabled = true;
      // set text and style for Next vs Submit
      if (idx < drills.length - 1) {
        nextBtn.textContent = 'Next';
        nextBtn.className = 'btn primary';
      } else {
        nextBtn.textContent = 'Submit';
        nextBtn.className = 'btn secondary';
      }
      updateAcc();
    }

    function mark() {
      document.querySelectorAll('.char').forEach(s=>s.classList.remove('current'));
      document.querySelectorAll('.char')[pos]?.classList.add('current');
    }

    document.onkeydown = e => {
      if (studentDash.classList.contains('hidden')) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (pos > 0) {
          pos--;
          const spans = document.querySelectorAll('.char');
          spans[pos].classList.remove('correct','error');
          mark(); updateAcc(); nextBtn.disabled = true;
        }
        return;
      }
      if (e.key.length !== 1 || pos >= drills[idx].length) {
        e.preventDefault();
        return;
      }
      const spans = document.querySelectorAll('.char');
      spans[pos].classList.remove('current');
      if (e.key === drills[idx][pos]) {
        spans[pos].classList.add('correct');
        feedbackEl.textContent = '';
      } else {
        spans[pos].classList.add('error');
        feedbackEl.textContent = `Expected "${drills[idx][pos]}" got "${e.key}"`;
      }
      pos++;
      mark();
      updateAcc();
      if (pos >= spans.length) nextBtn.disabled = false;
    };

    nextBtn.onclick = () => {
      // record current drill
      const spans = document.querySelectorAll('.char');
      const corr  = [...spans].filter(s=>s.classList.contains('correct')).length;
      const errs  = [...spans].filter(s=>s.classList.contains('error')).length;
      const pct   = Math.max(0, Math.round((corr/spans.length)*100));
      const users = getUsers();
      const prog  = users[student].progress;
      if (!prog[dateKey]) prog[dateKey] = [];
      prog[dateKey].push({drill:idx, correct:corr, errors:errs, accuracy:pct, late:isLate});
      saveUsers(users);

      // immediately update calendar
      buildCalendar(student, code);

      if (idx < drills.length - 1) {
        idx++;
        loadOne();
      } else {
        // final Submit: keep button visible but disabled
        promptEl.textContent = "Typing Drill Completed!";
        nextBtn.disabled = true;
      }
    };

    // start
    loadOne();
  }

  function loadDrills(code, student) {
    const cls = getClasses()[code];
    const today = new Date().toISOString().split('T')[0];
    renderDrillsWithDate(cls.customDrills[today]||cls.drills, today, student, false);
  }

  // ... rest of admin logic unchanged ...
}
