// your drill sentences
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

let current    = 0;   // which drill
let cursorPos  = 0;   // index within that drill
let errorFlag  = false;

const promptEl   = document.getElementById("prompt");
const feedbackEl = document.getElementById("feedback");
const nextBtn    = document.getElementById("next-btn");

// Build the prompt as a series of <span> so we can color them
function renderPrompt() {
  promptEl.innerHTML = "";
  const text = drills[current];
  text.split("").forEach(char => {
    const span = document.createElement("span");
    span.classList.add("char");
    span.textContent = char;
    promptEl.appendChild(span);
  });
}

// Load a new drill
function loadDrill(index) {
  current   = index;
  cursorPos = 0;
  errorFlag = false;
  renderPrompt();
  feedbackEl.innerHTML = "";
  nextBtn.disabled = true;
  promptEl.focus();
}

// Handle every key press
function onKeyDown(e) {
  // ignore non-character keys
  if (e.key.length !== 1) return;
  // if drill already complete, ignore
  if (!nextBtn.disabled) return;

  const spans    = promptEl.querySelectorAll("span.char");
  const expected = drills[current][cursorPos];
  const pressed  = e.key;

  // If we’re in an error state, only allow the correct key
  if (errorFlag) {
    if (pressed === expected) {
      spans[cursorPos].classList.remove("error");
      spans[cursorPos].classList.add("correct");
      errorFlag = false;
      feedbackEl.innerHTML = "";
      cursorPos++;
    } else {
      e.preventDefault();
    }
  }
  // No error yet, normal flow
  else {
    if (pressed === expected) {
      spans[cursorPos].classList.add("correct");
      cursorPos++;
    } else {
      // mark error
      errorFlag = true;
      e.preventDefault();
      spans[cursorPos].classList.add("error");

      // customized feedback
      let msg;
      if (pressed.toLowerCase() === expected.toLowerCase()) {
        // case-only mistake
        if (expected === expected.toUpperCase()) {
          msg = `Hold SHIFT to capitalize <span class="expected">${expected}</span> instead of lowercase <span class="wrong">${pressed}</span>.`;
        } else {
          msg = `Use lowercase <span class="expected">${expected}</span>, not <span class="wrong">${pressed}</span>.`;
        }
      } else {
        // wrong character entirely
        msg = `You entered <span class="wrong">${pressed}</span>, but expected <span class="expected">${expected}</span>.`;
      }
      feedbackEl.innerHTML = msg;

      // shake the prompt
      promptEl.classList.add("shake");
      promptEl.addEventListener("animationend", () => {
        promptEl.classList.remove("shake");
      }, { once: true });
    }
  }

  // If no error and we've reached the end, enable Next
  if (!errorFlag && cursorPos >= drills[current].length) {
    nextBtn.disabled = false;
  }
}

// Advance to next drill
nextBtn.addEventListener("click", () => {
  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "All drills complete—great work!";
    nextBtn.style.display = "none";
  }
});

// set up listeners and start
document.addEventListener("keydown", onKeyDown);
loadDrill(0);
