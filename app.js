
// Drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
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
const teacherClassroomName = document.getElementById("teacher-classroom-name");
const sortOption = document.getElementById("sort-option");
const studentProgressTable = document.getElementById("student-progress-table");

// Mode toggle
let isSignUp = true;
const toggleModeBtn = document.createElement("button");
toggleModeBtn.textContent = "Switch to Log In";
toggleModeBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  toggleModeBtn.textContent = isSignUp ? "Switch to Log In" : "Switch to Sign Up";
  loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
});
loginScreen.appendChild(toggleModeBtn);

// State
let current = 0;
let cursorPos = 0;
let currentUser = null;
let currentClassroom = null;
let currentDate = new Date().toISOString().split("T")[0];

// Utility
function generateClassroomCode() {
  return "C" + Math.floor(100000 + Math.random() * 900000);
}

// Ensure classroom code is visible by default for student
function updateClassroomCodeVisibility() {
  if (roleSelect.value === "student") {
    studentClassroomCode.classList.remove("hidden");
  } else {
    studentClassroomCode.classList.add("hidden");
  }
}
updateClassroomCodeVisibility();
roleSelect.addEventListener("change", updateClassroomCodeVisibility);

// Login
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;
  const classroomCode = classroomCodeInput.value.trim();

  if (!name || !password || (role === "student" && !classroomCode)) {
    loginMessage.textContent = "Please fill in all required fields.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (isSignUp) {
    if (users[name]) {
      loginMessage.textContent = "User already exists. Please log in.";
      return;
    }
    if (role === "student") {
      const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
      if (!classrooms[classroomCode]) {
        loginMessage.textContent = "Invalid classroom code.";
        return;
      }
      classrooms[classroomCode].students.push(name);
      localStorage.setItem("classrooms", JSON.stringify(classrooms));
    }
    users[name] = { password, role, classroomCode, progress: {} };
    localStorage.setItem("users", JSON.stringify(users));
    currentUser = users[name];
    proceedToDashboard(name, role);
  } else {
    if (!users[name] || users[name].password !== password || users[name].role !== role) {
      loginMessage.textContent = "Incorrect credentials.";
      return;
    }
    currentUser = users[name];
    proceedToDashboard(name, role);
  }
});

function proceedToDashboard(name, role) {
  loginScreen.classList.add("hidden");

  if (role === "teacher") {
    teacherNameEl.textContent = name;
    teacherDashboard.classList.remove("hidden");

    const user = JSON.parse(localStorage.getItem("users"))[name];
    const code = user.classroomCode;
    if (code) {
      const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
      const classroom = classrooms[code];
      if (classroom) {
        classroomCodeDisplay.textContent = `Classroom Code: ${code}`;
        teacherClassroomName.textContent = classroom.name;
        teacherClassroomView.classList.remove("hidden");
        currentClassroom = code;
        updateTeacherDashboard();
      }
    }
  } else {
    studentNameEl.textContent = name;
    studentDashboard.classList.remove("hidden");
    loadDrill(0);
  }
}

// Classroom Creation
createClassroomBtn.addEventListener("click", () => {
  const classroomName = newClassroomNameInput.value.trim();
  if (!classroomName) return;

  const code = generateClassroomCode();
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  classrooms[code] = { name: classroomName, teacher: teacherNameEl.textContent, students: [] };
  localStorage.setItem("classrooms", JSON.stringify(classrooms));

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  users[teacherNameEl.textContent].classroomCode = code;
  localStorage.setItem("users", JSON.stringify(users));

  classroomCodeDisplay.textContent = `Classroom Code: ${code}`;
  teacherClassroomName.textContent = classroomName;
  teacherClassroomView.classList.remove("hidden");
  currentClassroom = code;

  updateTeacherDashboard();
});

// Drill Rendering
function renderPrompt() {
  promptEl.innerHTML = "";
  drills[current].split("").forEach(char => {
    const span = document.createElement("span");
    span.classList.add("char");
    span.textContent = char;
    promptEl.appendChild(span);
  });
}

function updateCurrentSpan() {
  const spans = promptEl.querySelectorAll("span.char");
  spans.forEach(s => s.classList.remove("current"));
  if (cursorPos < spans.length) {
    spans[cursorPos].classList.add("current");
  }
}

function updateLiveStats() {
  const spans = promptEl.querySelectorAll("span.char");
  const correct = Array.from(spans).filter(s => s.classList.contains("correct")).length;
  const errors = Array.from(spans).filter(s => s.classList.contains("error")).length;
  const total = spans.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  studentStats.innerHTML = `Accuracy: ${accuracy}% | Errors: ${errors}`;
}

function loadDrill(index) {
  current = index;
  cursorPos = 0;
  renderPrompt();
  updateCurrentSpan();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
  updateLiveStats();
}

// Typing Logic
document.addEventListener("keydown", (e) => {
  if (studentDashboard.classList.contains("hidden")) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const spans = promptEl.querySelectorAll("span.char");

  if (e.key === "Backspace") {
    e.preventDefault();
    if (cursorPos > 0) {
      cursorPos--;
      spans[cursorPos].classList.remove("correct", "error");
      updateCurrentSpan();
      feedbackEl.innerHTML = "";
      if (!nextBtn.disabled) nextBtn.disabled = true;
      updateLiveStats();
    }
    return;
  }

  if (e.key.length !== 1 || cursorPos >= spans.length) {
    e.preventDefault();
    return;
  }

  const expected = drills[current][cursorPos];
  const pressed = e.key;

  spans[cursorPos].classList.remove("current");

  if (pressed === expected) {
    spans[cursorPos].classList.add("correct");
    feedbackEl.innerHTML = "";
  } else {
    spans[cursorPos].classList.add("error");

    let msg;
    if (pressed.toLowerCase() === expected.toLowerCase()) {
      msg = expected === expected.toUpperCase()
        ? `Hold SHIFT to capitalize <span class="expected">${expected}</span> instead of lowercase <span class="wrong">${pressed}</span>.`
        : `Use lowercase <span class="expected">${expected}</span>, not <span class="wrong">${pressed}</span>.`;
    } else {
      msg = expected === " "
        ? `You entered <span class="wrong">${pressed}</span>, but we were expecting a space.`
        : `You entered <span class="wrong">${pressed}</span>, but expected <span class="expected">${expected}</span>.`;
    }

    feedbackEl.innerHTML = msg;
    promptEl.classList.add("shake");
    promptEl.addEventListener("animationend", () => promptEl.classList.remove("shake"), { once: true });
  }

  cursorPos++;
  updateCurrentSpan();
  updateLiveStats();

  if (cursorPos >= spans.length) {
    nextBtn.disabled = false;
  }
});

// Next Drill
nextBtn.addEventListener("click", () => {
  const spans = promptEl.querySelectorAll("span.char");
  const correct = Array.from(spans).filter(s => s.classList.contains("correct")).length;
  const errors = Array.from(spans).filter(s => s.classList.contains("error")).length;
  const total = spans.length;
  const accuracy = Math.round((correct / total) * 100);

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const name = studentNameEl.textContent;
  const user = users[name];

  if (!user.progress[currentDate]) {
    user.progress[currentDate] = [];
  }

  user.progress[currentDate].push({ drill: current, correct, errors, accuracy });
  localStorage.setItem("users", JSON.stringify(users));

  studentStats.innerHTML = `Drill ${current + 1} complete. Accuracy: ${accuracy}%. Errors: ${errors}`;

  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "You've completed your day's typing prompts!";
    nextBtn.style.display = "none";
  }
});

// Teacher Dashboard Sorting
sortOption.addEventListener("change", updateTeacherDashboard);

function updateTeacherDashboard() {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const classroom = classrooms[currentClassroom];
  const students = Object.entries(users).filter(([name, data]) => data.role === "student" && data.classroomCode === currentClassroom);

  let sortedStudents = students;
  if (sortOption.value === "name") {
    sortedStudents = students.sort((a, b) => {
      const lastA = a[0].split(" ").slice(-1)[0].toLowerCase();
      const lastB = b[0].split(" ").slice(-1)[0].toLowerCase();
      return lastA.localeCompare(lastB);
    });
  }

  let html = "<table><tr><th>Name</th><th>Date</th><th>Drills</th><th>Accuracy</th><th>Errors</th></tr>";
  sortedStudents.forEach(([name, data]) => {
    const progress = data.progress || {};
    Object.entries(progress).forEach(([date, drills]) => {
      const totalDrills = drills.length;
      const avgAccuracy = Math.round(drills.reduce((sum, d) => sum + d.accuracy, 0) / totalDrills);
      const totalErrors = drills.reduce((sum, d) => sum + d.errors, 0);
      html += `<tr><td>${name}</td><td>${date}</td><td>${totalDrills}</td><td>${avgAccuracy}%</td><td>${totalErrors}</td></tr>`;
    });
  });
  html += "</table>";
  studentProgressTable.innerHTML = html;
}
