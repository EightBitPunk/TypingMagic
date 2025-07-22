// Debug
console.log("🔥 app.js loaded! DOMContentLoaded? ", document.readyState);

const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const toggleModeBtn = document.createElement("button");
toggleModeBtn.id = "toggle-mode-btn";
loginScreen.appendChild(toggleModeBtn);

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");
const loginMessage = document.getElementById("login-message");
const classroomCodeInput = document.getElementById("classroom-code");
const studentClassroomCode = document.getElementById("student-classroom-code");

const teacherDashboard = document.getElementById("teacher-dashboard");
const studentDashboard = document.getElementById("student-dashboard");
const teacherNameEl = document.getElementById("teacher-name");
const studentNameEl = document.getElementById("student-name");

const promptEl = document.getElementById("prompt");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const studentStats = document.getElementById("student-stats");

const classroomSetup = document.getElementById("classroom-setup");
const createClassroomBtn = document.getElementById("create-classroom-btn");
const newClassroomNameInput = document.getElementById("new-classroom-name");
const classroomCodeDisplay = document.getElementById("classroom-code-display");
const teacherClassroomView = document.getElementById("teacher-classroom-view");
const studentProgressTable = document.getElementById("student-progress-table");

let current = 0;
let cursorPos = 0;
let currentDate = new Date().toISOString().split("T")[0];
let isSignUp = false;

// Utils
function generateClassroomCode() {
  return "C" + Math.floor(100000 + Math.random() * 900000);
}
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}
function saveUsers(u) {
  localStorage.setItem("users", JSON.stringify(u));
}
function getClasses() {
  return JSON.parse(localStorage.getItem("classrooms") || "{}");
}
function saveClasses(c) {
  localStorage.setItem("classrooms", JSON.stringify(c));
}

// Toggle Login/Sign Up
function updateModeUI() {
  loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleModeBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
  const showCode = isSignUp && roleSelect.value === "student";
  studentClassroomCode.classList.toggle("hidden", !showCode);
}
roleSelect.addEventListener("change", updateModeUI);
toggleModeBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  updateModeUI();
});
updateModeUI();

// Login or Sign-Up
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;
  const code = classroomCodeInput.value.trim();

  if (!name || !password || (isSignUp && role === "student" && !code)) {
    loginMessage.textContent = "Please fill in all required fields.";
    return;
  }

  const users = getUsers();

  if (isSignUp) {
    if (users[name]) {
      loginMessage.textContent = "User already exists.";
      return;
    }

    users[name] = {
      password,
      role,
      classroomCode: code,
      progress: {},
      ...(role === "teacher" ? { classrooms: [] } : {})
    };

    if (role === "student") {
      const classes = getClasses();
      if (!classes[code]) {
        loginMessage.textContent = "Invalid classroom code.";
        delete users[name];
        return;
      }
      classes[code].students.push(name);
      saveClasses(classes);
    }

    saveUsers(users);
    proceedToDashboard(name, role);

  } else {
    if (users[name] && users[name].password === password && users[name].role === role) {
      proceedToDashboard(name, role);
    } else {
      loginMessage.textContent = "Incorrect credentials.";
    }
  }
});

function proceedToDashboard(name, role) {
  loginScreen.classList.add("hidden");
  if (role === "teacher") {
    teacherNameEl.textContent = name;
    teacherDashboard.classList.remove("hidden");
    updateTeacherDashboard();
  } else {
    studentNameEl.textContent = name;
    studentDashboard.classList.remove("hidden");
    loadDrill(0);
  }
}

// TEACHER DASHBOARD
function updateTeacherDashboard() {
  const users = getUsers();
  const classes = getClasses();
  const teacher = teacherNameEl.textContent;
  const codes = users[teacher].classrooms || [];

  if (codes.length === 0) {
    teacherClassroomView.classList.add("hidden");
    classroomCodeDisplay.textContent = "";
    return;
  }

  teacherClassroomView.classList.remove("hidden");

  let html = "";
  codes.forEach(code => {
    const room = classes[code];
    if (!room) return;
    html += `<h3>${room.name} (Code: ${code}) 
      <span class="delete-class" data-code="${code}" title="Delete Class" style="cursor:pointer;color:red;margin-left:10px;">🗑️</span>
    </h3>
    <table>
      <tr><th>Student</th><th>Date</th><th>Drills</th><th>Accuracy</th><th>Errors</th></tr>`;

    room.students.forEach(s => {
      const prog = users[s]?.progress;
      if (!prog) return;
      Object.entries(prog).forEach(([d, arr]) => {
        const total = arr.length;
        const avg = Math.round(arr.reduce((a, x) => a + x.accuracy, 0) / total);
        const errs = arr.reduce((a, x) => a + x.errors, 0);
        html += `<tr><td>${s}</td><td>${d}</td><td>${total}</td><td>${avg}%</td><td>${errs}</td></tr>`;
      });
    });

    html += `</table>`;
  });

  studentProgressTable.innerHTML = html;

  // Attach delete buttons
  document.querySelectorAll(".delete-class").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      if (!confirm(`Delete class ${code}? This cannot be undone.`)) return;
      deleteClassroom(code);
    });
  });
}

function deleteClassroom(code) {
  const users = getUsers();
  const classes = getClasses();
  const teacher = teacherNameEl.textContent;

  // Remove class
  delete classes[code];

  // Remove from teacher's list
  users[teacher].classrooms = users[teacher].classrooms.filter(c => c !== code);

  // Remove code from students
  Object.values(users).forEach(user => {
    if (user.classroomCode === code) user.classroomCode = "";
  });

  saveUsers(users);
  saveClasses(classes);
  updateTeacherDashboard();
}

// Create new classroom
createClassroomBtn.addEventListener("click", () => {
  const cname = newClassroomNameInput.value.trim();
  if (!cname) {
    classroomCodeDisplay.textContent = "Enter a classroom name.";
    return;
  }
  const code = generateClassroomCode();
  const classes = getClasses();
  classes[code] = {
    name: cname,
    teacher: teacherNameEl.textContent,
    students: []
  };
  saveClasses(classes);

  const users = getUsers();
  users[teacherNameEl.textContent].classrooms.push(code);
  saveUsers(users);

  classroomCodeDisplay.textContent = `New Code: ${code}`;
  updateTeacherDashboard();
});

// STUDENT DRILLS
function updateCurrentSpan() {
  const spans = promptEl.querySelectorAll("span.char");
  spans.forEach(s => s.classList.remove("current"));
  if (cursorPos < spans.length) spans[cursorPos].classList.add("current");
}
function loadDrill(idx) {
  current = idx;
  cursorPos = 0;
  promptEl.innerHTML = "";
  drills[current].split("").forEach(ch => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    promptEl.appendChild(span);
  });
  updateCurrentSpan();
  feedbackEl.textContent = "";
  nextBtn.disabled = true;
  promptEl.focus();
}
document.addEventListener("keydown", e => {
  if (studentDashboard.classList.contains("hidden")) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const spans = promptEl.querySelectorAll("span.char");

  if (e.key === "Backspace") {
    e.preventDefault();
    if (cursorPos > 0) {
      cursorPos--;
      spans[cursorPos].classList.remove("correct", "error");
      updateCurrentSpan();
      feedbackEl.textContent = "";
      nextBtn.disabled = true;
    }
    return;
  }
  if (e.key.length !== 1 || cursorPos >= spans.length) {
    e.preventDefault();
    return;
  }

  const expected = drills[current][cursorPos];
  spans[cursorPos].classList.remove("current");
  if (e.key === expected) {
    spans[cursorPos].classList.add("correct");
    feedbackEl.textContent = "";
  } else {
    spans[cursorPos].classList.add("error");
    feedbackEl.textContent = `Expected "${expected}", got "${e.key}"`;
  }

  cursorPos++;
  updateCurrentSpan();
  nextBtn.disabled = (cursorPos < spans.length);
});
nextBtn.addEventListener("click", () => {
  const spans = promptEl.querySelectorAll("span.char");
  const correct = [...spans].filter(s => s.classList.contains("correct")).length;
  const errors = [...spans].filter(s => s.classList.contains("error")).length;
  const total = spans.length;
  const acc = Math.round((correct / total) * 100);

  const users = getUsers();
  const user = users[studentNameEl.textContent];
  user.progress[currentDate] ||= [];
  user.progress[currentDate].push({ drill: current, correct, errors, accuracy: acc });
  saveUsers(users);

  studentStats.textContent = `Drill ${current + 1} complete. Accuracy: ${acc}%. Errors: ${errors}`;
  if (current + 1 < drills.length) loadDrill(current + 1);
  else {
    promptEl.textContent = "You've completed today's prompts!";
    nextBtn.style.display = "none";
  }
});
