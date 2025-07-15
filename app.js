// 1. Predefine your drills:
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

let current = 0;
const promptEl = document.getElementById("prompt");
const inputEl = document.getElementById("input");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");

// 2. Load a drill:
function loadDrill(index) {
  promptEl.textContent = drills[index];
  inputEl.value = "";
  inputEl.disabled = false;
  nextBtn.disabled = true;
  feedbackEl.textContent = "";
  inputEl.focus();
}

// 3. Compare input to target text on each keystroke:
inputEl.addEventListener("input", () => {
  const target = drills[current];
  const entry = inputEl.value;

  // If user has typed extra chars, ignore
  if (entry.length > target.length) {
    inputEl.value = target;
    return;
  }

  // Check each character
  for (let i = 0; i < entry.length; i++) {
    if (entry[i] !== target[i]) {
      feedbackEl.textContent = 
        `Error at position ${i + 1}: expected "${target[i]}"`;
      nextBtn.disabled = true;
      return;
    }
  }

  // No error so far
  feedbackEl.textContent = "";
  // Only allow “Next” when fully correct
  if (entry === target) {
    inputEl.disabled = true;
    nextBtn.disabled = false;
  }
});

// 4. Advance drills
nextBtn.addEventListener("click", () => {
  current++;
  if (current >= drills.length) {
    promptEl.textContent = "All drills complete—great work!";
    inputEl.style.display = "none";
    nextBtn.style.display = "none";
  } else {
    loadDrill(current);
  }
});

// Initialize first drill
loadDrill(current);
