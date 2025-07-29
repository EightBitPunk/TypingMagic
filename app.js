// TeachType App Logic v0.1.44

const version = "0.1.44";
document.getElementById("login-message").textContent = `Version ${version}`;

let currentUser = null;
let currentPromptIndex = 0;
let currentDrills = [];
let currentDate = new Date().toISOString().split("T")[0];

// UI Sections
const loginScreen = document.getElementById("login-screen");
const teacherDashboard = document.getElementById("teacher-dashboard");
const studentDashboard = document.getElementById("student-dashboard");
const adminDashboard = document.getElementById("admin-dashboard");

// Event Listeners
document.getElementById("role").addEventListener("change", () => {
  document.getElementById("student-classroom-code").classList.toggle("hidden",
    document.getElementById("role").value !== "student");
});

document.getElementById("login-btn").addEventListener("click", loginUser);
document.getElementById("toggle-mode-btn").addEventListener("click", toggleMode);
document.getElementById("create-classroom-btn").addEventListener("click", createClassroom);
document.getElementById("logout-btn").addEventListener("click", logoutUser);
document.getElementById("next-btn").addEventListener("click", nextPrompt);
document.getElementById("bulk-upload-btn")?.addEventListener("click", () => {
  document.getElementById("bulk-upload-file").click();
});
document.getElementById("bulk-upload-file")?.addEventListener("change", handleBulkUpload);

// Core Login Logic
function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const classroomCode = document.getElementById("classroom-code").value.trim();

  if (!username || !password || (role === "student" && !classroomCode)) {
    showError("Please fill in all required fields.");
    return;
  }

  currentUser = { username, role, classroomCode };
  loginScreen.classList.add("hidden");
  document.getElementById("logout-btn").style.display = "block";

  if (role === "teacher") {
    showTeacherDashboard();
  } else if (role === "student") {
    showStudentDashboard();
  } else if (role === "admin") {
    alert("Welcome, Admin!");
  }
}

function toggleMode() {
  const btn = document.getElementById("toggle-mode-btn");
  btn.textContent = btn.textContent === "Sign Up" ? "Back to Login" : "Sign Up";
}

function logoutUser() {
  currentUser = null;
  loginScreen.classList.remove("hidden");
  studentDashboard.classList.add("hidden");
  teacherDashboard.classList.add("hidden");
  document.getElementById("logout-btn").style.display = "none";
  location.reload();
}

// Error Display
function showError(message) {
  document.getElementById("login-message").textContent = message;
}

// Teacher Dashboard
function showTeacherDashboard() {
  teacherDashboard.classList.remove("hidden");
  document.getElementById("teacher-name").textContent = currentUser.username;
  loadTeacherClasses();
}

function createClassroom() {
  const name = document.getElementById("new-classroom-name").value.trim();
  if (!name) return;
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  localStorage.setItem(`class-${code}`, JSON.stringify({ name, teacher: currentUser.username }));
  loadTeacherClasses();
}

function loadTeacherClasses() {
  const container = document.getElementById("student-progress-table");
  container.innerHTML = "";
  const classes = Object.entries(localStorage)
    .filter(([k]) => k.startsWith("class-"))
    .map(([code, data]) => [code.replace("class-", ""), JSON.parse(data)])
    .filter(([, data]) => data.teacher === currentUser.username);

  if (classes.length === 0) return;

  document.getElementById("teacher-classroom-view").classList.remove("hidden");

  classes.forEach(([code, data]) => {
    const div = document.createElement("div");
    div.innerHTML = `<h4>${data.name} (${code})</h4>`;
    const students = Object.entries(localStorage)
      .filter(([k]) => k.startsWith("user-"))
      .map(([k, v]) => JSON.parse(v))
      .filter(u => u.role === "student" && u.classroomCode === code);

    students.forEach(student => {
      div.innerHTML += `<div>${student.username}</div>`;
    });

    container.appendChild(div);
  });
}

// Student Dashboard
function showStudentDashboard() {
  studentDashboard.classList.remove("hidden");
  document.getElementById("student-name").textContent = currentUser.username;
  loadDrillsForStudent(currentDate);
  renderCalendar();
}

function loadDrillsForStudent(date) {
  const key = `drills-${currentUser.classroomCode}-${date}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    document.getElementById("prompt").textContent = "No drill for today.";
    return;
  }

  currentDrills = JSON.parse(stored);
  currentPromptIndex = 0;
  showPrompt(currentDrills[currentPromptIndex]);
  document.getElementById("next-btn").disabled = false;
}

function showPrompt(prompt) {
  const promptEl = document.getElementById("prompt");
  const feedbackEl = document.getElementById("feedback");
  promptEl.textContent = prompt;
  feedbackEl.innerHTML = `
    <input id="typing-input" type="text" />
    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
      <span id="error-count">Errors: 0</span>
      <span id="accuracy">Accuracy: 100%</span>
    </div>
  `;
  document.getElementById("typing-input").addEventListener("input", checkTyping);
}

function checkTyping() {
  const prompt = currentDrills[currentPromptIndex];
  const typed = document.getElementById("typing-input").value;
  const errors = typed.split("").filter((c, i) => c !== prompt[i]).length;
  const acc = Math.max(0, Math.floor(((prompt.length - errors) / prompt.length) * 100));
  document.getElementById("error-count").textContent = `Errors: ${errors}`;
  document.getElementById("accuracy").textContent = `Accuracy: ${acc}%`;
}

function nextPrompt() {
  currentPromptIndex++;
  if (currentPromptIndex < currentDrills.length) {
    showPrompt(currentDrills[currentPromptIndex]);
  } else {
    document.getElementById("prompt").textContent = "Typing Drill Completed!";
    document.getElementById("next-btn").disabled = true;
    markDateCompleted(currentDate);
  }
}

function markDateCompleted(date) {
  const completedKey = `completed-${currentUser.username}-${date}`;
  localStorage.setItem(completedKey, "true");
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById("calendar");
  container.innerHTML = "<h3>Typing Calendar</h3>";
  const today = new Date();
  const days = 14;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = date.toISOString().split("T")[0];
    const completed = localStorage.getItem(`completed-${currentUser.username}-${iso}`);
    const hasDrill = localStorage.getItem(`drills-${currentUser.classroomCode}-${iso}`);
    const div = document.createElement("div");
    div.textContent = iso;
    div.className = "calendar-day";
    if (completed) div.classList.add("green");
    else if (hasDrill) div.classList.add("blue");
    else div.classList.add("gray");
    container.appendChild(div);
  }
}

// Bulk Upload
function handleBulkUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n").map(line => line.trim()).filter(Boolean);
    const data = lines.map(line => {
      const [date, ...drills] = line.split(/\[(.*?)\]/).filter((_, i) => i % 2 === 1 || i === 0);
      return { date: date.trim(), drills: drills.filter(Boolean) };
    });

    const applyToAll = confirm("Apply to ALL of your classes?\nYes = all\nNo = just this class");
    const classKeys = Object.entries(localStorage)
      .filter(([k]) => k.startsWith("class-"))
      .filter(([, v]) => JSON.parse(v).teacher === currentUser.username)
      .map(([k]) => k.replace("class-", ""));

    data.forEach(({ date, drills }) => {
      classKeys.forEach(code => {
        if (applyToAll || code === currentUser.classroomCode) {
          localStorage.setItem(`drills-${code}-${date}`, JSON.stringify(drills));
        }
      });
    });

    alert("Bulk upload completed.");
    loadTeacherClasses();
  };
  reader.readAsText(file);
}
