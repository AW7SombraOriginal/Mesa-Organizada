// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// Teste simples
console.log("Firebase conectado com sucesso");

// Missões Abaixo

// Lista de missões
let missions = [];

// Renderizar missões
function renderMissions() {
  const container = document.getElementById("missions");
  container.innerHTML = "";

  missions.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "mission";

    // Prazo indeterminado caso vazio
    const prazo = m.acceptDeadline ? m.acceptDeadline : "Prazo indeterminado";

    div.innerHTML = `
      <strong>${m.titulo}</strong><br>
      Nível: ${m.levelMin} - ${m.levelMax}<br>
      Dia da missão: ${m.missionDay}<br>
      Prazo para aceitar: ${prazo}<br>
      Participantes: ${m.minPlayers} - ${m.maxPlayers}
      <br><button type="button" onclick="acceptMission(${index})">Aceitar Missão</button>
    `;

    container.appendChild(div);
  });
}

// Adicionar missão
function addMission() {
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

  // Validação
  if (!titulo || isNaN(levelMin) || isNaN(levelMax) || levelMin > levelMax
      || !missionDay || isNaN(minPlayers) || isNaN(maxPlayers) || minPlayers > maxPlayers) {
    alert("Por favor, preencha corretamente todos os campos!");
    return;
  }

  // Adiciona missão com lista de participantes vazia
  missions.push({
    titulo,
    levelMin,
    levelMax,
    missionDay,
    acceptDeadline,
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
function acceptMission(index) {
  const mission = missions[index];

  // Limite de participantes
  if (mission.participants.length >= mission.maxPlayers) {
    alert("Essa missão já atingiu o número máximo de participantes!");
    return;
  }

  // Para teste, adicionamos um usuário fictício
  mission.participants.push("Usuário");

  alert(`Você aceitou a missão "${mission.titulo}". Total de participantes: ${mission.participants.length}`);

  renderMissions();
}

// Inicializar
document.getElementById("add-mission").addEventListener("click", addMission);
renderMissions();
