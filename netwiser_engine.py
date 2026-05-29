import sqlite3
import hashlib
import os
import json
import webbrowser
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# --- CONFIGURATION ---
DB_NAME = "netwiser.db"
PORT = 8765 # Local communication port
LOGIN_PAGE = "index.html"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def validate_login(username_email, provided_password):
    """Connects to the EXISTING database to validate credentials."""
    if not os.path.exists(DB_NAME):
        print(f"[!] Error: '{DB_NAME}' not found.")
        return False

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        h_pw = hash_password(provided_password)
        
        cursor.execute('''
            SELECT * FROM student_accounts 
            WHERE (username = ? OR email = ?) AND password_hash = ?
        ''', (username_email, username_email, h_pw))
        
        user = cursor.fetchone()
        return user is not None
    except sqlite3.Error as e:
        print(f"[!] Database connection error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

# --- LOCAL DESKTOP BRIDGE (NO EXTERNAL FRAMEWORKS) ---
class LocalBridge(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS for local file:// requests
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == '/auth':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Perform Real Authentication
            is_valid = validate_login(data.get('username'), data.get('password'))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Return real validation status to the frontend UI
            response = {"success": is_valid}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
    def log_message(self, format, *args):
        # Suppress server logs for a cleaner terminal output
        pass

def start_engine():
    server = HTTPServer(('127.0.0.1', PORT), LocalBridge)
    server.serve_forever()

if __name__ == "__main__":
    print("[*] Starting Netwiser Authentication Engine...")
    
    if os.path.exists(DB_NAME):
        print("[+] Existing Database found. System ready.")
    else:
        print("[-] Warning: Database missing. Authentication will fail.")

    # Start the local bridge in the background
    threading.Thread(target=start_engine, daemon=True).start()

    # Open the UI directly from the file system
    ui_path = f'file://{os.path.realpath(LOGIN_PAGE)}'
    print(f"[*] Launching UI: {ui_path}")
    webbrowser.open(ui_path)
    
    # Keep the engine running
    input("\n[!] Netwiser System is Active. Press Enter here to close the engine...\n")