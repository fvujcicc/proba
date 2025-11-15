import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ---------------------------------------------------
   🔧 FIREBASE CONFIG 
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
const storage = getStorage(app);

/* ---------------------------------------------------
   CUSTOMER VIEW — URL ima cafeId
--------------------------------------------------- */
function getCafeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const keys = [...params.keys()];
  if (keys.length === 0) return null;
  return keys[0];
}

const cafeIdURL = getCafeIdFromUrl();

if (cafeIdURL) {
  // CUSTOMER MODE
  document.getElementById("customerView").style.display = "block";

  (async () => {
    const cafeRef = doc(db, "cafes", cafeIdURL);
    const snap = await getDoc(cafeRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.backgroundUrl) {
        document.body.style.backgroundImage = `url('${data.backgroundUrl}')`;
      }

      if (data.name) {
        const card = document.getElementById("cafeCard");
        card.style.display = "block";
        document.getElementById("cafeName").textContent = data.name;
      }
    } else {
      console.log("Cafe not found in Firestore.");
    }
  })();
}

/* ---------------------------------------------------
   ADMIN MODE — root stranica (nema cafeId)
--------------------------------------------------- */
else {
  const adminPanel = document.getElementById("adminPanel");
  const loginBox = document.getElementById("loginBox");
  const uploadBox = document.getElementById("uploadBox");

  adminPanel.style.display = "block";

  let userCafeId = null;

  // LOGIN
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("Nemaš dodijeljen kafić u Firestore! Javite se administratoru.");
        return;
      }

      userCafeId = userDoc.data().cafeId;

      loginBox.style.display = "none";
      uploadBox.style.display = "block";

    } catch (err) {
      alert("Greška pri prijavi: " + err.message);
    }
  });

  // UPLOAD
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
      const storageRef = ref(storage, `backgrounds/${userCafeId}.jpg`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await setDoc(doc(db, "cafes", userCafeId), { backgroundUrl: url }, { merge: true });

      document.body.style.backgroundImage = `url('${url}')`;
      alert("Pozadina uspješno ažurirana!");

    } catch (err) {
      alert("Greška pri uploadu: " + err.message);
    }
  });
}
