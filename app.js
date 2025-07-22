// Version 0.0.3

// Drill data per day
const dailyDrills = {
  "2025-07-22": [
    "The fox sprinted quickly through the forest.",
    "Typing every day improves muscle memory.",
    "Accuracy is better than speed when learning."
  ],
  "2025-07-23": [
    "Coding is a valuable skill in modern times.",
    "Errors help you learn and improve faster.",
    "Consistent practice leads to steady progress."
  ],
  "2025-07-24": [
    "Never give up when a bug gets in your way.",
    "Review and revise: the coder’s best tools.",
    "Testing your code ensures quality results."
  ],
  "2025-07-25": [
    "A great teacher inspires and challenges students.",
    "Lessons are best retained when practiced often.",
    "Learning to type well builds lifelong skills."
  ]
};

// DOM Content Loaded
window.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 app.js loaded! DOMContentLoaded? ", document.readyState);

  const versionEl = document.createElement("div");
  versionEl.textContent = "version 0.0.3";
  versionEl.style.position = "fixed";
  versionEl.style.bottom = "5px";
  versionEl.style.right = "10px";
  versionEl.style.fontSize = "0.8em";
  versionEl.style.color = "gray";
  document.body.appendChild(versionEl);

  // Reinitialize all buttons and logic
  initApp();
});

function initApp() {
  const loginScreen = document.getElementById("login-screen");
  const loginBtn = document.getElementById("login-btn");
  const toggleModeBtn = document.getElementById("toggle-mode-btn") || document.createElement("button");
  toggleModeBtn.id = "toggle-mode-btn";
  toggleModeBtn.textContent = "Go to Sign Up";
  if (!toggleModeBtn.parentElement) loginScreen.appendChild(toggleModeBtn);

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

  let isSignUp = false;

  function updateModeUI() {
    loginBtn.textContent = isSignUp ? "Sign Up" : "Log In";
    toggleModeBtn.textContent = isSignUp ? "Go to Log In" : "Go to Sign Up";
    const showClassroomCode = isSignUp && roleSelect.value === "student";
    studentClassroomCode.classList.toggle("hidden", !showClassroomCode);
  }

  toggleModeBtn.addEventListener("click", () => {
    isSignUp = !isSignUp;
    updateModeUI();
  });

  roleSelect.addEventListener("change", updateModeUI);
  updateModeUI();

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
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const currentUser = users[name];

    if (role === "teacher") {
      teacherNameEl.textContent = name;
      teacherDashboard.classList.remove("hidden");
      updateTeacherDashboard(name);
    } else {
      studentNameEl.textContent = name;
      studentDashboard.classList.remove("hidden");
      // Load student drill UI based on today’s date
    }
  }

  function updateTeacherDashboard(teacherName) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
    const teacherUser = users[teacherName];
    const codes = teacherUser.classrooms || [];

    let html = "";
    codes.forEach(code => {
      const classroom = classrooms[code];
      if (!classroom) return;
      html += `<h3>${classroom.name} (Code: ${code}) <span style="color:red; cursor:pointer;" data-code="${code}" class="delete-class">🗑️</span></h3>`;
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

    const tableContainer = document.getElementById("student-progress-table");
    tableContainer.innerHTML = html;

    document.querySelectorAll(".delete-class").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        if (confirm("Delete this class?")) {
          const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
          delete classrooms[code];
          localStorage.setItem("classrooms", JSON.stringify(classrooms));

          const users = JSON.parse(localStorage.getItem("users") || "{}");
          users[teacherName].classrooms = users[teacherName].classrooms.filter(c => c !== code);
          localStorage.setItem("users", JSON.stringify(users));

          updateTeacherDashboard(teacherName);
        }
      });
    });
  }
}
