// 1. Predefine drills
const drills = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing practice improves both speed and accuracy.",
  "Case matters: Capital Letters are important!"
];

let current = 0;
let errorFlag = false;
let prevValue = "";

const promptEl    = document.getElementById("prompt");
const inputEl     = document.getElementById("input");
const feedbackEl  = document.getElementById("feedback");
const nextBtn     = document.getElementById("next-btn");

// 2. Load a drill
function loadDrill(index) {
  current    = index;
  errorFlag  = false;
  prevValue  = "";
  promptEl.textContent = drills[index];
  inputEl.value        = "";
  inputEl.disabled     = false;
  nextBtn.disabled     = true;
  feedbackEl.textContent = "";
  inputEl.focus();
}

// 3. Prevent further characters once typo occurs (allow Backspace/Delete only)
inputEl.addEventListener("keydown", (e) => {
  if (errorFlag && !["Backspace", "Delete"].includes(e.key)) {
    e.preventDefault();
  }
});

// 4. On each input, check against target
inputEl.addEventListener("input", () => {
  if (errorFlag) {
    // Revert any new typing beyond the error point
    inputEl.value = prevValue;
    return;
  }

  const target = drills[current];
  const entry  = inputEl.value;

  // Prevent over-typing past the end
  if (entry.length > target.length) {
    inputEl.value = target;
    return;
  }

  for (let i = 0; i < entry.length; i++) {
    const expected = target[i];
    const entered  = entry[i];

    if (entered !== expected) {
      // Typo detected
      errorFlag = true;
      let msg = "";

      // Case-only mistake?
      if (entered.toLowerCase() === expected.toLowerCase()) {
        if (expected === expected.toUpperCase()) {
          msg = `Hold the SHIFT key with your left hand to input a capital ` +
                `<span class="expected">${expected}</span> instead of lowercase ` +
                `<span class="wrong">${entered}</span>.`;
        } else {
          msg = `We were looking for lowercase ` +
                `<span class="expected">${expected}</span>, not capital ` +
                `<span class="wrong">${entered}</span>.`;
        }
      } 
      // Completely wrong character
      else {
        msg = `You entered <span class="wrong">${entered}</span>, ` +
              `but we were looking for <span class="expected">${expected}</span>.`;
      }

      feedbackEl.innerHTML = msg;
      nextBtn.disabled = true;

      // Shake
      inputEl.classList.add("shake");
      inputEl.addEventListener("animationend", () => {
        inputEl.classList.remove("shake");
      }, { once: true });

      // Lock-in position: revert to just before the error
      prevValue   = entry.slice(0, i);
      inputEl.value = prevValue;
      return;
    }
  }

  // No errors in current entry so far
  prevValue = entry;
  feedbackEl.textContent = "";

  // If fully correct, enable Next
  if (entry === target) {
    inputEl.disabled = true;
    nextBtn.disabled = false;
  }
});

// 5. Next-drill logic
nextBtn.addEventListener("click", () => {
  if (current + 1 < drills.length) {
    loadDrill(current + 1);
  } else {
    promptEl.textContent = "All drills complete—great work!";
    inputEl.style.display = "none";
    nextBtn.style.display = "none";
  }
});

// Initialize
loadDrill(0);
