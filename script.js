// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD6uk2FMJYzurdmGC9pUkGIznCHn19HjCA",
  authDomain: "mesaorganizada-6894b.firebaseapp.com",
  projectId: "mesaorganizada-6894b",
  storageBucket: "mesaorganizada-6894b.firebasestorage.app",
  messagingSenderId: "217444951338",
  appId: "1:217444951338:web:9b506527cd29f523a92a53"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {

  const missionsCollection = collection(db, "missions");
  let currentUser = null;

  const dayOrder = {
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    "Sábado": 6,
    "Domingo": 7
  };

  // Usuário logado (email/senha virá depois)
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Você precisa estar logado.");
      return;
    }
    currentUser = user;
    renderMissions();
  });

  // =========================
  // RENDERIZAR MISSÕES
  // =========================
  async function renderMissions() {
    const container = document.getElementById("missions");
    container.innerHTML = "";

    const snapshot = await getDocs(missionsCollection);
    let allMissions = [];
    snapshot.forEach(docSnap =>
      allMissions.push({ ...docSnap.data(), id: docSnap.id })
    );

    allMissions.sort((a, b) => dayOrder[a.missionDay] - dayOrder[b.missionDay]);

    allMissions.forEach(m => {
      const div = document.createElement("div");
      div.className = "mission";

      const prazo = m.acceptDeadline || "Prazo indeterminado";
      const participantesCount = m.participants.length;

      const userAccepted = m.participants.some(p => p.uid === currentUser.uid);

      const acceptButton =
        (!userAccepted && participantesCount < m.maxPlayers)
          ? `<button onclick="acceptMission('${m.id}')">Aceitar Missão</button>`
          : userAccepted
            ? "<em>Você já aceitou</em>"
            : "<em>Missão completa</em>";

      const concludeButton =
        m.creatorId === currentUser.uid
          ? `<button onclick="concludeMission('${m.id}')">Concluir Missão</button>`
          : "";

      const participantNames = m.participants
        .map(p => p.name)
        .join(", ");

      div.innerHTML = `
        <strong>${m.titulo}</strong><br>
        <small>Mestre: ${m.creatorName}</small><br><br>

        Nível: ${m.levelMin} - ${m.levelMax}<br>
        Dia da missão: ${m.missionDay}<br>
        Horário: ${m.missionTime}<br>
        Prazo para aceitar: ${prazo}<br>
        Participantes: ${participantesCount} / ${m.maxPlayers}<br>
        <small>${participantNames}</small><br><br>

        ${acceptButton}<br>
        ${concludeButton}
      `;

      container.appendChild(div);
    });
  }

  // =========================
  // ADICIONAR MISSÃO
  // =========================
  async function addMission() {
    const titulo = document.getElementById("mission-title").value.trim();
    const levelMin = Number(document.getElementById("level-min").value);
    const levelMax = Number(document.getElementById("level-max").value);
    const missionDay = document.getElementById("mission-day").value;
    const missionTime = document.getElementById("mission-time").value;
    const acceptDeadline = document.getElementById("accept-deadline").value;
    const minPlayers = Number(document.getElementById("min-players").value);
    const maxPlayers = Number(document.getElementById("max-players").value);

    if (!titulo || !missionTime || levelMin > levelMax || minPlayers > maxPlayers) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    await addDoc(missionsCollection, {
      titulo,
      levelMin,
      levelMax,
      missionDay,
      missionTime,
      acceptDeadline: acceptDeadline || null,
      minPlayers,
      maxPlayers,

      creatorId: currentUser.uid,
      creatorName: currentUser.displayName || currentUser.email,
      creatorEmail: currentUser.email,

      participants: []
    });

    renderMissions();
  }

  // =========================
  // ACEITAR MISSÃO
  // =========================
  window.acceptMission = async function(id) {
    const missionRef = doc(db, "missions", id);
    const snapshot = await getDocs(missionsCollection);

    let mission;
    snapshot.forEach(d => {
      if (d.id === id) mission = { ...d.data(), id: d.id };
    });

    if (!mission) return;

    if (mission.participants.some(p => p.uid === currentUser.uid)) {
      alert("Você já aceitou essa missão.");
      return;
    }

    if (mission.participants.length >= mission.maxPlayers) {
      alert("Missão cheia.");
      return;
    }

    await updateDoc(missionRef, {
      participants: [
        ...mission.participants,
        {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          email: currentUser.email
        }
      ]
    });

    renderMissions();
  };

  // =========================
  // CONCLUIR MISSÃO
  // =========================
  window.concludeMission = async function(id) {
    if (!confirm("Concluir missão?")) return;
    await deleteDoc(doc(db, "missions", id));
    renderMissions();
  };

  document.getElementById("add-mission")
    .addEventListener("click", addMission);

});
