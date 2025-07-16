// 1. Your drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// 2. State variables
let current   = 0;   // which drill index
let cursorPos = 0;   // position within the prompt
const promptEl   = document.getElementById("prompt");
const feedbackEl = document.getElementById("feedback");
const nextBtn    = document.getElementById("next-btn");

// 3. Render the prompt as individual spans
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
  // 6.1 Let browser shortcuts through
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const spans = promptEl.querySelectorAll("span.char");

  // 6.2 BACKSPACE: move cursor back & reset that char
  if (e.key === "Backspace") {
    e.preventDefault();
    if (cursorPos > 0) {
      // Step back
      cursorPos--;
      // Clear any styling on that span
      spans[cursorPos].classList.remove("correct", "error");
      updateCurrentSpan();
      feedbackEl.innerHTML = "";
    }
    return;
  }

  // 6.3 Only handle single-character typing when drill is active
  if (e.key.length !== 1 || !nextBtn.disabled) return;

  const expected = drills[current][cursorPos];
  const pressed  = e.key;

  // Remove the gold underline on current
  spans[cursorPos].classList.remove("current");

  // 6.4 Correct keystroke?
  if (pressed === expected) {
    spans[cursorPos].classList.add("correct");
    feedbackEl.innerHTML = "";
  }
  // 6.5 Wrong keystroke
  else {
    spans[cursorPos].classList.add("error");

    // Build feedback message
    let msg;
    if (pressed.toLowerCase() === expected.toLowerCase()) {
      // Case-only error
      if (expected === expected.toUpperCase()) {
        msg =
          `Hold SHIFT to capitalize <span class="expected">${expected}</span> instead of lowercase <span class="wrong">${pressed}</span>.`;
      } else {
        msg =
          `Use lowercase <span class="expected">${expected}</span>, not <span class="wrong">${pressed}</span>.`;
      }
    } else {
      // Completely wrong char
      if (expected === " ") {
        msg =
          `You entered <span class="wrong">${pressed}</span>, but we were expecting a space.`;
      } else {
        msg =
          `You entered <span class="wrong">${pressed}</span>, but expected <span class="expected">${expected}</span>.`;
      }
    }
    feedbackEl.innerHTML = msg;

    // Shake animation
    promptEl.classList.add("shake");
    promptEl.addEventListener(
      "animationend",
      () => promptEl.classList.remove("shake"),
      { once: true }
    );
  }

  // 6.6 Advance cursor & highlight the next char
  cursorPos++;
  updateCurrentSpan();

  // 6.7 If we've reached the end, enable the Next button
  if (cursorPos >= drills[current].length) {
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

// 8. Start everything
document.addEventListener("keydown", onKeyDown);
loadDrill(0);
