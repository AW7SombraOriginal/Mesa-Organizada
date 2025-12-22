// ==============================
// FIREBASE IMPORTS
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==============================
// FIREBASE CONFIG
// ==============================
const firebaseConfig = {
  apiKey: "AIzaSyD6uk2FMJYzurdmGC9pUkGIznCHn19HjCA",
  authDomain: "mesaorganizada-6894b.firebaseapp.com",
  projectId: "mesaorganizada-6894b",
  storageBucket: "mesaorganizada-6894b.firebasestorage.app",
  messagingSenderId: "217444951338",
  appId: "1:217444951338:web:9b506527cd29f523a92a53"
};

// ==============================
// INIT
// ==============================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const missionsCollection = collection(db, "missions");

let currentUser = null;
let currentUserData = null;

// ==============================
// LOAD USER DATA
// ==============================
async function loadUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ==============================
// DOM LOADED
// ==============================
document.addEventListener("DOMContentLoaded", () => {

  const authContainer = document.getElementById("auth-container");
  const appContainer = document.getElementById("app-container");
  const welcomeUser = document.getElementById("welcome-user");

  const registerBtn = document.getElementById("register-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const addMissionBtn = document.getElementById("add-mission");

  // ==============================
  // AUTH STATE
  // ==============================
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;

      const userData = await loadUserData(user.uid);
      if (!userData) {
        alert("Erro ao carregar dados do usuário.");
        await signOut(auth);
        return;
      }

      currentUserData = {
        uid: user.uid,
        email: user.email,
        name: userData.name
      };

      authContainer.style.display = "none";
      appContainer.style.display = "block";
      welcomeUser.innerText = `Bem-vindo, ${currentUserData.name}!`;

      renderMissions();
    } else {
      currentUser = null;
      currentUserData = null;
      authContainer.style.display = "block";
      appContainer.style.display = "none";
    }
  });

  // ==============================
  // REGISTER
  // ==============================
  registerBtn?.addEventListener("click", async () => {
    const name = document.getElementById("auth-name").value.trim();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();

    if (!name || !email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      alert(error.message);
    }
  });

  // ==============================
  // LOGIN
  // ==============================
  loginBtn?.addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      alert("E-mail ou senha inválidos.");
    }
  });

  // ==============================
  // LOGOUT
  // ==============================
  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
  });

  // ==============================
  // ADD MISSION
  // ==============================
  addMissionBtn?.addEventListener("click", async () => {

    if (!currentUserData) {
      alert("Usuário ainda não carregado.");
      return;
    }

    const titulo = document.getElementById("mission-title").value.trim();
    const levelMin = Number(document.getElementById("level-min").value);
    const levelMax = Number(document.getElementById("level-max").value);
    const missionDay = document.getElementById("mission-day").value;
    const missionTime = document.getElementById("mission-time").value;
    const acceptDeadline = document.getElementById("accept-deadline").value || null;
    const minPlayers = Number(document.getElementById("min-players").value);
    const maxPlayers = Number(document.getElementById("max-players").value);

    if (!titulo || levelMin > levelMax || minPlayers > maxPlayers || !missionDay || !missionTime) {
      alert("Preencha os dados corretamente.");
      return;
    }

    await addDoc(missionsCollection, {
      titulo,
      levelMin,
      levelMax,
      missionDay,
      missionTime,
      acceptDeadline,
      minPlayers,
      maxPlayers,
      participants: [],
      creatorUid: currentUserData.uid,
      creatorName: currentUserData.name,
      createdAt: serverTimestamp()
    });

    document.getElementById("new-mission-form").reset();
    renderMissions();
  });

});

// ==============================
// RENDER MISSIONS
// ==============================
async function renderMissions() {
  if (!currentUser) return;

  const container = document.getElementById("missions");
  container.innerHTML = "";

  const snapshot = await getDocs(missionsCollection);

  snapshot.forEach(docSnap => {
    const m = { ...docSnap.data(), id: docSnap.id };

    const div = document.createElement("div");
    div.className = "mission";

    const prazo = m.acceptDeadline || "Prazo indeterminado";
    const participantsCount = m.participants.length;
    const alreadyJoined = m.participants.some(p => p.uid === currentUser.uid);

    let acceptButton = "";
    if (!alreadyJoined && participantsCount < m.maxPlayers) {
      acceptButton = `<button onclick="acceptMission('${m.id}')">Aceitar Missão</button>`;
    } else if (alreadyJoined) {
      acceptButton = `<em>Você já aceitou</em>`;
    } else {
      acceptButton = `<em>Missão cheia</em>`;
    }

    let concludeButton = "";
    if (m.creatorUid === currentUser.uid) {
      concludeButton = `<button onclick="concludeMission('${m.id}')">Concluir Missão</button>`;
    }

    const participantsNames = m.participants.map(p => `<small>${p.name}</small>`).join(", ");

    div.innerHTML = `
      <strong>${m.titulo}</strong><br>
      Mestre: ${m.creatorName}<br>
      Nível: ${m.levelMin} - ${m.levelMax}<br>
      Dia: ${m.missionDay} às ${m.missionTime}<br>
      Prazo: ${prazo}<br>
      Participantes: ${participantsCount} / ${m.maxPlayers}<br>
      ${participantsNames}<br><br>
      ${acceptButton}
      ${concludeButton}
    `;

    container.appendChild(div);
  });
}

// ==============================
// ACCEPT MISSION
// ==============================
window.acceptMission = async function (id) {
  const missionDoc = doc(db, "missions", id);
  const snapshot = await getDocs(missionsCollection);

  let mission;
  snapshot.forEach(docSnap => {
    if (docSnap.id === id) mission = { ...docSnap.data(), id: docSnap.id };
  });

  if (!mission) return;
  if (mission.participants.some(p => p.uid === currentUser.uid)) return;
  if (mission.participants.length >= mission.maxPlayers) {
    alert("Missão cheia.");
    return;
  }

  await updateDoc(missionDoc, {
    participants: [...mission.participants, currentUserData]
  });

  renderMissions();
};

// ==============================
// CONCLUDE MISSION
// ==============================
window.concludeMission = async function (id) {
  if (!confirm("Deseja concluir esta missão?")) return;
  await deleteDoc(doc(db, "missions", id));
  renderMissions();
};
