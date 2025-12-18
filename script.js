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

const missions = [
  { titulo: "Explorar as ruínas", levelMin: 5, levelMax: 15 },
  { titulo: "Resgatar aldeão", levelMin: 3, levelMax: 10 },
  { titulo: "Caçar goblins", levelMin: 1, levelMax: 5 }
];

function renderMissions() {
  const container = document.getElementById("missions");
  container.innerHTML = "";

  missions.forEach(m => {
    const div = document.createElement("div");
    div.className = "mission";
    div.innerHTML = `
      <strong>${m.titulo}</strong><br>
      Nível: ${m.levelMin} - ${m.levelMax}
    `;
    container.appendChild(div);
  });
}

renderMissions();
