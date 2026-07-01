/**
 * PlayGio.AI - Frontend für Battleship Spiel
 * ==========================================
 * Kommuniziert mit dem Python-Backend auf Port 5000
 * 
 * NUTZUNG:
 * 1. Server starten: python battleship_ai_server.py
 * 2. Diese Datei in index.html laden: <script src="playgio-frontend.js"></script>
 * 3. Button klicken: onclick="launchPlayGio()"
 */

// ============================================================================
// GLOBALE VARIABLEN
// ============================================================================

let currentGameId = null;  // Die aktuelle Spiel-ID vom Server
let gameMode = "placement";  // placement, playing, gameOver
let shipsToPlace = [];  // Schiffe die noch platziert werden müssen
let currentShipIndex = 0;  // Welches Schiff gerade platziert wird

// API Server URL (lokal auf Port 5000)
const API_BASE_URL = "http://localhost:5000";

// ============================================================================
// KONSTANTEN
// ============================================================================

const GRID_SIZE = 10;
const SHIPS = [
  { name: "Carrier (5)", size: 5, color: "#FF6B6B" },
  { name: "Battleship (4)", size: 4, color: "#4ECDC4" },
  { name: "Cruiser (3)", size: 3, color: "#45B7D1" },
  { name: "Submarine (3)", size: 3, color: "#96CEB4" },
  { name: "Destroyer (2)", size: 2, color: "#FFEAA7" }
];


// ============================================================================
// HAUPT-FUNKTIONEN
// ============================================================================

/**
 * Startet das Spiel: öffnet Modal und initialisiert neues Game
 */
async function launchPlayGio() {
  console.log("🎮 PlayGio.AI wird gestartet...");
  
  // Prüfe ob Server erreichbar ist
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("Server nicht erreichbar");
  } catch (err) {
    alert("❌ Fehler: Server läuft nicht!\n\nBitte starten Sie:\npython battleship_ai_server.py");
    return;
  }
  
  // Modal öffnen
  createGameModal();
  
  // Neues Spiel vom Server starten
  await startNewGame();
}


/**
 * Startet ein neues Spiel am Server
 */
async function startNewGame() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    const data = await response.json();
    currentGameId = data.game_id;
    gameMode = "placement";
    shipsToPlace = [...SHIPS];
    currentShipIndex = 0;
    
    console.log(`✅ Neues Spiel erstellt: ${currentGameId}`);
    updateGameUI();
  } catch (err) {
    console.error("❌ Fehler beim Starten:", err);
    alert("Fehler beim Starten des Spiels");
  }
}


/**
 * Erstellt die HTML Modal für das Spiel
 */
function createGameModal() {
  // Entferne alte Modal wenn vorhanden
  const oldModal = document.getElementById("playgio-modal");
  if (oldModal) oldModal.remove();
  
  // Neue Modal
  const modal = document.createElement("div");
  modal.id = "playgio-modal";
  modal.className = "playgio-modal";
  
  modal.innerHTML = `
    <div class="playgio-overlay"></div>
    <div class="playgio-container">
      <div class="playgio-header">
        <h2>⚓ PlayGio.AI - Schiffeversenken</h2>
        <button class="playgio-close" onclick="closePlayGio()">✕</button>
      </div>
      
      <div class="playgio-body">
        <!-- Spielzustand Anzeige -->
        <div id="game-status" class="game-status">
          Verbinde mit Server...
        </div>
        
        <!-- Gitter Container -->
        <div class="grids-container">
          <div class="grid-section">
            <h3>Dein Board (Schiffe platzieren)</h3>
            <div id="player-grid" class="game-grid"></div>
          </div>
          
          <div class="grid-section">
            <h3>Gegner Board (Attackieren)</h3>
            <div id="enemy-grid" class="game-grid"></div>
          </div>
        </div>
        
        <!-- Aktuelle Schiff Info -->
        <div id="ship-info" class="ship-info"></div>
        
        <!-- Kontrollen -->
        <div class="playgio-controls">
          <button id="btn-random" class="playgio-btn btn-secondary" onclick="randomPlaceShips()">
            🎲 Zufällig platzieren
          </button>
          <button id="btn-ready" class="playgio-btn" onclick="startPlaying()" style="display:none;">
            ⚔️ Spiel starten
          </button>
          <button id="btn-reset" class="playgio-btn btn-secondary" onclick="resetPlacement()" style="display:none;">
            ↻ Neu platzieren
          </button>
        </div>
        
        <!-- Spielergebnis -->
        <div id="game-result" class="game-result" style="display:none;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  addPlayGioStyles();
}


/**
 * Fügt CSS Styles in die Seite ein
 */
function addPlayGioStyles() {
  if (document.getElementById("playgio-styles")) return;
  
  const style = document.createElement("style");
  style.id = "playgio-styles";
  style.textContent = `
    /* ===== MODAL OVERLAY ===== */
    .playgio-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Times New Roman", Times, serif;
    }
    
    .playgio-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: -1;
    }
    
    /* ===== CONTAINER ===== */
    .playgio-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 1000px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 1;
    }
    
    /* ===== HEADER ===== */
    .playgio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .playgio-header h2 {
      margin: 0;
      font-size: 24px;
    }
    
    .playgio-close {
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    
    .playgio-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    /* ===== BODY ===== */
    .playgio-body {
      padding: 24px;
    }
    
    /* ===== STATUS ANZEIGE ===== */
    .game-status {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-weight: bold;
      color: #333;
    }
    
    /* ===== GITTER CONTAINER ===== */
    .grids-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .grid-section h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #333;
    }
    
    /* ===== SPIELGITTER ===== */
    .game-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 2px;
      background: #ddd;
      padding: 4px;
      border-radius: 6px;
      max-width: 400px;
    }
    
    .grid-cell {
      width: 35px;
      height: 35px;
      background: #e8f0fe;
      border: 1px solid #ccc;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    
    .grid-cell:hover {
      background: #d0e0ff;
      transform: scale(1.05);
    }
    
    /* Schiff platziert */
    .grid-cell.ship {
      background: #4ECDC4;
      color: white;
      border-color: #2a9d8f;
    }
    
    /* Treffer */
    .grid-cell.hit {
      background: #ff6b6b !important;
      color: white;
      border-color: #d32f2f;
    }
    
    /* Verfehlung */
    .grid-cell.miss {
      background: #95a5a6 !important;
      color: white;
      border-color: #7f8c8d;
    }
    
    /* Nicht angegriffen (Gegner Board) */
    .grid-cell.unknown {
      background: #e8f0fe;
    }
    
    /* ===== SCHIFF INFO ===== */
    .ship-info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      color: #856404;
      text-align: center;
      font-weight: bold;
    }
    
    /* ===== KONTROLLEN ===== */
    .playgio-controls {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .playgio-btn {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      font-family: "Times New Roman", Times, serif;
    }
    
    .playgio-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .playgio-btn:active {
      transform: translateY(0);
    }
    
    /* Primary Button */
    .playgio-btn:not(.btn-secondary) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    /* Secondary Button */
    .btn-secondary {
      background: #f0f0f3;
      color: #333;
      border: 2px solid #ddd;
    }
    
    .btn-secondary:hover {
      background: #e0e0e3;
    }
    
    /* ===== SPIELERGEBNIS ===== */
    .game-result {
      background: #f8f9fa;
      border: 2px solid #ddd;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 20px;
    }
    
    .game-result h3 {
      margin: 0 0 12px 0;
      font-size: 28px;
    }
    
    .game-result.win {
      border-color: #28a745;
      background: #d4edda;
      color: #155724;
    }
    
    .game-result.lose {
      border-color: #dc3545;
      background: #f8d7da;
      color: #721c24;
    }
    
    /* ===== RESPONSIVE ===== */
    @media (max-width: 800px) {
      .grids-container {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      
      .playgio-container {
        width: 95%;
        max-height: 95vh;
      }
      
      .playgio-header h2 {
        font-size: 20px;
      }
      
      .game-grid {
        max-width: 100%;
      }
    }
  `;
  
  document.head.appendChild(style);
}


/**
 * Aktualisiert die Spieloberfläche
 */
function updateGameUI() {
  const statusEl = document.getElementById("game-status");
  const shipInfoEl = document.getElementById("ship-info");
  const playerGridEl = document.getElementById("player-grid");
  const enemyGridEl = document.getElementById("enemy-grid");
  const btnReady = document.getElementById("btn-ready");
  const btnReset = document.getElementById("btn-reset");
  const btnRandom = document.getElementById("btn-random");
  
  if (gameMode === "placement") {
    const ship = shipsToPlace[currentShipIndex];
    
    if (ship) {
      statusEl.textContent = `📍 Platziere: ${ship.name}`;
      shipInfoEl.innerHTML = `
        <div>Klicke auf das Gitter um ${ship.name} zu platzieren</div>
        <div style="font-size: 12px; margin-top: 8px;">
          Fortschritt: ${currentShipIndex + 1}/${shipsToPlace.length}
        </div>
      `;
      btnReady.style.display = "none";
      btnReset.style.display = "inline-block";
    } else {
      statusEl.textContent = "✅ Alle Schiffe platziert!";
      shipInfoEl.textContent = "Klicke 'Spiel starten' um zu beginnen.";
      btnReady.style.display = "inline-block";
      btnReset.style.display = "inline-block";
      btnRandom.style.display = "none";
    }
  } else if (gameMode === "playing") {
    statusEl.textContent = "⚔️ Spiel läuft - Klicke auf das Gegner-Board um anzugreifen!";
    shipInfoEl.textContent = "Dein Zug!";
    btnReady.style.display = "none";
    btnReset.style.display = "none";
    btnRandom.style.display = "none";
  }
  
  // Zeichne Gitter
  renderPlayerGrid(playerGridEl);
  renderEnemyGrid(enemyGridEl);
}


/**
 * Zeichnet das eigene Gitter mit platzierten Schiffen
 */
function renderPlayerGrid(container) {
  container.innerHTML = "";
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      
      // Prüfe ob hier ein Schiff ist
      const hasShip = window.playerShips && window.playerShips.some(
        ship => ship.cells.some(c => c.row === row && c.col === col)
      );
      
      if (hasShip) {
        cell.classList.add("ship");
        cell.textContent = "🚢";
      }
      
      // Klick-Handler für Schiffplatzierung
      if (gameMode === "placement") {
        cell.style.cursor = "crosshair";
        cell.addEventListener("click", () => placeShipOnGrid(row, col, true));
      }
      
      container.appendChild(cell);
    }
  }
}


/**
 * Zeichnet das Gegner-Gitter
 */
function renderEnemyGrid(container) {
  container.innerHTML = "";
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      
      // Prüfe ob schon angegriffen
      const attacked = window.enemyShots && window.enemyShots.some(
        shot => shot.row === row && shot.col === col
      );
      
      if (attacked) {
        const hit = window.enemyShots.find(
          shot => shot.row === row && shot.col === col
        ).hit;
        
        if (hit) {
          cell.classList.add("hit");
          cell.textContent = "💥";
        } else {
          cell.classList.add("miss");
          cell.textContent = "💧";
        }
      } else {
        cell.classList.add("unknown");
      }
      
      // Klick-Handler für Attacke
      if (gameMode === "playing" && !attacked) {
        cell.style.cursor = "crosshair";
        cell.addEventListener("click", () => playerAttackCell(row, col));
      }
      
      container.appendChild(cell);
    }
  }
}


/**
 * Spieler platziert ein Schiff auf dem Gitter
 */
function placeShipOnGrid(row, col, horizontal) {
  if (!shipsToPlace[currentShipIndex]) return;
  
  const ship = shipsToPlace[currentShipIndex];
  
  // Validiere Platzierung (vereinfacht)
  if (horizontal && col + ship.size > GRID_SIZE) return;
  if (!horizontal && row + ship.size > GRID_SIZE) return;
  
  // Speichere Schiff
  if (!window.playerShips) window.playerShips = [];
  
  const cells = [];
  if (horizontal) {
    for (let i = 0; i < ship.size; i++) {
      cells.push({ row, col: col + i });
    }
  } else {
    for (let i = 0; i < ship.size; i++) {
      cells.push({ row: row + i, col });
    }
  }
  
  window.playerShips.push({ name: ship.name, cells });
  currentShipIndex++;
  
  updateGameUI();
}


/**
 * Platziert alle Schiffe zufällig
 */
function randomPlaceShips() {
  window.playerShips = [];
  currentShipIndex = 0;
  
  for (let ship of shipsToPlace) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const horizontal = Math.random() > 0.5;
      
      attempts++;
      
      // Vereinfachte Validierung
      if (horizontal && col + ship.size > GRID_SIZE) continue;
      if (!horizontal && row + ship.size > GRID_SIZE) continue;
      
      const cells = [];
      if (horizontal) {
        for (let i = 0; i < ship.size; i++) {
          cells.push({ row, col: col + i });
        }
      } else {
        for (let i = 0; i < ship.size; i++) {
          cells.push({ row: row + i, col });
        }
      }
      
      window.playerShips.push({ name: ship.name, cells });
      currentShipIndex++;
      placed = true;
    }
  }
  
  updateGameUI();
}


/**
 * Setzt die Schiffplatzierung zurück
 */
function resetPlacement() {
  window.playerShips = [];
  currentShipIndex = 0;
  updateGameUI();
}


/**
 * Startet das Spiel
 */
async function startPlaying() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/${currentGameId}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) throw new Error("Fehler beim Starten des Spiels");
    
    gameMode = "playing";
    if (!window.enemyShots) window.enemyShots = [];
    
    updateGameUI();
  } catch (err) {
    console.error("❌ Fehler:", err);
    alert("Fehler beim Starten des Spiels");
  }
}


/**
 * Spieler greift eine Zelle an
 */
async function playerAttackCell(row, col) {
  if (gameMode !== "playing") return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/${currentGameId}/attack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, col })
    });
    
    const data = await response.json();
    
    // Registriere Spieler-Schuss
    if (!window.enemyShots) window.enemyShots = [];
    window.enemyShots.push({ row, col, hit: data.hit });
    
    // Registriere KI-Schuss
    if (data.ai_move) {
      window.enemyShots.push({ row: data.ai_move[0], col: data.ai_move[1], hit: data.ai_hit });
    }
    
    // Prüfe auf Spielende
    if (data.gameOver) {
      gameMode = "gameOver";
      const resultEl = document.getElementById("game-result");
      resultEl.className = `game-result ${data.result}`;
      resultEl.innerHTML = `
        <h3>${data.result === "win" ? "🎉 Du hast gewonnen!" : "💀 Du hast verloren!"}</h3>
        <p>${data.message}</p>
        <button class="playgio-btn" onclick="launchPlayGio()">🔄 Nochmal spielen</button>
      `;
      resultEl.style.display = "block";
    }
    
    updateGameUI();
  } catch (err) {
    console.error("❌ Fehler beim Angriff:", err);
    alert("Fehler beim Angriff!");
  }
}


/**
 * Schließt das Spiel
 */
function closePlayGio() {
  const modal = document.getElementById("playgio-modal");
  if (modal) modal.remove();
  currentGameId = null;
  gameMode = "placement";
  window.playerShips = [];
  window.enemyShots = [];
}
