// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

  signInAnonymously(auth)
    .then(() => console.log("Usuário anônimo logado"))
    .catch((err) => console.error(err));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user.uid;
      renderMissions();
    }
  });

  async function renderMissions() {
    const container = document.getElementById("missions");
    container.innerHTML = "";

    const snapshot = await getDocs(missionsCollection);
    let allMissions = [];
    snapshot.forEach(docSnap => allMissions.push({ ...docSnap.data(), id: docSnap.id }));

    allMissions.sort((a, b) => dayOrder[a.missionDay] - dayOrder[b.missionDay]);

    allMissions.forEach(m => {
      const div = document.createElement("div");
      div.className = "mission";
      div.style.opacity = 0;

      const prazo = m.acceptDeadline ? m.acceptDeadline : "Prazo indeterminado";
      const participantesCount = m.participants ? m.participants.length : 0;
      const userAccepted = m.participants && m.participants.includes(currentUser);

      const acceptButton = (!userAccepted && participantesCount < m.maxPlayers)
        ? `<button type="button" onclick="acceptMission('${m.id}')">Aceitar Missão</button>`
        : userAccepted ? "<em>Você já aceitou esta missão</em>" : "<em>Máximo de participantes atingido</em>";

      const concludeButton = `<button type="button" onclick="concludeMission('${m.id}')">Concluir Missão</button>`;

      div.innerHTML = `
        <strong>${m.titulo}</strong><br>
        Nível: ${m.levelMin} - ${m.levelMax}<br>
        Dia da missão: ${m.missionDay}<br>
        Prazo para aceitar: ${prazo}<br>
        Participantes: ${participantesCount} / ${m.maxPlayers}<br>
        ${acceptButton}<br>
        ${concludeButton}
      `;

      container.appendChild(div);
      setTimeout(() => { div.style.opacity = 1; }, 50);

      if (m.acceptDeadline) {
        const today = new Date();
        const deadlineDate = new Date(m.acceptDeadline);
        const diffDays = (deadlineDate - today) / (1000*60*60*24);
        if (diffDays <= 2) div.classList.add("prazo-proximo");
      }
    });
  }

  async function addMission() {
    const titulo = document.getElementById("mission-title").value.trim();
    const levelMin = parseInt(document.getElementById("level-min").value);
    const levelMax = parseInt(document.getElementById("level-max").value);
    const missionDay = document.getElementById("mission-day").value;
    const acceptDeadline = document.getElementById("accept-deadline").value;
    const minPlayers = parseInt(document.getElementById("min-players").value);
    const maxPlayers = parseInt(document.getElementById("max-players").value);

    if (!titulo || isNaN(levelMin) || isNaN(levelMax) || levelMin > levelMax
        || !missionDay || isNaN(minPlayers) || isNaN(maxPlayers) || minPlayers > maxPlayers) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    await addDoc(missionsCollection, {
      titulo, levelMin, levelMax, missionDay,
      acceptDeadline: acceptDeadline || null,
      minPlayers, maxPlayers, participants: []
    });

    document.getElementById("mission-title").value = "";
    document.getElementById("level-min").value = "";
    document.getElementById("level-max").value = "";
    document.getElementById("mission-day").value = "Segunda-feira";
    document.getElementById("accept-deadline").value = "";
    document.getElementById("min-players").value = "";
    document.getElementById("max-players").value = "";

    renderMissions();
  }

  window.acceptMission = async function(id) {
    const missionDoc = doc(db, "missions", id);
    const snapshot = await getDocs(missionsCollection);
    let mData;
    snapshot.forEach(docSnap => { if(docSnap.id===id)mData={...docSnap.data(), id:docSnap.id}; });

    if(!mData) return;
    if(mData.participants.includes(currentUser)) return alert("Você já aceitou!");
    if(mData.participants.length>=mData.maxPlayers) return alert("Máximo de participantes atingido!");

    await updateDoc(missionDoc, { participants: [...mData.participants,currentUser] });
    renderMissions();
  }

  window.concludeMission = async function(id){
    if(!confirm("Deseja realmente concluir esta missão?")) return;
    await deleteDoc(doc(db,"missions",id));
    renderMissions();
  }

  document.getElementById("add-mission").addEventListener("click", addMission);
  renderMissions();

});
