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

const teacherDashboard = document.getElementById("teacher-dashboard");
const studentDashboard = document.getElementById("student-dashboard");
const teacherNameEl = document.getElementById("teacher-name");
const studentNameEl = document.getElementById("student-name");

const promptEl = document.getElementById("prompt");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");

// State
let current = 0;
let cursorPos = 0;

// Login Logic
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;

  if (!name || !password) {
    loginMessage.textContent = "Please enter both name and password.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[name]) {
    // Existing user
    if (users[name].password === password && users[name].role === role) {
      loginMessage.textContent = "";
      proceedToDashboard(name, role);
    } else {
      loginMessage.textContent = "Incorrect password or role.";
    }
  } else {
    // New user
    users[name] = { password, role };
    localStorage.setItem("users", JSON.stringify(users));
    loginMessage.textContent = "";
    proceedToDashboard(name, role);
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

function loadDrill(index) {
  current = index;
  cursorPos = 0;
  renderPrompt();
  updateCurrentSpan();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
}

// Typing Logic
function onKeyDown(e) {
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

  if (cursorPos >= spans.length) {
    nextBtn.disabled = false;
  }
}

// Next Drill
nextBtn.addEventListener("click", () => {
  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "All drills complete—great work!";
    nextBtn.style.display = "none";
  }
});

// Initialize key listener
document.addEventListener("keydown", onKeyDown);
