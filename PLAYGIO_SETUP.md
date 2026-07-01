"""
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    PlayGio.AI - KOMPLETTE SETUP-ANLEITUNG                 ║
║                                                                            ║
║              Schiffeversenken-Spiel mit intelligenter Python-KI           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


📋 INHALTSVERZEICHNIS
═══════════════════════════════════════════════════════════════════════════

1. ÜBERBLICK & ARCHITEKTUR
2. VORAUSSETZUNGEN & INSTALLATION
3. STARTEN DES SPIELS
4. DATEIEN & STRUKTUR
5. KI-PARAMETER ANPASSEN
6. FEHLERBEHANDLUNG
7. API-DOKUMENTATION


═══════════════════════════════════════════════════════════════════════════
1. ÜBERBLICK & ARCHITEKTUR
═══════════════════════════════════════════════════════════════════════════

PlayGio.AI ist ein Schiffeversenken-Spiel mit:

┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                              │
│                                                                         │
│  - index.html           (Website mit PlayGio.AI Button)                │
│  - playgio-frontend.js  (Spiel-UI, Gitter, Benutzerinteraktion)       │
│                                                                         │
│                        ↕ HTTP Requests                                 │
│                                                                         │
│                      BACKEND (Python Server)                            │
│                                                                         │
│  - battleship_ai_server.py  (Game Logic & KI)                          │
│    • BattleshipGame      (Spielverwaltung)                             │
│    • BattleshipAI        (KI-Strategien)                               │
│    • Flask API Endpoints (REST API)                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

KOMMUNIKATION:
  Browser (Port 8000)  ←→  Python Server (Port 5000)
  
  1. Spieler klickt "PlayGio.AI"
  2. Frontend öffnet Modal & fragt Server: POST /api/game/start
  3. Server erstellt neues Spiel mit eindeutiger Game-ID
  4. Spieler platziert Schiffe
  5. Frontend sendet: POST /api/game/{id}/place-ship
  6. Spieler attackiert: POST /api/game/{id}/attack
  7. Server berechnet KI-Zug & antwortet mit JSON


═══════════════════════════════════════════════════════════════════════════
2. VORAUSSETZUNGEN & INSTALLATION
═══════════════════════════════════════════════════════════════════════════

ANFORDERUNGEN:
  ✓ Python 3.8 oder höher
  ✓ pip (Python Package Manager)
  ✓ Moderner Browser (Chrome, Firefox, Safari, Edge)

SCHRITT-FÜR-SCHRITT:

1️⃣  PYTHON INSTALLIEREN
    → Gehe zu https://www.python.org/downloads/
    → Lade Python 3.8+ herunter
    → Installiere und wähle "Add Python to PATH"
    → Bestätige in Terminal: python --version

2️⃣  FLASK & DEPENDENCIES INSTALLIEREN
    
    Terminal öffnen und in dein Projekt-Verzeichnis gehen:
    
        cd path/to/Personal-Website-
        
    Dann Flask installieren:
    
        pip install flask flask-cors
    
    Überprüfung:
    
        python -c "import flask; print(flask.__version__)"

3️⃣  REPOSITORY CLONEN / DATEIEN HERUNTERLADEN
    
    Alle 3 Dateien müssen im selben Verzeichnis sein:
    
        Personal-Website-/
        ├── index.html                  ✓ Deine Website
        ├── playgio-frontend.js         ✓ Frontend-Logik
        ├── battleship_ai_server.py     ✓ Backend/KI
        ├── profilbild.png              ✓ Dein Profilbild
        ├── data/
        │   └── posts.json              ✓ News/Blog Posts
        └── README.md


═══════════════════════════════════════════════════════════════════════════
3. STARTEN DES SPIELS
═══════════════════════════════════════════════════════════════════════════

SCHRITT 1: BACKEND SERVER STARTEN
─────────────────────────────────

Terminal öffnen und in das Projekt-Verzeichnis gehen:

    cd path/to/Personal-Website-
    
Server starten:

    python battleship_ai_server.py

✅ Erwartete Ausgabe:

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


SCHRITT 2: WEBSITE IN BROWSER ÖFFNEN
────────────────────────────────────

Option A: Direkt öffnen
    → Browser: file:///path/to/Personal-Website-/index.html

Option B: Mit lokalem Server (empfohlen)
    → Neues Terminal öffnen
    → cd path/to/Personal-Website-
    → python -m http.server 8000
    → Browser: http://localhost:8000


SCHRITT 3: PLAYGIO.AI STARTEN
──────────────────────────────

    1. Website laden (http://localhost:8000)
    2. Klick auf den lila "⚓ PlayGio.AI" Button
    3. Modal öffnet sich
    4. Schiffe platzieren (klick oder "🎲 Zufällig platzieren")
    5. "⚔️ Spiel starten" klicken
    6. Auf das gegnerische Board klicken zum Attackieren


═══════════════════════════════════════════════════════════════════════════
4. DATEIEN & STRUKTUR
═══════════════════════════════════════════════════════════════════════════

📄 battleship_ai_server.py
──────────────────────────

Zweck: 
  Backend-Server mit Game Logic und KI

Wichtige Klassen:

  ├─ BattleshipGame
  │  ├─ __init__()                    Initialisiert neues Spiel
  │  ├─ place_player_ship()           Spieler platziert Schiff
  │  ├─ player_attack()               Spieler greift an
  │  └─ check_cell()                  Prüft Treffer/Verfehlung
  │
  └─ BattleshipAI
     ├─ __init__()                    KI wird mit Schiffen initialisiert
     ├─ make_move()                   KI macht intelligenten Zug
     ├─ _place_all_ships()            KI platziert Schiffe zufällig
     ├─ record_hit()                  Registriert erfolgreiche Attacke
     └─ check_cell()                  Prüft ob Zelle ein Schiff hat

API Endpoints (Flask Routes):

  POST   /api/game/start
         Startet neues Spiel
         Response: { "game_id": "abc123" }

  POST   /api/game/<game_id>/place-ship
         Request: { "row": 0, "col": 0, "size": 5, "horizontal": true }
         Response: { "success": true }

  POST   /api/game/<game_id>/ready
         Spiel startet (beide Seiten ready)
         Response: { "message": "Spiel gestartet!" }

  POST   /api/game/<game_id>/attack
         Spieler greift an
         Request: { "row": 3, "col": 5 }
         Response: { "hit": true, "ai_move": [2, 4], "ai_hit": false }

  GET    /api/game/<game_id>/status
         Aktuellen Spielzustand abrufen
         Response: { "game_state": "playing", "ships_remaining": 15 }

  GET    /health
         Health Check (Test ob Server läuft)
         Response: { "status": "Server läuft ✓" }


📄 playgio-frontend.js
──────────────────────

Zweck:
  Frontend-Logik, Modal-Rendering, Gitter-Visualisierung

Wichtige Funktionen:

  ├─ launchPlayGio()                 Spiel starten (wird vom Button aufgerufen)
  ├─ startNewGame()                  Neues Spiel vom Server starten
  ├─ createGameModal()               HTML Modal erstellen
  ├─ updateGameUI()                  Gitter & Status aktualisieren
  ├─ renderPlayerGrid()              Zeichnet dein Board
  ├─ renderEnemyGrid()               Zeichnet gegnerisches Board
  ├─ placeShipOnGrid()               Schiff platzieren (Spieler)
  ├─ randomPlaceShips()              🎲 Zufällige Platzierung
  ├─ startPlaying()                  Spiel starten nach Platzierung
  ├─ playerAttackCell()              Spieler attackiert
  └─ closePlayGio()                  Modal schließen

Globale Variablen:

  const API_BASE_URL = "http://localhost:5000"   // Server URL
  let currentGameId = null                        // Aktuelle Game-ID
  let gameMode = "placement"                      // placement|playing|gameOver


📄 index.html
─────────────

Zweck:
  Deine Website mit PlayGio.AI Button

Wichtig:
  ✓ <script src="playgio-frontend.js"></script> (am Ende vor </body>)
  ✓ Button: <button onclick="launchPlayGio()">⚓ PlayGio.AI</button>
  ✓ CSS für .playgio-button mit Gradient-Stil


═══════════════════════════════════════════════════════════════════════════
5. KI-PARAMETER ANPASSEN
═══════════════════════════════════════════════════════════════════════════

Alle KI-Parameter sind in battleship_ai_server.py kommentiert.
Du kannst experimentieren und rumspielen!


🎯 STRATEGIE 1: RANDOM SEARCH (Anfang)
────────────────────────────────────────

Wo im Code: BattleshipAI.make_move() - STRATEGIE 2

Aktuell: Zufälliger Zug auf nicht angegriffenen Feldern

Zum Anpassen:

    # Variante 1: Bevorzuge Felder mit Abstand (spart Zeit)
    # Pattern-Based: Nur jedes 2. Feld attackieren (Checkerboard)
    
    def checkerboard_search(self):
        for row in range(GRID_SIZE):
            for col in range(GRID_SIZE):
                if (row + col) % 2 == 0:  # Nur Felder mit geradem Abstand
                    if (row, col) not in self.attacked_cells:
                        return (row, col)


🎯 STRATEGIE 2: TARGET HUNTING (Nach Treffer)
──────────────────────────────────────────────

Wo im Code: BattleshipAI.make_move() - STRATEGIE 1

Aktuell: Prüft nur Nachbarzellen des letzten Treffers

Zum Anpassen:

    # Variante 1: Intelligentere Verfolgung
    # Nach 2 Treffern: Erkenne Richtung und fortsetzten
    
    def smart_hunt(self):
        if len(self.hit_cells) >= 2:
            # Letzte 2 Treffer
            last_hit = self.hit_cells[-1]
            second_last = self.hit_cells[-2]
            
            # Berechne Richtung
            direction = (
                last_hit[0] - second_last[0],
                last_hit[1] - second_last[1]
            )
            
            # Verfolge in dieser Richtung
            next_row = last_hit[0] + direction[0]
            next_col = last_hit[1] + direction[1]
            
            if (0 <= next_row < GRID_SIZE and 
                0 <= next_col < GRID_SIZE and
                (next_row, next_col) not in self.attacked_cells):
                return (next_row, next_col)


🎯 SCHIFFPLATZIERUNG DER KI
──────────────────────────

Wo im Code: BattleshipAI._place_all_ships()

Aktuell: Vollständig zufällig

Zum Anpassen:

    # Variante 1: Schiffe lieber horizontal platzieren (einfacher)
    horizontal = random.random() > 0.3  # 70% horizontal statt 50%
    
    # Variante 2: Schiffe NICHT am Rand (schwerer zu treffen)
    row = random.randint(2, GRID_SIZE - 3)  # Nicht an Rändern
    col = random.randint(2, GRID_SIZE - 3)
    
    # Variante 3: Schiffe konzentriert platzieren (defensiv)
    row = random.randint(0, GRID_SIZE // 2)  # Nur obere Hälfte


📊 SCHWIERIGKEITSGRAD EINSTELLEN
────────────────────────────────

Einfach: Nur Random Search (keine Verfolgung)
  → Kommentiere in make_move(): if len(self.hit_cells) > 0: aus

Normal: Random + Target Hunting (aktuell)
  → Keine Änderungen nötig

Schwer: Intelligente Verfolgung + Muster-Erkennung
  → Implementiere smart_hunt() (siehe oben)

Sehr Schwer: Minimax oder Monte Carlo AI
  → Zu komplex für diese Dokumentation 😄


═══════════════════════════════════════════════════════════════════════════
6. FEHLERBEHANDLUNG
═══════════════════════════════════════════════════════════════════════════

❌ FEHLER 1: "Server läuft nicht!"
──────────────────────────────────

Problem:
  Du klickst auf PlayGio.AI, bekommst Fehlermeldung

Lösung:
  1. Öffne neues Terminal
  2. cd path/to/Personal-Website-
  3. python battleship_ai_server.py
  4. Warte bis "Server läuft ✓" angezeigt wird
  5. Versuche nochmal


❌ FEHLER 2: "ModuleNotFoundError: No module named 'flask'"
────────────────────────────────────────────────────────

Problem:
  Flask ist nicht installiert

Lösung:
  pip install flask flask-cors
  python battleship_ai_server.py


❌ FEHLER 3: "Port 5000 already in use"
───────────────────────────────────────

Problem:
  Anderes Programm nutzt Port 5000

Lösung:
  # Finde was Port 5000 nutzt
  lsof -i :5000  (macOS/Linux)
  netstat -ano | findstr :5000  (Windows)
  
  # Töte den Prozess
  kill -9 <PID>  (macOS/Linux)
  taskkill /PID <PID> /F  (Windows)
  
  # Oder: Ändere Port in battleship_ai_server.py Zeile ~350:
  app.run(debug=True, host='localhost', port=5001)  # ← neuer Port


❌ FEHLER 4: "CORS Error" im Browser
──────────────────────────────────

Problem:
  Frontend und Backend kommunizieren nicht

Lösung:
  1. Überprüfe dass beide URLs passen:
     Frontend: http://localhost:8000
     Backend: http://localhost:5000
  
  2. In battleship_ai_server.py steht:
     from flask_cors import CORS
     CORS(app)  ← Das erlaubt Cross-Origin Requests
  
  3. Prüfe Browser Console (F12) auf genaue Fehlermeldung


═══════════════════════════════════════════════════════════════════════════
7. API-DOKUMENTATION
═══════════════════════════════════════════════════════════════════════════

BEISPIEL 1: Neues Spiel starten
────────────────────────────────

Request:
  POST http://localhost:5000/api/game/start
  Content-Type: application/json

Response (201):
  {
    "game_id": "a1b2c3d4",
    "message": "Neues Spiel gestartet. Platziere deine Schiffe."
  }


BEISPIEL 2: Schiff platzieren
──────────────────────────────

Request:
  POST http://localhost:5000/api/game/a1b2c3d4/place-ship
  Content-Type: application/json
  
  {
    "row": 0,
    "col": 0,
    "size": 5,
    "horizontal": true
  }

Response (200):
  {
    "success": true,
    "message": "Schiff erfolgreich platziert"
  }

Was bedeutet das?
  - row, col: Position auf dem 10x10 Gitter (0-9)
  - size: Schiffgröße (2-5)
  - horizontal: true=waagerecht, false=senkrecht


BEISPIEL 3: Spiel starten (beide Seiten bereit)
────────────────────────────────────────────────

Request:
  POST http://localhost:5000/api/game/a1b2c3d4/ready
  Content-Type: application/json

Response (200):
  {
    "message": "Spiel gestartet!",
    "game_state": "playing"
  }


BEISPIEL 4: Spieler attackiert
──────────────────────────────

Request:
  POST http://localhost:5000/api/game/a1b2c3d4/attack
  Content-Type: application/json
  
  {
    "row": 5,
    "col": 3
  }

Response (200):
  {
    "hit": true,
    "ai_move": [2, 7],
    "ai_hit": false,
    "gameOver": false,
    "message": "Treffer! KI greift jetzt an..."
  }

Was bedeutet das?
  - hit: true=Dein Schuss war ein Treffer
  - ai_move: KI greift jetzt an Position [2, 7] an
  - ai_hit: false=KI hat verfehlt
  - gameOver: false=Spiel läuft noch


BEISPIEL 5: Spielstatus abrufen
────────────────────────────────

Request:
  GET http://localhost:5000/api/game/a1b2c3d4/status

Response (200):
  {
    "game_state": "playing",
    "ships_remaining": 15,
    "moves_made": 5
  }


BEISPIEL 6: Health Check
────────────────────────

Request:
  GET http://localhost:5000/health

Response (200):
  {
    "status": "Server läuft ✓",
    "port": 5000,
    "active_games": 3
  }


═══════════════════════════════════════════════════════════════════════════
TIPPS & TRICKS
═══════════════════════════════════════════════════════════════════════════

💡 TIP 1: DEBUG-MODE
     Server mit verbose Output starten:
     
     Ändere in battleship_ai_server.py Zeile ~350:
     app.run(debug=True, host='localhost', port=5000)
     
     debug=True zeigt Fehler detailliert an

💡 TIP 2: SPIEL LÖSCHEN
     Alte Spiele sind im RAM, nicht persistent
     Server Restart = alle Spiele gelöscht
     
     Für Produktion würde man eine Datenbank nutzen

💡 TIP 3: KI TESTEN
     Terminal öffnen:
     
     python
     from battleship_ai_server import BattleshipAI
     ai = BattleshipAI()
     move = ai.make_move([[0]*10 for _ in range(10)])
     print(move)  # Gibt KI-Zug aus

💡 TIP 4: PERFORMANCE
     Bei viele Spielen gleichzeitig → Server wird langsam
     Lösung: Spiele nach 30 Minuten löschen
     
     In __init__ des Servers:
     if game.created_at < now() - timedelta(minutes=30):
         del active_games[game_id]

💡 TIP 5: DEPLOYMENT
     Später gehosteter Server:
     1. Code auf Heroku/Vercel/EC2 uploaden
     2. CORS anpassen (nicht localhost)
     3. HTTPS aktivieren (wichtig!)


═══════════════════════════════════════════════════════════════════════════
KONTAKT & SUPPORT
═══════════════════════════════════════════════════════════════════════════

Wenn du Probleme hast:

1. Schau auf die Fehlermeldung in der Browser Console (F12)
2. Überprüfe Terminal Output des Servers
3. Teste den Server mit: curl http://localhost:5000/health
4. Lese die Dokumentation hier nochmal durch


═══════════════════════════════════════════════════════════════════════════
LIZENZ & CREDITS
═══════════════════════════════════════════════════════════════════════════

PlayGio.AI wurde erstellt als Bonus-Feature für:
  Maximilian Winnecke - Personal Website

Technologien:
  - Python 3.8+
  - Flask 2.0+
  - JavaScript (Vanilla)
  - HTML5 / CSS3


═══════════════════════════════════════════════════════════════════════════

                     Viel Spaß beim Spielen! ⚓

═══════════════════════════════════════════════════════════════════════════
"""

# Diese Datei ist reine Dokumentation.
# Zum Starten des Servers benutze: battleship_ai_server.py
