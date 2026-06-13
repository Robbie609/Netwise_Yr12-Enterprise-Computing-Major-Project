import os
import json
import webbrowser
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from backend.database import validate_login, create_user, DB_PATH


PORT = 8765
LOGIN_PAGE = "pages/index/index.html"


# ----------------------------
# LOCAL SERVER
# ----------------------------
class LocalBridge(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ------------------------
    # POST ROUTER
    # ------------------------
    def do_POST(self):

        # LOGIN
        if self.path == '/auth':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            user = validate_login(
                data.get('username'),
                data.get('password')
            )

            self.respond(user)

        # SIGNUP
        elif self.path == '/signup':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            success = create_user(
                data.get('username'),
                data.get('email'),
                data.get('password'),
                data.get('role')
            )

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                "success": success
            }).encode('utf-8'))

    # ------------------------
    # RESPONSE HANDLER
    # ------------------------
    def respond(self, user):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if user:
            user_id, username, email, role = user

            response = {
                "success": True,
                "role": role,
                "user": {
                    "user_id": user_id,
                    "username": username,
                    "email": email
                }
            }
        else:
            response = {"success": False}

        self.wfile.write(json.dumps(response).encode('utf-8'))

    def log_message(self, format, *args):
        pass


# ----------------------------
# START SERVER
# ----------------------------
def start_engine():
    server = HTTPServer(('127.0.0.1', PORT), LocalBridge)
    server.serve_forever()


if __name__ == "__main__":
    print("[*] Starting Netwiser Engine...")

    if os.path.exists(DB_PATH):
        print("[+] Database found:", DB_PATH)
    else:
        print("[-] Database missing!")

    threading.Thread(target=start_engine, daemon=True).start()

    webbrowser.open(f'file://{os.path.realpath(LOGIN_PAGE)}')

    input("\n[!] Running...\n")