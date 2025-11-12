// === Firebase inicijalizacija ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// === Config tvojeg projekta ===
const firebaseConfig = {
  apiKey: "AIzaSyD5mgGodKXYkHXx0Yornd-WeaoK9BMnoQU",
  authDomain: "caffe-bar-project.firebaseapp.com",
  projectId: "caffe-bar-project",
  storageBucket: "caffe-bar-project.appspot.com",
  messagingSenderId: "454296208579",
  appId: "1:454296208579:web:f666c4beaaaa683c410e76"
};

// === Inicijalizacija servisa ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// === HTML elementi ===
const bgUpload = document.getElementById("bgUpload");
const changeBgBtn = document.getElementById("changeBgBtn");
const loginSection = document.getElementById("loginSection");
const logoutBtn = document.getElementById("logoutBtn");

// === Dohvati cafeId iz URL-a (za korisnike) ===
function getCafeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cafeId");
}

// === Prikaz pozadine ===
async function loadBackground(cafeId) {
  const cafeDoc = await getDoc(doc(db, "cafes", cafeId));
  if (cafeDoc.exists()) {
    document.body.style.backgroundImage = `url('${cafeDoc.data().backgroundUrl}')`;
  } else {
    console.log("Cafe not found");
  }
}

// === Kad se korisnik prijavi ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Dohvati njegov cafeId iz kolekcije users
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const cafeId = userDoc.exists() ? userDoc.data().cafeId : null;

    if (cafeId) {
      await loadBackground(cafeId);
      changeBgBtn.style.display = "block";
      loginSection.style.display = "none";
      logoutBtn.style.display = "inline-block";

      changeBgBtn.onclick = () => bgUpload.click();

      bgUpload.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return alert("Odaberi sliku!");

        const storageRef = ref(storage, `backgrounds/${cafeId}.jpg`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await setDoc(doc(db, "cafes", cafeId), { backgroundUrl: url }, { merge: true });
        document.body.style.backgroundImage = `url('${url}')`;
        alert("Pozadina uspješno promijenjena!");
      };
    } else {
      alert("Nema pridruženog cafeId za ovog korisnika!");
    }
  } else {
    // Korisnik nije prijavljen → koristi URL parametar
    const cafeId = getCafeIdFromUrl();
    if (cafeId) await loadBackground(cafeId);

    changeBgBtn.style.display = "none";
    loginSection.style.display = "block";
    logoutBtn.style.display = "none";
  }
});

// === Login forma ===
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Greška pri prijavi: " + error.message);
  }
});

// === Logout ===
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});
