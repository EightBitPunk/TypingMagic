// 1. Your drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

// 2. State variables
let current   = 0;   // which drill index
let cursorPos = 0;   // position within the string
let errorFlag = false;

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

// 4. Highlight the next character to type
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
  errorFlag = false;
  renderPrompt();
  updateCurrentSpan();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
}

// 6. Handle every keystroke
function onKeyDown(e) {
  // only single-character keys
  if (e.key.length !== 1) return;
  // ignore if drill is already complete
  if (!nextBtn.disabled) return;

  const spans    = promptEl.querySelectorAll("span.char");
  const expected = drills[current][cursorPos];
  const pressed  = e.key;

  // If a typo has happened, only accept the correct key
  if (errorFlag) {
    if (pressed === expected) {
      spans[cursorPos].classList.remove("error");
      spans[cursorPos].classList.add("correct");
      errorFlag = false;
      feedbackEl.innerHTML = "";
      cursorPos++;
      updateCurrentSpan();
    } else {
      e.preventDefault();
    }
  }
  // Normal typing flow
  else {
    if (pressed === expected) {
      spans[cursorPos].classList.add("correct");
      cursorPos++;
      updateCurrentSpan();
    } else {
      // block the wrong key
      e.preventDefault();
      errorFlag = true;
      spans[cursorPos].classList.add("error");

      // Build tailored feedback
      let msg;
      if (pressed.toLowerCase() === expected.toLowerCase()) {
        // Only case is wrong
        if (expected === expected.toUpperCase()) {
          msg = `Hold SHIFT to capitalize <span class="expected">${expected}</span> instead of lowercase <span class="wrong">${pressed}</span>.`;
        } else {
          msg = `Use lowercase <span class="expected">${expected}</span>, not <span class="wrong">${pressed}</span>.`;
        }
      } else {
        // Completely wrong character
        msg = `You entered <span class="wrong">${pressed}</span>, but expected <span class="expected">${expected}</span>.`;
      }
      feedbackEl.innerHTML = msg;

      // Shake animation
      promptEl.classList.add("shake");
      promptEl.addEventListener("animationend", () => {
        promptEl.classList.remove("shake");
      }, { once: true });
    }
  }

  // If fully typed without errors, enable Next
  if (!errorFlag && cursorPos >= drills[current].length) {
    nextBtn.disabled = false;
  }
}

// 7. Advance to the next drill
nextBtn.addEventListener("click", () => {
  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "All drills complete—great work!";
    nextBtn.style.display = "none";
  }
});

// 8. Initialize listeners and start the first drill
document.addEventListener("keydown", onKeyDown);
loadDrill(0);
