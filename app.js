# The user's request is about fixing a JavaScript file (app.js), but since this environment only supports Python,
# I will provide the corrected JavaScript code as a string so the user can copy and paste it into their app.js file.

corrected_app_js = """
// Drill sentences
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
const teacherClassroomName = document.getElementById("teacher-classroom-name");
const sortOption = document.getElementById("sort-option");
const studentProgressTable = document.getElementById("student-progress-table");

// State
let current = 0;
let cursorPos = 0;
let currentUser = null;
let currentClassroom = null;
let currentDate = new Date().toISOString().split("T")[0];
let isSignUp = false;

// Utility
function generateClassroomCode() {
  return "C" + Math.floor(100000 + Math.random() * 900000);
}

// Toggle between Sign Up and Log In
function updateModeUI() {
  loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleModeBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
  const showClassroomCode = isSignUp && roleSelect.value === "student";
  studentClassroomCode.classList.toggle("hidden", !showClassroomCode);
}

// Role toggle
roleSelect.addEventListener("change", updateModeUI);
toggleModeBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  updateModeUI();
});

// Initial UI setup
isSignUp = false;
updateModeUI();

// Login or Sign Up
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;
  const classroomCode = classroomCodeInput.value.trim();

  if (!name || !password || (isSignUp && role === "student" && !classroomCode)) {
    loginMessage.textContent = "Please fill in all required fields.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (isSignUp) {
    if (users[name]) {
      loginMessage.textContent = "User already exists.";
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
    if (users[name] && users[name].password === password && users[name].role === role) {
      currentUser = users[name];
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

// Classroom Creation
createClassroomBtn.addEventListener("click", () => {
  const classroomName = newClassroomNameInput.value.trim();
  if (!classroomName) return;

  const code = generateClassroomCode();
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  classrooms[code] = { name: classroomName, teacher: teacherNameEl.textContent, students: [] };
  localStorage.setItem("classrooms", JSON.stringify(classrooms));

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[teacherNameEl.textContent].classrooms) {
    users[teacherNameEl.textContent].classrooms = [];
  }
  users[teacherNameEl.textContent].classrooms.push(code);
  localStorage.setItem("users", JSON.stringify(users));

  updateTeacherDashboard();
});

function updateTeacherDashboard() {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  const teacher = teacherNameEl.textContent;
  const teacherUser = users[teacher];
  const codes = teacherUser.classrooms || [];

  let html = "";
  codes.forEach(code => {
    const classroom = classrooms[code];
    if (!classroom) return;
    html += `<h3>${classroom.name} (Code: ${code})</h3>`;
    html += "<table><tr><th>Student</th><th>Date</th><th>Drills</th><th>Accuracy</th><th>Errors</th></tr>";
    classroom.students.forEach(studentName => {
      const student = users[studentName];
      if (!student || !student.progress) return;
      Object.entries(student.progress).forEach(([date, drills]) => {
        const totalDrills = drills.length;
        const avgAccuracy = Math.round(drills.reduce((sum, d) => sum + d.accuracy, 0) / totalDrills);
        const totalErrors = drills.reduce((sum, d) => sum + d.errors, 0);
        html += `<tr><td>${studentName}</td><td>${date}</td><td>${totalDrills}</td><td>${avgAccuracy}%</td><td>${totalErrors}</td></tr>`;
      });
    });
    html += "</table>";
  });

  studentProgressTable.innerHTML = html;
}

// Typing logic
function updateCurrentSpan() {
  const spans = promptEl.querySelectorAll("span.char");
  spans.forEach(s => s.classList.remove("current"));
  if (cursorPos < spans.length) {
    spans[cursorPos].classList.add("current");
  }
}

function loadDrill(index) {
  current = index;
  cursorPos = 0;
  promptEl.innerHTML = "";
  drills[current].split("").forEach(char => {
    const span = document.createElement("span");
    span.classList.add("char");
    span.textContent = char;
    promptEl.appendChild(span);
  });
  updateCurrentSpan();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
}

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
    feedbackEl.innerHTML = `Expected "${expected}", but got "${pressed}".`;
  }

  cursorPos++;
  updateCurrentSpan();

  if (cursorPos >= spans.length) {
    nextBtn.disabled = false;
  }
});

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
"""

# Save the corrected JavaScript to a file so the user can download it
with open("app.js", "w") as f:
    f.write(corrected_app_js)

"app.js has been updated and saved with the requested fixes."

