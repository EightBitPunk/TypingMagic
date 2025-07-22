// Version 0.0.2

// Drill templates by date
const drillSets = {
  "default": [
    "The quick brown fox jumps over the lazy dog.",
    "Typing practice improves both speed and accuracy.",
    "Case matters: Capital Letters are important!"
  ],
  "2025-07-21": [
    "Practice makes perfect with daily typing.",
    "Don’t forget to stretch your fingers often.",
    "Speed is great, but accuracy comes first."
  ],
  "2025-07-22": [
    "Today’s drills are custom made for you!",
    "Focus on each key and keep a good rhythm.",
    "Mistakes are okay—just keep going."
  ],
  "2025-07-23": [
    "Another day, another drill to conquer.",
    "Try to beat your last typing score.",
    "Practice builds skill and confidence."
  ]
};

const customDrills = JSON.parse(localStorage.getItem("customDrills") || "{}");

// DOM Elements
const versionEl = document.createElement("div");
versionEl.textContent = "version 0.0.2";
versionEl.style.fontSize = "10px";
versionEl.style.textAlign = "center";
versionEl.style.marginTop = "20px";
document.body.appendChild(versionEl);

function getDrillsForTeacher(teacher, classroomCode) {
  const date = new Date().toISOString().split("T")[0];
  const teacherDrills = customDrills[teacher]?.[date]?.[classroomCode] ||
                         customDrills[teacher]?.[date]?.["all"];
  return teacherDrills || drillSets[date] || drillSets["default"];
}

function loadDrill(index) {
  const classroomCode = currentUser?.classroomCode;
  const name = studentNameEl?.textContent || currentUser?.name;
  const drills = getDrillsForTeacher(currentUser?.teacher || name, classroomCode);
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
    html += `<h3>${classroom.name} (Code: ${code}) <span class='delete-class' data-code='${code}' style='color:red; cursor:pointer;'>🗑️</span></h3>`;
    html += `<button onclick="editDrills('${code}')">Customize Drills</button>`;
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

  document.querySelectorAll(".delete-class").forEach(el => {
    el.addEventListener("click", () => {
      const code = el.dataset.code;
      deleteClassroom(code);
    });
  });
}

function deleteClassroom(code) {
  const classrooms = JSON.parse(localStorage.getItem("classrooms") || "{}");
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  delete classrooms[code];
  const teacher = teacherNameEl.textContent;
  if (users[teacher]?.classrooms) {
    users[teacher].classrooms = users[teacher].classrooms.filter(c => c !== code);
  }
  localStorage.setItem("classrooms", JSON.stringify(classrooms));
  localStorage.setItem("users", JSON.stringify(users));
  updateTeacherDashboard();
}

function editDrills(classroomCode) {
  const date = new Date().toISOString().split("T")[0];
  const teacher = teacherNameEl.textContent;
  const current = getDrillsForTeacher(teacher, classroomCode);
  const edited = prompt(`Edit drills for ${date} (${classroomCode}). Separate with |`, current.join("|") || "");
  if (!edited) return;

  if (!customDrills[teacher]) customDrills[teacher] = {};
  if (!customDrills[teacher][date]) customDrills[teacher][date] = {};

  const applyAll = confirm("Apply this custom lesson to ALL your classes today?");
  if (applyAll) {
    customDrills[teacher][date]["all"] = edited.split("|");
  } else {
    customDrills[teacher][date][classroomCode] = edited.split("|");
  }

  localStorage.setItem("customDrills", JSON.stringify(customDrills));
  updateTeacherDashboard();
}

// Immediately show teacher dashboard on login
if (teacherDashboard && !teacherDashboard.classList.contains("hidden")) {
  updateTeacherDashboard();
}
