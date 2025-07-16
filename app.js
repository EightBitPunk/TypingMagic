// 1. Your drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// 2. State variables
let current   = 0;   // which drill index
let cursorPos = 0;   // position within the string

const promptEl   = document.getElementById("prompt");
const feedbackEl = document.getElementById("feedback");
const nextBtn    = document.getElementById("next-btn");

// 3. Render the prompt as spans
function renderPrompt() {
  promptEl.innerHTML = "";
  drills[current].split("").forEach(char => {
    const span = document.createElement("span");
    span.classList.add("char");
    span.textContent = char;
    promptEl.appendChild(span);
  });
}

// 4. Highlight the current character
function updateCurrentSpan() {
  const spans = promptEl.querySelectorAll("span.char");
  spans.forEach(s => s.classList.remove("current"));
  if (cursorPos < spans.length) {
    spans[cursorPos].classList.add("current");
  }
}

// 5. Load a new drill
function loadDrill(index) {
  current   = index;
  cursorPos = 0;
  renderPrompt();
  updateCurrentSpan();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
}

// 6. Handle every keypress
function onKeyDown(e) {
  // 6.1 Allow browser shortcuts
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const spans = promptEl.querySelectorAll("span.char");

  // 6.2 BACKSPACE: move cursor back & reset that char
  if (e.key === "Backspace") {
    e.preventDefault();
    if (cursorPos > 0) {
      cursorPos--;
      spans[cursorPos].classList.remove("correct", "error");
      updateCurrentSpan();
      feedbackEl.innerHTML = "";
      // If Next was enabled, disable it again
      if (!nextBtn.disabled) nextBtn.disabled = true;
    }
    return;
  }

  // 6.3 Only handle single-character typing
  if (e.key.length !== 1) return;

  // 6.4 Prevent typing beyond the end
  if (cursorPos >= spans.length) {
    e.preventDefault();
    return;
  }

  const expected = drills[current][cursorPos];
  const pressed  = e.key;

  // Clear the gold underline
  spans[cursorPos].classList.remove("current");

  // 6.5 Correct keystroke?
  if (pressed === expected) {
    spans[cursorPos].classList.add("correct");
    feedbackEl.innerHTML = "";
  }
  // 6.6 Wrong keystroke
  else {
    spans[cursorPos].classList.add("error");

    let msg;
    if (pressed.toLowerCase() === expected.toLowerCase()) {
      // Case-only mistake
      if (expected === expected.toUpperCase()) {
        msg = `Hold SHIFT to capitalize <span class="expected">${expected}</span> instead of lowercase <span class="wrong">${pressed}</span>.`;
      } else {
        msg = `Use lowercase <span class="expected">${expected}</span>, not <span class="wrong">${pressed}</span>.`;
      }
    } else {
      // Completely wrong character
      if (expected === " ") {
        msg = `You entered <span class="wrong">${pressed}</span>, but we were expecting a space.`;
      } else {
        msg = `You entered <span class="wrong">${pressed}</span>, but expected <span class="expected">${expected}</span>.`;
      }
    }

    feedbackEl.innerHTML = msg;
    promptEl.classList.add("shake");
    promptEl.addEventListener(
      "animationend",
      () => promptEl.classList.remove("shake"),
      { once: true }
    );
  }

  // 6.7 Advance cursor and highlight next
  cursorPos++;
  updateCurrentSpan();

  // 6.8 If at the end, enable Next
  if (cursorPos >= spans.length) {
    nextBtn.disabled = false;
  }
}

// 7. Next-drill logic
nextBtn.addEventListener("click", () => {
  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "All drills complete—great work!";
    nextBtn.style.display = "none";
  }
});

// 8. Initialize
document.addEventListener("keydown", onKeyDown);
loadDrill(0);
