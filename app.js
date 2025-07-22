// Version
const VERSION = "0.0.3";

// Drill bank by date
const dailyDrills = {
  "2025-07-22": [
    "Always type like someone is watching.",
    "Speed is nothing without accuracy.",
    "Fingers on the home row keys."
  ],
  "2025-07-23": [
    "Practice makes perfect.",
    "Use proper posture while typing.",
    "Avoid looking at the keyboard."
  ],
  "2025-07-24": [
    "Each key has its home.",
    "Focus on rhythm and flow.",
    "Rest your wrists between sessions."
  ],
  "2025-07-25": [
    "Typing drills improve consistency.",
    "Check for typos before submitting.",
    "Accuracy comes before speed."
  ]
};

// DOM Elements (Add version text)
const versionText = document.createElement("div");
versionText.style.position = "fixed";
versionText.style.bottom = "4px";
versionText.style.right = "10px";
versionText.style.fontSize = "0.8em";
versionText.style.color = "#888";
versionText.textContent = `version ${VERSION}`;
document.body.appendChild(versionText);

// UI setup
updateModeUI();
updateTeacherDashboard(); // Ensure this runs on load

// Attach createClassroomBtn again in case code was cut
createClassroomBtn.addEventListener("click", () => {
  const classroomName = newClassroomNameInput.value.trim();
  if (!classroomName) return;

  const code = generateClassroomCode();
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  classrooms[code] = {
    name: classroomName,
    teacher: teacherNameEl.textContent,
    students: [],
    customDrills: {} // new per-date drills
  };
  localStorage.setItem("classrooms", JSON.stringify(classrooms));

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[teacherNameEl.textContent].classrooms) {
    users[teacherNameEl.textContent].classrooms = [];
  }
  users[teacherNameEl.textContent].classrooms.push(code);
  localStorage.setItem("users", JSON.stringify(users));

  updateTeacherDashboard();
});

// Delete class (icon click)
function deleteClassroom(code) {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  delete classrooms[code];
  localStorage.setItem("classrooms", JSON.stringify(classrooms));

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const teacher = teacherNameEl.textContent;
  const user = users[teacher];
  if (user.classrooms) {
    user.classrooms = user.classrooms.filter(c => c !== code);
    localStorage.setItem("users", JSON.stringify(users));
  }

  updateTeacherDashboard();
}

// Extend teacher dashboard rendering
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

    html += `<h3>${classroom.name} (Code: ${code}) <span style='cursor:pointer;color:red;' onclick='deleteClassroom("${code}")'>&#128465;</span></h3>`;
    html += `<button onclick='editDrills("${code}")'>Edit Drills</button>`;
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

// Drill Editor (simple prompt-based for now)
function editDrills(code) {
  const date = prompt("Enter date to customize drills (YYYY-MM-DD):", currentDate);
  if (!date) return;

  let newDrills = [];
  for (let i = 0; i < 3; i++) {
    const line = prompt(`Enter line ${i + 1}:`);
    if (!line) return;
    newDrills.push(line);
  }

  const applyAll = confirm("Apply to ALL your classes for that day?");
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const teacher = teacherNameEl.textContent;
  const user = users[teacher];

  if (applyAll) {
    (user.classrooms || []).forEach(cid => {
      if (classrooms[cid]) {
        if (!classrooms[cid].customDrills) classrooms[cid].customDrills = {};
        classrooms[cid].customDrills[date] = newDrills;
      }
    });
  } else {
    if (!classrooms[code].customDrills) classrooms[code].customDrills = {};
    classrooms[code].customDrills[date] = newDrills;
  }

  localStorage.setItem("classrooms", JSON.stringify(classrooms));
  alert("Drills updated!");
  updateTeacherDashboard();
}

// Replace global drill loader to include custom drills
function getTodaysDrills(classroomCode) {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  if (
    classrooms[classroomCode] &&
    classrooms[classroomCode].customDrills &&
    classrooms[classroomCode].customDrills[currentDate]
  ) {
    return classrooms[classroomCode].customDrills[currentDate];
  }
  return dailyDrills[currentDate] || ["Default drill if no match."];
}
