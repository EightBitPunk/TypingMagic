// Version 0.2.02 — firebase-login.js

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut }           from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// 1) Initialize Firebase
const firebaseConfig = { /* … your config … */ };
initializeApp(firebaseConfig);
const auth = getAuth();

// 2) Wait for DOM and wire the login buttons
window.addEventListener("DOMContentLoaded", () => {
  const loginBtn   = document.getElementById('login-btn');
  const toggleBtn  = document.getElementById('toggle-mode-btn');
  const userIn     = document.getElementById('username');
  const passIn     = document.getElementById('password');
  const roleSel    = document.getElementById('role');
  const classIn    = document.getElementById('classroom-code');
  const loginMsg   = document.getElementById('login-message');
  const logoutBtn  = document.getElementById('logout-btn');

  let signUpMode = false;
  toggleBtn.onclick = () => {
    signUpMode = !signUpMode;
    toggleBtn.textContent = signUpMode ? "Back to Login" : "Sign Up";
    loginBtn.textContent  = signUpMode ? "Create Account" : "Log In";
    loginMsg.textContent  = "";
    document.getElementById('student-classroom-code')
            .classList.toggle("hidden", roleSel.value!=='student' || !signUpMode);
  };

  loginBtn.onclick = async () => {
    const email = userIn.value.trim();
    const pw    = passIn.value;
    const role  = roleSel.value;
    const code  = classIn.value.trim();
    loginMsg.textContent = '';

    if (!email || !pw || (signUpMode && role==='student' && !code)) {
      loginMsg.textContent = 'Complete all fields.';
      return;
    }

    try {
      const cred = signUpMode
        ? await createUserWithEmailAndPassword(auth, email, pw)
        : await signInWithEmailAndPassword  (auth, email, pw);
      // on success, set localStorage.currentUser to keep old code happy:
      localStorage.setItem('currentUser',
        JSON.stringify({ username: email, role }));

      // Now call your old enterDash() from v0.1.82:
      if (email === 'magiccaloriecam@gmail.com') {
        enterAdmin();     // your old admin entry point
      } else {
        enterDash(email, role);
      }

      logoutBtn.style.display = 'block';
    } catch (err) {
      loginMsg.textContent = err.message.replace('Firebase: ', '');
    }
  };

  logoutBtn.onclick = async () => {
    await signOut(auth);
    location.reload();  // go back to the login screen
  };
});
