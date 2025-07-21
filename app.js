# Since the task is to update a JavaScript file, we will write the updated content to a file named 'app.js'.
# This Python code will generate the full updated app.js content based on the user's requirements.

updated_app_js = """
// Drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const toggleModeBtn = document.getElementById("toggle-mode-btn");
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
const teacherClassroomsList = document.getElementById("teacher-classrooms-list");

let current = 0;
let cursorPos = 0;
let currentUser = null;
let currentClassroom = null;
let currentDate = new Date().toISOString().split("T")[0];
let isSignUp = true;

function generateClassroomCode() {
  return "C" + Math.floor(100000 + Math.random() * 900000);
}

function updateToggleButton() {
  loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleModeBtn.textContent = isSignUp ? "Switch to Log In" : "Switch to Sign Up";
  studentClassroomCode.classList.toggle("hidden", !isSignUp || roleSelect.value !== "student");
}

roleSelect.addEventListener("change", () => {
  updateToggleButton();
});

toggleModeBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  updateToggleButton();
});

window.addEventListener("load", () => {
  updateToggleButton();
});

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
      loginMessage.textContent = "Incorrect login credentials.";
    }
  }
});

function proceedToDashboard(name, role) {
  loginScreen.classList.add("hidden");

  if (role === "teacher") {
    teacherNameEl.textContent = name;
    teacherDashboard.classList.remove("hidden");
    loadTeacherClassrooms(name);
  } else {
    studentNameEl.textContent = name;
    studentDashboard.classList.remove("hidden");
    loadDrill(0);
  }
}

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
  loadTeacherClassrooms(teacherNameEl.textContent);
});

function loadTeacherClassrooms(teacherName) {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  teacherClassroomsList.innerHTML = "";
  Object.entries(classrooms).forEach(([code, data]) => {
    if (data.teacher === teacherName) {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${data.name}</strong> (Code: ${code}) 
        <button onclick="deleteClassroom('${code}')">Delete</button>`;
      teacherClassroomsList.appendChild(div);
    }
  });
}

function deleteClassroom(code) {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  delete classrooms[code];
  localStorage.setItem("classrooms", JSON.stringify(classrooms));
  loadTeacherClassrooms(teacherNameEl.textContent);
}

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

function updateLiveStats() {
  const spans = promptEl.querySelectorAll("span.char");
  const correct = Array.from(spans).filter(s => s.classList.contains("correct")).length;
  const errors = Array.from(spans).filter(s => s.classList.contains("error")).length;
  const total = spans.length;
  const accuracy = Math.max(0, Math.round(((total - errors) / total) * 100));
  studentStats.innerHTML = `Accuracy: ${accuracy}% | Errors: ${errors}`;
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
    feedbackEl.innerHTML = `Mistake on "${expected}"`;
  }

  cursorPos++;
  updateCurrentSpan();
  updateLiveStats();

  if (cursorPos >= spans.length) {
    nextBtn.disabled = false;
  }
});

nextBtn.addEventListener("click", () => {
  const spans = promptEl.querySelectorAll("span.char");
  const correct = Array.from(spans).filter(s => s.classList.contains("correct")).length;
  const errors = Array.from(spans).filter(s => s.classList.contains("error")).length;
  const total = spans.length;
  const accuracy = Math.max(0, Math.round(((total - errors) / total) * 100));

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

  let html = "<table><tr><th>Name</th><th>Date</th><th>Drills</th><th>Accuracy</th><th>Errors</th><th>Actions</th></tr>";
  sortedStudents.forEach(([name, data]) => {
    const progress = data.progress || {};
    Object.entries(progress).forEach(([date, drills]) => {
      const totalDrills = drills.length;
      const avgAccuracy = Math.round(drills.reduce((sum, d) => sum + d.accuracy, 0) / totalDrills);
      const totalErrors = drills.reduce((sum, d) => sum + d.errors, 0);
      html += `<tr><td>${name}</td><td>${date}</td><td>${totalDrills}</td><td>${avgAccuracy}%</td><td>${totalErrors}</td>
        <td>
          <button onclick="resetStudentPassword('${name}')">Reset Password</button>
          <button onclick="deleteStudent('${name}')">Delete Student</button>
        </td></tr>`;
    });
  });
  html += "</table>";
  studentProgressTable.innerHTML = html;
}

function resetStudentPassword(name) {
  const newPass = prompt("Enter new password for " + name);
  if (newPass) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    users[name].password = newPass;
    localStorage.setItem("users", JSON.stringify(users));
    alert("Password reset.");
  }
}

function deleteStudent(name) {
  if (confirm("Are you sure you want to delete " + name + "?")) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    delete users[name];
    localStorage.setItem("users", JSON.stringify(users));
    updateTeacherDashboard();
  }
}
"""

# Write the updated content to app.js
with open("app.js", "w") as f:
    f.write(updated_app_js)

print("Updated app.js file has been written successfully.")
