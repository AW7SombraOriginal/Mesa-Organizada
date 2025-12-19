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

// Lista de missões iniciais (para teste)
let missions = [
  { titulo: "Explorar as ruínas", levelMin: 5, levelMax: 15 },
  { titulo: "Resgatar aldeão", levelMin: 3, levelMax: 10 }
];

// Função para renderizar as missões
function renderMissions() {
  const container = document.getElementById("missions");
  container.innerHTML = ""; // Limpa o container

  missions.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "mission";
    div.innerHTML = `
      <strong>${m.titulo}</strong><br>
      Nível: ${m.levelMin} - ${m.levelMax}
    `;

    container.appendChild(div);
  });
}

// Função para adicionar nova missão
function addMission() {
  const titleInput = document.getElementById("mission-title");
  const levelMinInput = document.getElementById("level-min");
  const levelMaxInput = document.getElementById("level-max");
  const dateInput = document.getElementById("mission-date");
  const deadlineInput = document.getElementById("accept-deadline");
  const minPlayersInput = document.getElementById("min-players");
  const maxPlayersInput = document.getElementById("max-players");

  const titulo = titleInput.value.trim();
  const levelMin = parseInt(levelMinInput.value);
  const levelMax = parseInt(levelMaxInput.value);
  const missionDate = dateInput.value;
  const acceptDeadline = deadlineInput.value;
  const minPlayers = parseInt(minPlayersInput.value);
  const maxPlayers = parseInt(maxPlayersInput.value);

  // Validação básica
  if (!titulo || isNaN(levelMin) || isNaN(levelMax) || levelMin > levelMax
      || !missionDate || !acceptDeadline
      || isNaN(minPlayers) || isNaN(maxPlayers) || minPlayers > maxPlayers) {
    alert("Por favor, preencha corretamente todos os campos!");
    return;
  }

  // Adiciona a missão
  missions.push({
    titulo,
    levelMin,
    levelMax,
    missionDate,
    acceptDeadline,
    minPlayers,
    maxPlayers
  });

  // Limpa campos
  titleInput.value = "";
  levelMinInput.value = "";
  levelMaxInput.value = "";
  dateInput.value = "";
  deadlineInput.value = "";
  minPlayersInput.value = "";
  maxPlayersInput.value = "";

  renderMissions();
}
