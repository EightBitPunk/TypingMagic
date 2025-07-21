
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
    if (role === "student") {
      const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
      if (!classrooms[classroomCode]) {
        loginMessage.textContent = "Invalid classroom code.";
        return;
      }
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
