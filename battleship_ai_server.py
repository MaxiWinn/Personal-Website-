"""
PlayGio.AI - Battleship Game Server
===================================
Ein lokaler Python-Server für das Schiffeversenken-Spiel mit intelligenter KI.

INSTALLATION & START:
1. Python 3.8+ installieren
2. Abhängigkeiten installieren: pip install flask flask-cors
3. Server starten: python battleship_ai_server.py
4. Server läuft auf: http://localhost:5000

FEATURES:
- Spielverwaltung mit eindeutigen Game-IDs
- Intelligente KI mit 3 Strategien:
  * Random Moves (Anfang)
  * Target Hunting (nach Hit)
  * Pattern-Based (optimiert)
- CORS aktiviert für lokale Website
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import uuid
from typing import List, Tuple, Dict

# ============================================================================
# FLASK APP SETUP
# ============================================================================
app = Flask(__name__)
CORS(app)  # Erlaubt Requests von deiner Website (localhost:8000)

# Speichert aktive Spiele (in echtem Betrieb würde man eine Datenbank nutzen)
active_games: Dict[str, 'BattleshipGame'] = {}

# ============================================================================
# KONSTANTEN
# ============================================================================
GRID_SIZE = 10
SHIPS = [
    {"name": "Carrier", "size": 5},
    {"name": "Battleship", "size": 4},
    {"name": "Cruiser", "size": 3},
    {"name": "Submarine", "size": 3},
    {"name": "Destroyer", "size": 2}
]


# ============================================================================
# HILFSFUNKTIONEN
# ============================================================================

def create_empty_grid(size: int = GRID_SIZE) -> List[List[int]]:
    """
    Erstellt ein leeres Gitter mit 0en.
    
    Args:
        size: Größe des Gitters (Standard: 10x10)
    
    Returns:
        2D Liste mit allen 0en
    """
    return [[0 for _ in range(size)] for _ in range(size)]


def can_place_ship(grid: List[List[int]], row: int, col: int, 
                   size: int, horizontal: bool) -> bool:
    """
    Prüft, ob ein Schiff an Position (row, col) platziert werden kann.
    
    Args:
        grid: Spielgitter
        row, col: Startposition
        size: Schiffgröße
        horizontal: True = waagerecht, False = senkrecht
    
    Returns:
        True wenn Platzierung möglich, False sonst
    """
    if horizontal:
        # Prüfe ob Schiff aus dem Gitter ragt
        if col + size > GRID_SIZE:
            return False
        # Prüfe ob alle Felder leer sind
        for i in range(size):
            if grid[row][col + i] != 0:
                return False
    else:
        # Senkrecht: Prüfe Reihen statt Spalten
        if row + size > GRID_SIZE:
            return False
        for i in range(size):
            if grid[row + i][col] != 0:
                return False
    
    return True


def place_ship(grid: List[List[int]], row: int, col: int, 
               size: int, horizontal: bool, ship_id: int) -> None:
    """
    Platziert ein Schiff auf dem Gitter.
    
    Args:
        grid: Spielgitter (wird modifiziert)
        row, col: Startposition
        size: Schiffgröße
        horizontal: Ausrichtung
        ship_id: Eindeutige Schiff-ID (1, 2, 3, etc.)
    """
    if horizontal:
        for i in range(size):
            grid[row][col + i] = ship_id
    else:
        for i in range(size):
            grid[row + i][col] = ship_id


def count_remaining_ships(revealed_grid: List[List[int]]) -> int:
    """
    Zählt die verbleibenden Schiffssegmente.
    
    revealed_grid[i][j] kann sein:
      0 = nicht angegriffen
      1 = getroffen
     -1 = verfehlt
    
    Verbleibende Schiffe = Anzahl der 0en, die ursprünglich Schiffe waren
    """
    total_ship_cells = sum(ship["size"] for ship in SHIPS)
    hit_count = sum(row.count(1) for row in revealed_grid)
    return total_ship_cells - hit_count


# ============================================================================
# BATTLESHIP AI KLASSE
# ============================================================================

class BattleshipAI:
    """
    Intelligente KI für Schiffeversenken.
    
    Die KI verwendet 3 verschiedene Strategien:
    1. Random Search: Zufällige Züge am Anfang
    2. Target Hunting: Zielsuche nach getroffenem Schiff
    3. Pattern-Based: Optimale Zugfolge (kann erweitert werden)
    """
    
    def __init__(self):
        """Initialisiert die KI mit Gitter und Gedächtnis."""
        self.grid = create_empty_grid()
        self.attacked_cells = set()  # Speichert bereits angegriffene Felder: {(row, col), ...}
        self.hit_cells = []  # Liste von Treffern: [(row, col), ...]
        
        # Platziere AI Schiffe
        self._place_all_ships()
    
    def _place_all_ships(self) -> None:
        """Platziert alle Schiffe der KI zufällig auf dem Gitter."""
        ship_id = 1
        
        for ship in SHIPS:
            placed = False
            attempts = 0
            max_attempts = 100  # Verhindere Endlosschleife
            
            while not placed and attempts < max_attempts:
                # Zufällige Position
                row = random.randint(0, GRID_SIZE - 1)
                col = random.randint(0, GRID_SIZE - 1)
                horizontal = random.choice([True, False])
                
                # Versuche zu platzieren
                if can_place_ship(self.grid, row, col, ship["size"], horizontal):
                    place_ship(self.grid, row, col, ship["size"], horizontal, ship_id)
                    placed = True
                
                attempts += 1
            
            ship_id += 1
    
    def make_move(self, opponent_revealed_grid: List[List[int]]) -> Tuple[int, int]:
        """
        Die KI macht einen intelligenten Zug.
        
        Strategie:
        1. Wenn es bekannte Treffer gibt → verfolge sie (Target Hunting)
        2. Sonst → zufälliger Zug
        
        Args:
            opponent_revealed_grid: Das vom Spieler angegiffene Gitter der AI
        
        Returns:
            Tuple (row, col) des nächsten Zugs
        """
        
        # ===== STRATEGIE 1: TARGET HUNTING (Wenn Treffer vorhanden) =====
        if len(self.hit_cells) > 0:
            # Letzte erfolgreiche Attacke
            last_hit = self.hit_cells[-1]
            
            # Prüfe Nachbarfelder um den Treffer
            adjacent_cells = [
                (last_hit[0] - 1, last_hit[1]),      # Oben
                (last_hit[0] + 1, last_hit[1]),      # Unten
                (last_hit[0], last_hit[1] - 1),      # Links
                (last_hit[0], last_hit[1] + 1),      # Rechts
            ]
            
            # Filtere gültige und noch nicht angegriffene Felder
            valid_moves = [
                (r, c) for r, c in adjacent_cells
                if 0 <= r < GRID_SIZE and 0 <= c < GRID_SIZE 
                and (r, c) not in self.attacked_cells
            ]
            
            if valid_moves:
                # Wähle einen der gültigen Züge
                move = random.choice(valid_moves)
                self.attacked_cells.add(move)
                return move
        
        # ===== STRATEGIE 2: RANDOM SEARCH (Anfang / keine Treffer) =====
        # Finde einen zufälligen Zug, der noch nicht angegriffen wurde
        attempts = 0
        max_attempts = 100
        
        while attempts < max_attempts:
            row = random.randint(0, GRID_SIZE - 1)
            col = random.randint(0, GRID_SIZE - 1)
            
            if (row, col) not in self.attacked_cells:
                self.attacked_cells.add((row, col))
                return (row, col)
            
            attempts += 1
        
        # Fallback: Nächstes freies Feld
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) not in self.attacked_cells:
                    self.attacked_cells.add((r, c))
                    return (r, c)
        
        # Sollte nie erreicht werden
        return (0, 0)
    
    def record_hit(self, row: int, col: int) -> None:
        """
        Registriert einen erfolgreichen Treffer für zukünftige Strategien.
        
        Args:
            row, col: Position des Treffers
        """
        self.hit_cells.append((row, col))
    
    def check_cell(self, row: int, col: int) -> bool:
        """
        Prüft ob eine Spieler-Attacke ein Schiff trifft.
        
        Args:
            row, col: Angegriffene Position
        
        Returns:
            True wenn Treffer, False wenn Verfehlung
        """
        return self.grid[row][col] != 0


class BattleshipGame:
    """
    Verwaltet eine komplette Spielsession.
    
    Speichert:
    - Gitter beider Spieler
    - Angegriffene Felder
    - Spielzustand
    """
    
    def __init__(self):
        """Initialisiert ein neues Spiel."""
        self.game_id = str(uuid.uuid4())[:8]  # Eindeutige Game-ID
        self.ai = BattleshipAI()
        self.player_grid = create_empty_grid()
        self.player_revealed = create_empty_grid()  # KI sieht das Spieler-Gitter
        self.game_state = "placement"  # placement, playing, gameOver
        self.result = None  # "win", "lose"
    
    def place_player_ship(self, row: int, col: int, size: int, 
                         horizontal: bool) -> bool:
        """
        Der Spieler platziert ein Schiff.
        
        Args:
            row, col: Position
            size: Größe
            horizontal: Ausrichtung
        
        Returns:
            True wenn erfolgreich, False wenn ungültig
        """
        if can_place_ship(self.player_grid, row, col, size, horizontal):
            # Nutze die Schiff-Nummer als ID (1-5)
            ship_id = len([cell for row_cells in self.player_grid 
                          for cell in row_cells if cell > 0]) // size + 1
            place_ship(self.player_grid, row, col, size, horizontal, ship_id)
            return True
        return False
    
    def player_attack(self, row: int, col: int) -> Dict:
        """
        Der Spieler greift an der Position (row, col) an.
        
        Args:
            row, col: Angegriffene Position
        
        Returns:
            Dict mit Resultat
        """
        # Prüfe ob schon angegriffen
        if self.ai.attacked_cells and (row, col) in self.ai.attacked_cells:
            return {"error": "Already attacked this cell"}
        
        # Spieler greift an
        hit = self.ai.check_cell(row, col)
        self.ai.attacked_cells.add((row, col))
        
        if hit:
            # Treffer registrieren
            self.player_revealed[row][col] = 1
        else:
            self.player_revealed[row][col] = -1
        
        # Prüfe ob Spieler gewonnen hat
        if count_remaining_ships(self.player_revealed) == 0:
            self.game_state = "gameOver"
            self.result = "win"
            return {
                "hit": hit,
                "gameOver": True,
                "result": "win",
                "message": "🎉 Du hast gewonnen!"
            }
        
        # KI macht nächsten Zug
        ai_move = self.ai.make_move(self.player_revealed)
        ai_hit = self.player_grid[ai_move[0]][ai_move[1]] != 0
        
        if ai_hit:
            self.ai.record_hit(ai_move[0], ai_move[1])
            self.player_revealed[ai_move[0]][ai_move[1]] = 1
        else:
            self.player_revealed[ai_move[0]][ai_move[1]] = -1
        
        # Prüfe ob KI gewonnen hat
        if count_remaining_ships(self.player_revealed) == 0:
            self.game_state = "gameOver"
            self.result = "lose"
            return {
                "hit": hit,
                "ai_move": ai_move,
                "ai_hit": ai_hit,
                "gameOver": True,
                "result": "lose",
                "message": "💀 Die KI hat gewonnen!"
            }
        
        return {
            "hit": hit,
            "ai_move": ai_move,
            "ai_hit": ai_hit,
            "gameOver": False
        }


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/game/start', methods=['POST'])
def start_game():
    """
    Startet ein neues Spiel.
    
    Response:
    {
        "game_id": "abc123",
        "message": "Neues Spiel gestartet. Platziere deine Schiffe."
    }
    """
    game = BattleshipGame()
    active_games[game.game_id] = game
    
    return jsonify({
        "game_id": game.game_id,
        "message": "Neues Spiel gestartet. Platziere deine Schiffe."
    }), 201


@app.route('/api/game/<game_id>/place-ship', methods=['POST'])
def place_ship_endpoint(game_id):
    """
    Platziert ein Schiff für den Spieler.
    
    Request Body:
    {
        "row": 0,
        "col": 0,
        "size": 5,
        "horizontal": true
    }
    
    Response:
    {
        "success": true,
        "message": "Schiff erfolgreich platziert"
    }
    """
    if game_id not in active_games:
        return jsonify({"error": "Game not found"}), 404
    
    data = request.json
    game = active_games[game_id]
    
    success = game.place_player_ship(
        data['row'],
        data['col'],
        data['size'],
        data['horizontal']
    )
    
    if success:
        return jsonify({
            "success": True,
            "message": "Schiff erfolgreich platziert"
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "Ungültige Schiffplatzierung"
        }), 400


@app.route('/api/game/<game_id>/ready', methods=['POST'])
def game_ready(game_id):
    """
    Signalisiert, dass der Spieler bereit ist und Spiel startet.
    
    Response:
    {
        "message": "Spiel gestartet!",
        "game_state": "playing"
    }
    """
    if game_id not in active_games:
        return jsonify({"error": "Game not found"}), 404
    
    game = active_games[game_id]
    game.game_state = "playing"
    
    return jsonify({
        "message": "Spiel gestartet!",
        "game_state": "playing"
    }), 200


@app.route('/api/game/<game_id>/attack', methods=['POST'])
def player_attack(game_id):
    """
    Spieler greift an Position an.
    
    Request Body:
    {
        "row": 3,
        "col": 5
    }
    
    Response:
    {
        "hit": true,
        "ai_move": [2, 4],
        "ai_hit": false,
        "gameOver": false,
        "message": "Treffer! KI greift jetzt an..."
    }
    """
    if game_id not in active_games:
        return jsonify({"error": "Game not found"}), 404
    
    data = request.json
    game = active_games[game_id]
    
    result = game.player_attack(data['row'], data['col'])
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result), 200


@app.route('/api/game/<game_id>/status', methods=['GET'])
def game_status(game_id):
    """
    Gibt aktuellen Spielzustand zurück.
    
    Response:
    {
        "game_state": "playing",
        "ships_remaining": 15,
        "moves_made": 5
    }
    """
    if game_id not in active_games:
        return jsonify({"error": "Game not found"}), 404
    
    game = active_games[game_id]
    
    return jsonify({
        "game_state": game.game_state,
        "ships_remaining": count_remaining_ships(game.player_revealed),
        "moves_made": len(game.ai.attacked_cells)
    }), 200


@app.route('/health', methods=['GET'])
def health():
    """
    Health-Check Endpoint (zum Testen, ob Server läuft).
    """
    return jsonify({
        "status": "Server läuft ✓",
        "port": 5000,
        "active_games": len(active_games)
    }), 200


# ============================================================================
# ERROR HANDLING
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """404 Fehler Handler."""
    return jsonify({"error": "Endpoint nicht gefunden"}), 404


@app.errorhandler(500)
def server_error(error):
    """500 Fehler Handler."""
    return jsonify({"error": "Interner Serverfehler"}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("""
    ╔════════════════════════════════════════════╗
    ║      PlayGio.AI - Battleship Server        ║
    ║         Server läuft auf Port 5000         ║
    ╚════════════════════════════════════════════╝
    
    📍 Lokale URL: http://localhost:5000
    🌐 Deine Website: http://localhost:8000
    
    API Endpoints:
    - POST   /api/game/start              (Neues Spiel)
    - POST   /api/game/<id>/place-ship    (Schiff platzieren)
    - POST   /api/game/<id>/ready         (Spiel starten)
    - POST   /api/game/<id>/attack        (Attacke)
    - GET    /api/game/<id>/status        (Status)
    - GET    /health                      (Health Check)
    
    Zum Beenden: CTRL + C
    """)
    
    app.run(debug=True, host='localhost', port=5000)
