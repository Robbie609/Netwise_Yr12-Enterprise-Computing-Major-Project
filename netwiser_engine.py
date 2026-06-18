import os
import json
import webbrowser
import threading
from http.server import *

from backend.database import *

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
        
    def send_json(self, data, status=200):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
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
        elif self.path == '/student_dashboard':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            user_id = data.get("user_id")

            from backend.database import get_student_dashboard_data

            dashboard = get_student_dashboard_data(user_id)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            # ---------------------------------------------------------
            # FIX: Wrap the dashboard payload inside a success envelope
            # ---------------------------------------------------------
            if dashboard:
                response_payload = {
                    "success": True,
                    "profile": dashboard
                }
            else:
                response_payload = {
                    "success": False,
                    "message": "Student profile not found."
                }

            self.wfile.write(json.dumps(response_payload).encode('utf-8'))
        # MODULE DETAIL
        elif self.path == '/module_detail':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            module_id = data.get('module_id')
            module = get_module_by_id(module_id) if module_id else None

            if module is None:
                self.send_json({"success": False, "error": "Module not found"}, status=404)
            else:
                self.send_json({"success": True, "module": module})

        # MARK MODULE PROGRESS
        elif self.path == '/module_progress':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            user_id = data.get('user_id')
            module_id = data.get('module_id')
            status = data.get('status')

            student = None
            if user_id:
                from backend.database import get_student_by_user_id
                student = get_student_by_user_id(user_id)

            if not student or not module_id or status not in ("In Progress", "Completed"):
                self.send_json({"success": False, "error": "Invalid request"}, status=400)
            else:
                set_module_progress(student["student_id"], module_id, status)
                unlocked = evaluate_achievements_for_student(student["student_id"])
                self.send_json({"success": True, "unlocked_achievements": unlocked})

        # QUIZ DETAIL (questions, without answers exposed)
        elif self.path == '/quiz_detail':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            quiz_id = data.get('quiz_id')
            quiz = get_quiz_by_id(quiz_id) if quiz_id else None

            if quiz is None:
                self.send_json({"success": False, "error": "Quiz not found"}, status=404)
            else:
                questions = get_questions_by_quiz_id(quiz_id)
                safe_questions = [
                    {
                        "question_id": q["question_id"],
                        "question_text": q["question_text"],
                        "option_a": q["option_a"],
                        "option_b": q["option_b"],
                        "option_c": q["option_c"],
                        "option_d": q["option_d"],
                    }
                    for q in questions
                ]
                self.send_json({"success": True, "quiz": quiz, "questions": safe_questions})

        # QUIZ SUBMISSION
        elif self.path == '/quiz_submit':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            user_id = data.get('user_id')
            quiz_id = data.get('quiz_id')
            answers = data.get('answers') or {}

            student = None
            if user_id:
                from backend.database import get_student_by_user_id
                student = get_student_by_user_id(user_id)

            if not student or not quiz_id:
                self.send_json({"success": False, "error": "Invalid request"}, status=400)
            else:
                score, total, correct, detail = grade_quiz_submission(quiz_id, answers)
                submit_quiz_result(student["student_id"], quiz_id, score)
                unlocked = evaluate_achievements_for_student(student["student_id"])
                self.send_json({
                    "success": True,
                    "score": score,
                    "total_questions": total,
                    "correct_count": correct,
                    "detail": detail,
                    "unlocked_achievements": unlocked,
                })

        # SIMULATION DETAIL
        elif self.path == '/simulation_detail':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            simulation_id = data.get('simulation_id')
            sim = get_simulation_by_id(simulation_id) if simulation_id else None

            if sim is None:
                self.send_json({"success": False, "error": "Simulation not found"}, status=404)
            else:
                self.send_json({"success": True, "simulation": sim})

        # SIMULATION SUBMISSION
        elif self.path == '/simulation_submit':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length).decode('utf-8'))

            user_id = data.get('user_id')
            simulation_id = data.get('simulation_id')
            score = data.get('score')

            student = None
            if user_id:
                from backend.database import get_student_by_user_id
                student = get_student_by_user_id(user_id)

            if not student or not simulation_id or score is None:
                self.send_json({"success": False, "error": "Invalid request"}, status=400)
            else:
                submit_simulation_result(student["student_id"], simulation_id, int(score))
                unlocked = evaluate_achievements_for_student(student["student_id"])
                self.send_json({"success": True, "unlocked_achievements": unlocked})
        elif self.path == '/teacher_dashboard':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(
            self.rfile.read(content_length).decode('utf-8'))

            user_id = data.get("user_id")

            from backend.database import get_teacher_dashboard_data

            dashboard = get_teacher_dashboard_data(user_id)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            if dashboard:
                response_payload = {
                    "success": True,
                    "profile": dashboard
                }
            else:
                response_payload = {
                    "success": False
                }

            self.wfile.write(
                json.dumps(response_payload).encode('utf-8')
            )
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