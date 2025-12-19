// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

console.log("Firebase conectado com sucesso");

// ============================
// MISSÕES
// ============================

document.addEventListener("DOMContentLoaded", () => {

  const missionsCollection = collection(db, "missions");

  // Renderizar missões
  async function renderMissions() {
    const container = document.getElementById("missions");
    container.innerHTML = "";

    const snapshot = await getDocs(missionsCollection);
    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "mission";

      const prazo = m.acceptDeadline ? m.acceptDeadline : "Prazo indeterminado";
      const participantesCount = m.participants ? m.participants.length : 0;

      div.innerHTML = `
        <strong>${m.titulo}</strong><br>
        Nível: ${m.levelMin} - ${m.levelMax}<br>
        Dia da missão: ${m.missionDay}<br>
        Prazo para aceitar: ${prazo}<br>
        Participantes: ${participantesCount} / ${m.maxPlayers}<br>
        <button type="button" onclick="acceptMission('${id}')">Aceitar Missão</button>
      `;

      container.appendChild(div);
    });
  }

  // Adicionar missão
  async function addMission() {
    const titleInput = document.getElementById("mission-title");
    const levelMinInput = document.getElementById("level-min");
    const levelMaxInput = document.getElementById("level-max");
    const missionDayInput = document.getElementById("mission-day");
    const deadlineInput = document.getElementById("accept-deadline");
    const minPlayersInput = document.getElementById("min-players");
    const maxPlayersInput = document.getElementById("max-players");

    const titulo = titleInput.value.trim();
    const levelMin = parseInt(levelMinInput.value);
    const levelMax = parseInt(levelMaxInput.value);
    const missionDay = missionDayInput.value;
    const acceptDeadline = deadlineInput.value;
    const minPlayers = parseInt(minPlayersInput.value);
    const maxPlayers = parseInt(maxPlayersInput.value);

    if (!titulo || isNaN(levelMin) || isNaN(levelMax) || levelMin > levelMax
        || !missionDay || isNaN(minPlayers) || isNaN(maxPlayers) || minPlayers > maxPlayers) {
      alert("Por favor, preencha corretamente todos os campos!");
      return;
    }

    await addDoc(missionsCollection, {
      titulo,
      levelMin,
      levelMax,
      missionDay,
      acceptDeadline: acceptDeadline || null,
      minPlayers,
      maxPlayers,
      participants: []
    });

    // Limpar campos
    titleInput.value = "";
    levelMinInput.value = "";
    levelMaxInput.value = "";
    missionDayInput.value = "Segunda-feira";
    deadlineInput.value = "";
    minPlayersInput.value = "";
    maxPlayersInput.value = "";

    renderMissions();
  }

  // Aceitar missão
  window.acceptMission = async function(id) {
    const missionDoc = doc(db, "missions", id);
    const snapshot = await getDocs(missionsCollection);
    let missionData;
    snapshot.forEach(docSnap => {
      if (docSnap.id === id) missionData = docSnap.data();
    });

    if (!missionData) return;

    if (missionData.participants.length >= missionData.maxPlayers) {
      alert("Essa missão já atingiu o número máximo de participantes!");
      return;
    }

    const newParticipants = [...missionData.participants, "Usuário"];
    await updateDoc(missionDoc, { participants: newParticipants });

    alert(`Você aceitou a missão "${missionData.titulo}". Total de participantes: ${newParticipants.length}`);
    renderMissions();
  }

  // Inicializar
  document.getElementById("add-mission").addEventListener("click", addMission);
  renderMissions();

});
