// ==============================
// FIREBASE IMPORTS
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==============================
// CONFIGURAÇÃO (MANTENHA A SUA)
// ==============================
const firebaseConfig = {
  apiKey: "AIzaSyD6uk2FMJYzurdmGC9pUkGIznCHn19HjCA", // Use suas credenciais reais
  authDomain: "mesaorganizada-6894b.firebaseapp.com",
  projectId: "mesaorganizada-6894b",
  storageBucket: "mesaorganizada-6894b.firebasestorage.app",
  messagingSenderId: "217444951338",
  appId: "1:217444951338:web:9b506527cd29f523a92a53"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const missionsCollection = collection(db, "missions");

let currentUser = null;
let currentUserData = null;
let userCharacters = []; // Lista local de personagens do usuário

// ==============================
// FUNÇÕES AUXILIARES
// ==============================
async function loadUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function loadUserCharacters(uid) {
  // Busca a subcoleção de personagens do usuário
  const charsRef = collection(db, "users", uid, "characters");
  const snap = await getDocs(charsRef);
  const chars = [];
  snap.forEach(d => chars.push({ ...d.data(), id: d.id }));
  return chars;
}

// ==============================
// DOM LOADED
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-container");
  const appContainer = document.getElementById("app-container");
  const welcomeUser = document.getElementById("welcome-user");

  // AUTH BOTOES
  document.getElementById("register-btn")?.addEventListener("click", registerUser);
  document.getElementById("login-btn")?.addEventListener("click", loginUser);
  document.getElementById("logout-btn")?.addEventListener("click", () => signOut(auth));

  // APP BOTOES
  document.getElementById("add-mission")?.addEventListener("click", createMission);
  document.getElementById("create-char-btn")?.addEventListener("click", createCharacter);

  // ==============================
  // AUTH STATE LISTENER
  // ==============================
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userData = await loadUserData(user.uid);
      
      if (!userData) {
        // Fallback se o user criou conta mas não salvou no Firestore por erro
        currentUserData = { uid: user.uid, email: user.email, name: "Aventureiro" };
      } else {
        currentUserData = { ...userData, uid: user.uid };
      }

      authContainer.style.display = "none";
      appContainer.style.display = "block";
      welcomeUser.innerText = `Olá, ${currentUserData.name}!`;

      // Carregar dados
      await refreshData();

    } else {
      currentUser = null;
      userCharacters = [];
      authContainer.style.display = "block";
      appContainer.style.display = "none";
    }
  });
});

async function refreshData() {
  if(!currentUser) return;
  userCharacters = await loadUserCharacters(currentUser.uid);
  renderCharacters();
  renderMissions();
}

// ==============================
// AUTH FUNCTIONS
// ==============================
async function registerUser() {
  const name = document.getElementById("auth-name").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();

  if (!name || !email || !password) return alert("Preencha todos os campos.");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email, createdAt: serverTimestamp()
    });
  } catch (error) {
    alert("Erro ao criar conta: " + error.message);
  }
}

async function loginUser() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    alert("Dados inválidos.");
  }
}

// ==============================
// PERSONAGENS (NOVO)
// ==============================
async function createCharacter() {
  const name = document.getElementById("char-name").value.trim();
  const classe = document.getElementById("char-class").value.trim();
  const level = Number(document.getElementById("char-level").value);

  if (!name || !classe || !level) return alert("Preencha os dados do personagem.");

  try {
    await addDoc(collection(db, "users", currentUser.uid, "characters"), {
      name, classe, level,
      status: "Disponível", // "Disponível" ou "Em Missão"
      currentMissionId: null
    });
    
    // Limpar campos e recarregar
    document.getElementById("char-name").value = "";
    document.getElementById("char-class").value = "";
    document.getElementById("char-level").value = "";
    
    await refreshData();
  } catch (e) {
    console.error(e);
    alert("Erro ao criar personagem.");
  }
}

function renderCharacters() {
  const container = document.getElementById("characters-list");
  container.innerHTML = "";

  userCharacters.forEach(char => {
    const div = document.createElement("div");
    div.className = `char-card status-${char.status === 'Disponível' ? 'free' : 'busy'}`;
    
    div.innerHTML = `
      <strong>${char.name}</strong> <small>(Lv. ${char.level} ${char.classe})</small>
      <br>Status: ${char.status}
    `;
    container.appendChild(div);
  });
}

// ==============================
// MISSÕES
// ==============================
async function createMission() {
  const titulo = document.getElementById("mission-title").value.trim();
  const levelMin = Number(document.getElementById("level-min").value);
  const levelMax = Number(document.getElementById("level-max").value);
  const missionDay = document.getElementById("mission-day").value;
  const missionTime = document.getElementById("mission-time").value;
  const acceptDeadline = document.getElementById("accept-deadline").value || null;
  const minPlayers = Number(document.getElementById("min-players").value);
  const maxPlayers = Number(document.getElementById("max-players").value);

  if (!titulo || !missionDay || !missionTime) return alert("Preencha os dados obrigatórios.");

  await addDoc(missionsCollection, {
    titulo, levelMin, levelMax, missionDay, missionTime, acceptDeadline,
    minPlayers, maxPlayers,
    participants: [], // Array de objetos { charId, charName, userUid }
    creatorUid: currentUser.uid,
    creatorName: currentUserData.name,
    status: "Aberto",
    createdAt: serverTimestamp()
  });

  document.getElementById("new-mission-form").querySelectorAll("input").forEach(i => i.value = "");
  renderMissions();
}

async function renderMissions() {
  const container = document.getElementById("missions");
  container.innerHTML = "";
  
  const snapshot = await getDocs(missionsCollection);
  
  snapshot.forEach(docSnap => {
    const m = { ...docSnap.data(), id: docSnap.id };
    const div = document.createElement("div");
    div.className = "mission";
    
    // Lista de participantes
    const partsList = m.participants.map(p => `<span class="badge">${p.charName} (Lv.${p.charLevel})</span>`).join(" ");
    const userAlreadyIn = m.participants.some(p => p.userUid === currentUser.uid);
    const isFull = m.participants.length >= m.maxPlayers;
    const isCreator = m.creatorUid === currentUser.uid;

    // Lógica do botão de aceitar
    let actionArea = "";

    if (isCreator) {
      actionArea = `<button class="btn-conclude" onclick="concludeMission('${m.id}')">Concluir Missão</button>`;
    } else if (userAlreadyIn) {
      // Se o usuário já tem um personagem nessa missão, mostra botão de sair
      // (Para simplificar, deixarei apenas texto, mas você pode implementar 'sair')
      actionArea = `<em>Seu personagem já está inscrito.</em>`;
    } else if (!isFull) {
      // Dropdown para escolher personagem
      // Filtra personagens: Deve estar Disponível E dentro do range de nível
      const validChars = userCharacters.filter(c => 
        c.status === "Disponível" && 
        c.level >= m.levelMin && 
        c.level <= m.levelMax
      );

      if (validChars.length > 0) {
        let options = validChars.map(c => `<option value="${c.id}">${c.name} (Lv.${c.level})</option>`).join("");
        actionArea = `
          <div class="accept-area">
            <select id="select-char-${m.id}">
              ${options}
            </select>
            <button class="btn-accept" onclick="acceptMission('${m.id}')">Aceitar</button>
          </div>
        `;
      } else {
        actionArea = `<em style="color:red">Você não tem personagens disponíveis neste nível (${m.levelMin}-${m.levelMax}).</em>`;
      }
    } else {
      actionArea = `<em>Missão Cheia</em>`;
    }

    div.innerHTML = `
      <div class="mission-header">
        <h3>${m.titulo}</h3>
        <small>Mestre: ${m.creatorName}</small>
      </div>
      <div class="mission-details">
        <p>📅 ${m.missionDay} às ${m.missionTime}</p>
        <p>📊 Nível: ${m.levelMin} - ${m.levelMax} | 👥 Vagas: ${m.participants.length}/${m.maxPlayers}</p>
        <div class="participants-list">
          <strong>Aventureiros:</strong><br>
          ${partsList || "Nenhum ainda"}
        </div>
      </div>
      <div class="mission-actions">
        ${actionArea}
      </div>
    `;
    container.appendChild(div);
  });
}

// ==============================
// GLOBAL FUNCTIONS (Para onclick)
// ==============================
window.acceptMission = async function(missionId) {
  const select = document.getElementById(`select-char-${missionId}`);
  if (!select) return;
  
  const charId = select.value;
  const character = userCharacters.find(c => c.id === charId);

  if (!character) return alert("Personagem inválido.");

  try {
    const missionRef = doc(db, "missions", missionId);
    const charRef = doc(db, "users", currentUser.uid, "characters", charId);

    // 1. Atualizar Missão
    const missionSnap = await getDoc(missionRef);
    const missionData = missionSnap.data();
    
    const newParticipant = {
      userUid: currentUser.uid,
      charId: charId,
      charName: character.name,
      charLevel: character.level,
      charClass: character.classe
    };

    await updateDoc(missionRef, {
      participants: [...missionData.participants, newParticipant]
    });

    // 2. Atualizar Status do Personagem
    await updateDoc(charRef, {
      status: "Em Missão",
      currentMissionId: missionId
    });

    alert(`O personagem ${character.name} aceitou a missão!`);
    await refreshData(); // Recarrega tudo

  } catch (err) {
    console.error(err);
    alert("Erro ao aceitar missão.");
  }
};

window.concludeMission = async function(missionId) {
  if (!confirm("Concluir missão? Isso liberará todos os personagens.")) return;

  try {
    const missionRef = doc(db, "missions", missionId);
    const missionSnap = await getDoc(missionRef);
    const missionData = missionSnap.data();

    // Liberar status dos personagens participantes
    for (const p of missionData.participants) {
      const charRef = doc(db, "users", p.userUid, "characters", p.charId);
      // O ideal seria usar batch write ou transaction, mas faremos simples aqui
      await updateDoc(charRef, {
        status: "Disponível",
        currentMissionId: null
      }).catch(e => console.log("Erro ao liberar char", e));
    }

    // Deletar missão
    await deleteDoc(missionRef);
    await refreshData();
  } catch (e) {
    console.error(e);
    alert("Erro ao concluir.");
  }
};
