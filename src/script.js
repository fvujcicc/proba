import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
  appId: "1:454296208579:web:f666c4beaaaa683c410e76",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ---------------------------------------------------
   HELPER — Dohvati cafeId iz URL-a
--------------------------------------------------- */
function getCafeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const keys = [...params.keys()];
  return keys.length ? keys[0] : null;
}

const cafeIdURL = getCafeIdFromUrl();

/* ---------------------------------------------------
   CUSTOMER VIEW
--------------------------------------------------- */
if (cafeIdURL) {
  document.getElementById("customerView").style.display = "block";

  (async () => {
    try {
      const snap = await getDoc(doc(db, "cafes", cafeIdURL));
      if (!snap.exists()) return;

      const data = snap.data();

      // Ime kafića
      if (data.name) {
        const card = document.getElementById("cafeCard");
        card.style.display = "block";
        document.getElementById("cafeName").textContent = data.name;
      }

      // Background slika
      if (data.backgroundPath) {
        const pathWithExtension = data.backgroundPath.includes(".")
          ? data.backgroundPath
          : `${data.backgroundPath}.png`; // ili .jpg ako je potrebno

        const storageRef = ref(storage, pathWithExtension);

        try {
          const url = await getDownloadURL(storageRef);
          document.body.style.backgroundImage = `url('${url}')`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
        } catch (err) {
          console.log("Slika ne postoji u Storage-u:", err.message);
        }
      }
    } catch (err) {
      console.error("Greška pri dohvaćanju podataka kafića:", err);
    }
  })();
}

/* ---------------------------------------------------
   ADMIN VIEW
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
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));

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
    if (!file) return alert("Odaberi sliku!");
    if (!userCafeId) return alert("Nisi logiran!");

    try {
      const fileExtension = file.name.split(".").pop();
      const storageRef = ref(storage, `backgrounds/${userCafeId}.${fileExtension}`);

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      await setDoc(
        doc(db, "cafes", userCafeId),
        {
          backgroundUrl: url,
          backgroundPath: `backgrounds/${userCafeId}.${fileExtension}`
        },
        { merge: true }
      );

      document.body.style.background = `url('${url}') center center / cover no-repeat`;
      alert("Pozadina uspješno ažurirana!");
    } catch (err) {
      alert("Greška pri uploadu: " + err.message);
    }
  });
}
