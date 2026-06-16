import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "netwiser.db")


# ----------------------------
# CONNECTION
# ----------------------------
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ----------------------------
# PASSWORD HASHING
# ----------------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# ----------------------------
# LOGIN
# ----------------------------
def validate_login(identifier, password):
    conn = get_connection()
    cursor = conn.cursor()

    hashed = hash_password(password)

    cursor.execute("""
        SELECT user_id, username, email, role
        FROM Users
        WHERE (username = ? OR email = ?)
        AND password_hashed = ?
    """, (identifier, identifier, hashed))

    user = cursor.fetchone()
    conn.close()

    if user is None:
        return None

    return (user["user_id"], user["username"], user["email"], user["role"])


# ----------------------------
# SIGNUP
# ----------------------------
def create_user(username, email, password, role):
    conn = get_connection()
    cursor = conn.cursor()

    hashed = hash_password(password)

    try:
        cursor.execute("""
            INSERT INTO Users (user_id, username, email, password_hashed, role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "U" + str(abs(hash(username + email)) % 100000),
            username,
            email,
            hashed,
            role
        ))

        conn.commit()
        return True

    except sqlite3.IntegrityError:
        return False

    finally:
        conn.close()


# ----------------------------
# USER RETRIEVAL
# ----------------------------
def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_id, username, email, role
        FROM Users
        WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


# ----------------------------
# STUDENT RETRIEVAL
# ----------------------------
def get_student_by_user_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT student_id, first_name, last_name, year_level, class_id, user_id
        FROM Students
        WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_student_by_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT student_id, first_name, last_name, year_level, class_id, user_id
        FROM Students
        WHERE student_id = ?
    """, (student_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_students_by_class_id(class_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT student_id, first_name, last_name, year_level, class_id, user_id
        FROM Students
        WHERE class_id = ?
        ORDER BY last_name, first_name
    """, (class_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# TEACHER RETRIEVAL
# ----------------------------
def get_teacher_by_user_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT teacher_id, first_name, last_name, school, user_id
        FROM Teachers
        WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_classes_by_teacher_id(teacher_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT class_id, class_code, teacher_id
        FROM Classes
        WHERE teacher_id = ?
        ORDER BY class_code
    """, (teacher_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_class_by_id(class_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT class_id, class_code, teacher_id
        FROM Classes
        WHERE class_id = ?
    """, (class_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_teacher_by_class_id(class_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.teacher_id, t.first_name, t.last_name, t.school, t.user_id
        FROM Teachers t
        JOIN Classes c ON c.teacher_id = t.teacher_id
        WHERE c.class_id = ?
    """, (class_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


# ----------------------------
# LESSON / MODULE / QUIZ / SIMULATION RETRIEVAL
# ----------------------------
def get_all_lessons():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT lesson_id, title, topic, difficulty, description
        FROM Lessons
        ORDER BY lesson_id
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_modules_by_lesson_id(lesson_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT module_id, lesson_id, module_title, order_no
        FROM Modules
        WHERE lesson_id = ?
        ORDER BY order_no
    """, (lesson_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_all_modules():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT module_id, lesson_id, module_title, order_no
        FROM Modules
        ORDER BY lesson_id, order_no
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_quiz_by_lesson_id(lesson_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT quiz_id, lesson_id, title
        FROM Quizzes
        WHERE lesson_id = ?
    """, (lesson_id,))

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def get_all_quizzes():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT quiz_id, lesson_id, title
        FROM Quizzes
        ORDER BY quiz_id
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_simulations_by_lesson_id(lesson_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT simulation_id, lesson_id, title, difficulty
        FROM Simulations
        WHERE lesson_id = ?
    """, (lesson_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_all_simulations():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT simulation_id, lesson_id, title, difficulty
        FROM Simulations
        ORDER BY simulation_id
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_questions_by_quiz_id(quiz_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT question_id, quiz_id, question_text, option_a, option_b,
               option_c, option_d, correct_answer
        FROM Questions
        WHERE quiz_id = ?
        ORDER BY question_id
    """, (quiz_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# PROGRESS RETRIEVAL
# ----------------------------
def get_module_progress_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT progress_id, student_id, module_id, status
        FROM ModuleProgress
        WHERE student_id = ?
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_module_progress_for_students(student_ids):
    if not student_ids:
        return []

    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in student_ids)
    cursor.execute(f"""
        SELECT progress_id, student_id, module_id, status
        FROM ModuleProgress
        WHERE student_id IN ({placeholders})
    """, student_ids)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# QUIZ RESULTS RETRIEVAL
# ----------------------------
def get_quiz_results_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT result_id, student_id, quiz_id, score
        FROM QuizResults
        WHERE student_id = ?
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_quiz_results_for_students(student_ids):
    if not student_ids:
        return []

    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in student_ids)
    cursor.execute(f"""
        SELECT result_id, student_id, quiz_id, score
        FROM QuizResults
        WHERE student_id IN ({placeholders})
    """, student_ids)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# SIMULATION RESULTS RETRIEVAL
# ----------------------------
def get_simulation_results_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sim_result_id, student_id, simulation_id, score
        FROM SimulationResults
        WHERE student_id = ?
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_simulation_results_for_students(student_ids):
    if not student_ids:
        return []

    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in student_ids)
    cursor.execute(f"""
        SELECT sim_result_id, student_id, simulation_id, score
        FROM SimulationResults
        WHERE student_id IN ({placeholders})
    """, student_ids)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# ACHIEVEMENT RETRIEVAL
# ----------------------------
def get_all_achievements():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT achievement_id, title, description
        FROM Achievements
        ORDER BY achievement_id
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_achievements_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT a.achievement_id, a.title, a.description
        FROM StudentAchievements sa
        JOIN Achievements a ON a.achievement_id = sa.achievement_id
        WHERE sa.student_id = ?
        ORDER BY sa.student_achievement_id
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# ANNOUNCEMENT RETRIEVAL
# ----------------------------
def get_announcements_by_teacher_id(teacher_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT notification_id, teacher_id, title, message, created_at
        FROM TeacherAnnouncements
        WHERE teacher_id = ?
        ORDER BY created_at DESC
    """, (teacher_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def create_announcement(teacher_id, title, message, created_at):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS c FROM TeacherAnnouncements")
    count = cursor.fetchone()["c"]
    notification_id = "TA" + str(count + 1).zfill(3)

    cursor.execute("""
        INSERT INTO TeacherAnnouncements (notification_id, teacher_id, title, message, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (notification_id, teacher_id, title, message, created_at))

    conn.commit()
    conn.close()

    return notification_id


# ----------------------------
# AI CHAT RETRIEVAL
# ----------------------------
def get_ai_chats_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT chat_id, student_id, question, response
        FROM AIChats
        WHERE student_id = ?
        ORDER BY chat_id
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def create_ai_chat(student_id, question, response):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS c FROM AIChats")
    count = cursor.fetchone()["c"]
    chat_id = "CH" + str(count + 1).zfill(3)

    cursor.execute("""
        INSERT INTO AIChats (chat_id, student_id, question, response)
        VALUES (?, ?, ?, ?)
    """, (chat_id, student_id, question, response))

    conn.commit()
    conn.close()

    return chat_id


# ----------------------------
# STUDENT FEEDBACK RETRIEVAL
# ----------------------------
def get_feedback_by_student_id(student_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT feedback_id, lesson_id, rating, comment, student_id
        FROM StudentFeedback
        WHERE student_id = ?
    """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_feedback_by_lesson_id(lesson_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT feedback_id, lesson_id, rating, comment, student_id
        FROM StudentFeedback
        WHERE lesson_id = ?
    """, (lesson_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ----------------------------
# DASHBOARD DATA RETRIEVAL - STUDENT
# ----------------------------
def get_student_dashboard_data(user_id):
    """
    Builds the full payload required by the Student Dashboard for the
    student linked to the given user_id. Returns None if the user_id
    does not correspond to a student.
    """
    student = get_student_by_user_id(user_id)
    if not student:
        return None

    user = get_user_by_id(user_id)
    student_id = student["student_id"]
    class_id = student["class_id"]

    class_row = get_class_by_id(class_id)
    teacher = get_teacher_by_class_id(class_id)

    lessons = get_all_lessons()
    all_modules = get_all_modules()
    quizzes = get_all_quizzes()
    simulations = get_all_simulations()

    progress_rows = get_module_progress_by_student_id(student_id)
    progress_by_module = {p["module_id"]: p["status"] for p in progress_rows}

    quiz_results = get_quiz_results_by_student_id(student_id)
    quiz_results_by_quiz = {q["quiz_id"]: q["score"] for q in quiz_results}

    sim_results = get_simulation_results_by_student_id(student_id)
    sim_results_by_sim = {s["simulation_id"]: s["score"] for s in sim_results}

    achievements = get_achievements_by_student_id(student_id)
    announcements = get_announcements_by_teacher_id(teacher["teacher_id"]) if teacher else []
    ai_chats = get_ai_chats_by_student_id(student_id)

    modules_by_lesson = {}
    for m in all_modules:
        modules_by_lesson.setdefault(m["lesson_id"], []).append(m)

    quizzes_by_lesson = {q["lesson_id"]: q for q in quizzes}
    sims_by_lesson = {}
    for s in simulations:
        sims_by_lesson.setdefault(s["lesson_id"], []).append(s)

    lesson_payload = []
    total_lessons = len(lessons)
    lessons_completed = 0

    quizzes_total = 0
    quizzes_completed = 0

    simulations_total = 0
    simulations_completed = 0

    found_current = False

    for lesson in lessons:
        lesson_id = lesson["lesson_id"]
        modules = modules_by_lesson.get(lesson_id, [])

        module_statuses = [progress_by_module.get(m["module_id"], "Locked") for m in modules]

        if modules and all(s == "Completed" for s in module_statuses):
            lesson_status = "Completed"
        elif any(s in ("Completed", "In Progress") for s in module_statuses):
            lesson_status = "Current"
        else:
            lesson_status = "Locked"

        if not found_current and lesson_status in ("Completed", "Current"):
            if lesson_status == "Current":
                found_current = True
        elif not found_current and lesson_status == "Locked":
            # First locked lesson after all completed becomes the
            # next "Current" target so the student always has a focus.
            lesson_status = "Current"
            found_current = True

        if lesson_status == "Completed":
            lessons_completed += 1

        completed_modules = sum(1 for s in module_statuses if s == "Completed")
        progress_pct = round((completed_modules / len(modules)) * 100) if modules else 0

        quiz = quizzes_by_lesson.get(lesson_id)
        if quiz:
            quizzes_total += 1
            if quiz["quiz_id"] in quiz_results_by_quiz:
                quizzes_completed += 1

        for sim in sims_by_lesson.get(lesson_id, []):
            simulations_total += 1
            if sim["simulation_id"] in sim_results_by_sim:
                simulations_completed += 1

        topic = lesson["topic"] or ""
        topic_upper = topic.upper()
        if "NETWORK" in topic_upper:
            lesson_type = "NETWORK"
        elif "CRYPTO" in topic_upper or "ENCRYPT" in topic_upper:
            lesson_type = "CRYPTO"
        elif "PASSWORD" in topic_upper or "AUTH" in topic_upper or "PHISH" in topic_upper or "PRIVACY" in topic_upper:
            lesson_type = "SECURITY"
        else:
            lesson_type = "DEFAULT"

        quiz = quizzes_by_lesson.get(lesson_id)
        quiz_score = quiz_results_by_quiz.get(quiz["quiz_id"]) if quiz else None

        sim_scores = []
        for sim in sims_by_lesson.get(lesson_id, []):
            score = sim_results_by_sim.get(sim["simulation_id"])
            sim_scores.append({
                "title": sim["title"],
                "difficulty": sim["difficulty"],
                "score": score,
            })

        lesson_payload.append({
            "lesson_id": lesson_id,
            "title": lesson["title"],
            "topic": lesson["topic"],
            "difficulty": lesson["difficulty"],
            "description": lesson["description"],
            "type": lesson_type,
            "status": lesson_status,
            "progress": progress_pct,
            "order_no": lesson_id,
            "quiz_title": quiz["title"] if quiz else None,
            "quiz_score": quiz_score,
            "sim_scores": sim_scores,
        })

    profile = {
        "student_id": student_id,
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "year_level": student["year_level"],
        "class_code": class_row["class_code"] if class_row else "Unassigned",
        "teacher_name": f"{teacher['first_name']} {teacher['last_name']}" if teacher else "Unassigned",
        "email": user["email"] if user else "",
        "stats": {
            "lessons_completed": lessons_completed,
            "lessons_total": total_lessons,
            "quizzes_completed": quizzes_completed,
            "quizzes_total": quizzes_total,
            "simulations_completed": simulations_completed,
            "simulations_total": simulations_total,
        },
        "achievements": achievements,
        "announcements": announcements,
        "lessons": lesson_payload,
        "ai_chat_log": [
            entry
            for chat in ai_chats
            for entry in (
                {"role": "user", "text": chat["question"]},
                {"role": "assistant", "text": chat["response"]},
            )
        ],
    }

    return profile
def get_teacher_dashboard_data(user_id):
    """
    Builds the full payload required by the Teacher Dashboard for the
    teacher linked to the given user_id. Returns None if the user_id
    does not correspond to a teacher.
    """
    teacher = get_teacher_by_user_id(user_id)
    if not teacher:
        return None

    user = get_user_by_id(user_id)
    teacher_id = teacher["teacher_id"]

    classes = get_classes_by_teacher_id(teacher_id)

    lessons = get_all_lessons()
    all_modules = get_all_modules()
    quizzes = get_all_quizzes()
    simulations = get_all_simulations()

    modules_by_lesson = {}
    for m in all_modules:
        modules_by_lesson.setdefault(m["lesson_id"], []).append(m)

    quizzes_by_lesson = {q["lesson_id"]: q for q in quizzes}
    sims_by_lesson = {}
    for s in simulations:
        sims_by_lesson.setdefault(s["lesson_id"], []).append(s)

    students = []
    for c in classes:
        students.extend(get_students_by_class_id(c["class_id"]))

    student_ids = [s["student_id"] for s in students]

    progress_rows = get_module_progress_for_students(student_ids)
    quiz_results = get_quiz_results_for_students(student_ids)
    sim_results = get_simulation_results_for_students(student_ids)

    progress_by_student = {}
    for p in progress_rows:
        progress_by_student.setdefault(p["student_id"], []).append(p)

    quiz_by_student = {}
    for q in quiz_results:
        quiz_by_student.setdefault(q["student_id"], []).append(q)

    sim_by_student = {}
    for s in sim_results:
        sim_by_student.setdefault(s["student_id"], []).append(s)

    total_modules = len(all_modules)

    student_payload = []
    for s in students:
        sid = s["student_id"]
        s_progress = progress_by_student.get(sid, [])
        completed_modules = sum(1 for p in s_progress if p["status"] == "Completed")

        module_progress_pct = round((completed_modules / total_modules) * 100) if total_modules else 0

        s_quiz_results = quiz_by_student.get(sid, [])
        avg_quiz_score = round(sum(r["score"] for r in s_quiz_results) / len(s_quiz_results)) if s_quiz_results else 0

        s_sim_results = sim_by_student.get(sid, [])
        avg_sim_score = round(sum(r["score"] for r in s_sim_results) / len(s_sim_results)) if s_sim_results else 0

        scores = [module_progress_pct,avg_quiz_score,avg_sim_score]
        engagement = round((module_progress_pct * 0.5) +(avg_quiz_score * 0.3) +(avg_sim_score * 0.2)
)

        class_row = next((c for c in classes if c["class_id"] == s["class_id"]), None)

        # Enrich with per-quiz and per-sim detail for teacher drill-down
        all_quizzes_map = {q["quiz_id"]: q for q in quizzes}
        all_sims_map    = {s2["simulation_id"]: s2 for s2 in simulations}

        quiz_detail = [
            {
                "quiz_id":   r["quiz_id"],
                "title":     all_quizzes_map.get(r["quiz_id"], {}).get("title", r["quiz_id"]),
                "lesson_id": all_quizzes_map.get(r["quiz_id"], {}).get("lesson_id", ""),
                "score":     r["score"],
            }
            for r in s_quiz_results
        ]

        sim_detail = [
            {
                "simulation_id": r["simulation_id"],
                "title":         all_sims_map.get(r["simulation_id"], {}).get("title", r["simulation_id"]),
                "difficulty":    all_sims_map.get(r["simulation_id"], {}).get("difficulty", ""),
                "lesson_id":     all_sims_map.get(r["simulation_id"], {}).get("lesson_id", ""),
                "score":         r["score"],
            }
            for r in s_sim_results
        ]

        student_payload.append({
            "student_id": sid,
            "first_name": s["first_name"],
            "last_name": s["last_name"],
            "year_level": s["year_level"],
            "class_id": s["class_id"],
            "class_code": class_row["class_code"] if class_row else "",
            "module_progress_pct": module_progress_pct,
            "avg_quiz_score": avg_quiz_score,
            "avg_sim_score": avg_sim_score,
            "engagement": engagement,
            "modules_completed": completed_modules,
            "modules_total": total_modules,
            "at_risk": engagement < 70,
            "quiz_results": quiz_detail,
            "sim_results":  sim_detail,
        })

    student_payload.sort(key=lambda s: s["engagement"], reverse=True)
    for i, s in enumerate(student_payload):
        s["rank"] = i + 1
        s["is_top"] = (i == 0)

    # Module-level (lesson-level) progression across all students in
    # this teacher's classes.
    module_payload = []
    for lesson in lessons:
        modules = modules_by_lesson.get(lesson["lesson_id"], [])
        if not modules:
            continue

        statuses = []
        for m in modules:
            for sid in student_ids:
                for p in progress_by_student.get(sid, []):
                    if p["module_id"] == m["module_id"]:
                        statuses.append(p["status"])

        total_possible = len(modules) * len(student_ids) if student_ids else 0
        completed_count = sum(1 for st in statuses if st == "Completed")
        in_progress_count = sum(1 for st in statuses if st == "In Progress")

        progress_pct = round((completed_count / total_possible) * 100) if total_possible else 0

        if total_possible == 0:
            module_status = "Locked"
        elif completed_count == total_possible:
            module_status = "Completed"
        elif completed_count > 0 or in_progress_count > 0:
            module_status = "In Progress"
        else:
            module_status = "Locked"

        module_payload.append({
            "lesson_id": lesson["lesson_id"],
            "title": lesson["title"],
            "topic": lesson["topic"],
            "difficulty": lesson["difficulty"],
            "description": lesson["description"],
            "status": module_status,
            "progress": progress_pct,
        })

    # Class-wide aggregate stats
    if student_payload:
        class_activity = round(sum(s["engagement"] for s in student_payload) / len(student_payload))
    else:
        class_activity = 0

    active_modules = sum(1 for m in module_payload if m["status"] != "Locked")
    at_risk_students = [s for s in student_payload if s["at_risk"]]
    top_performer = student_payload[0] if student_payload else None

    announcements = get_announcements_by_teacher_id(teacher_id)

    profile = {
        "teacher_id": teacher_id,
        "first_name": teacher["first_name"],
        "last_name": teacher["last_name"],
        "school": teacher["school"],
        "email": user["email"] if user else "",
        "classes": classes,
        "stats": {
            "class_activity": class_activity,
            "active_modules": active_modules,
            "total_modules": len(module_payload),
            "at_risk_count": len(at_risk_students),
            "top_performer": f"{top_performer['first_name']} {top_performer['last_name']}" if top_performer else "",
        },
        "students": student_payload,
        "modules": module_payload,
        "at_risk_students": at_risk_students,
        "announcements": announcements,
    }
    return profile