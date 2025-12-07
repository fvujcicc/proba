import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------------------------------------------------
   FIREBASE CONFIG
--------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyD5mgGodKXYkHXx0Yornd-WeaoK9BMnoQU",
  authDomain: "caffe-bar-project.firebaseapp.com",
  projectId: "caffe-bar-project",
  storageBucket: "caffe-bar-project.appspot.com",
  messagingSenderId: "454296208579",
  appId: "1:454296208579:web:f666c4beaaaa683c410e76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------------------------------------------
   Pretvaranje slike u Base64
--------------------------------------------------- */
function pretvoriSlikuUBase64(slika) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(slika);
  });
}

/* ---------------------------------------------------
   CUSTOMER VIEW – URL ima cafeId
--------------------------------------------------- */
function getCafeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cafeId"); // sada radi sa ?cafeId=...
}

const cafeIdURL = getCafeIdFromUrl();

if (cafeIdURL) {
  document.getElementById("customerView").style.display = "block";

  (async () => {
    const cafeRef = doc(db, "cafes", cafeIdURL);
    const snap = await getDoc(cafeRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.backgroundBase64) {
        document.body.style.backgroundImage =
          `url('data:image/png;base64,${data.backgroundBase64}')`;
      }

      if (data.name) {
        document.getElementById("cafeCard").style.display = "block";
        document.getElementById("cafeName").textContent = data.name;
      }
    }
  })();
}

/* ---------------------------------------------------
   ADMIN MODE – root stranica
--------------------------------------------------- */
else {
  const adminPanel = document.getElementById("adminPanel");
  const loginBox = document.getElementById("loginBox");
  const uploadBox = document.getElementById("uploadBox");

  adminPanel.style.display = "block";

  let userCafeId = null;

  /* -----------------------------
     LOGIN
  ----------------------------- */
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("Nema dodijeljen kafić u Firestore!");
        return;
      }

      userCafeId = userDoc.data().cafeId?.trim();

      if (!userCafeId) {
        alert("Korisnik nema validan cafeId!");
        return;
      }

      loginBox.style.display = "none";
      uploadBox.style.display = "block";

      // ODMAH PROČITAJ POSTOJEĆU SLIKU
      const cafeRef = doc(db, "cafes", userCafeId);
      const cafeSnap = await getDoc(cafeRef);

      if (cafeSnap.exists() && cafeSnap.data().backgroundBase64) {
        document.body.style.backgroundImage =
          `url('data:image/png;base64,${cafeSnap.data().backgroundBase64}')`;
      }

    } catch (err) {
      alert("Greška pri prijavi: " + err.message);
    }
  });

  /* -----------------------------
     UPLOAD
  ----------------------------- */
  document.getElementById("uploadBtn").addEventListener("click", async () => {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
      alert("Odaberi sliku!");
      return;
    }

    if (!userCafeId) {
      alert("Nisi logiran!");
      return;
    }

    try {
      const base64 = await pretvoriSlikuUBase64(file);

      await setDoc(
        doc(db, "cafes", userCafeId),
        { backgroundBase64: base64 },
        { merge: true }
      );

      document.body.style.backgroundImage =
        `url('data:image/png;base64,${base64}')`;

      alert("Pozadina uspješno ažurirana!");

    } catch (err) {
      alert("Greška: " + err.message);
    }
  });
}
