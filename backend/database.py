import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "netwiser.db")


# ----------------------------
# CONNECTION
# ----------------------------
def get_connection():
    return sqlite3.connect(DB_PATH)


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

    return user


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