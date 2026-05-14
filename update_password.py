import sqlite3
import hashlib

DB_NAME = "netwiser.db"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def update_password(username: str, new_password: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    hashed = hash_password(new_password)

    cursor.execute("""
        UPDATE student_accounts
        SET password_hash = ?
        WHERE username = ?
    """, (hashed, username))

    conn.commit()
    conn.close()

    print(f"Password updated for user: {username}")

def main():
    print("Netwiser Password Updater")
    username = input("Enter username: ")
    new_password = input("Enter new password: ")

    update_password(username, new_password)

if __name__ == "__main__":
    main()


# Seeing updated username and password set:
def verify_update(username: str, password: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    hashed = hash_password(password)

    cursor.execute("""
        SELECT * FROM student_accounts
        WHERE username = ? AND password_hash = ?
    """, (username, hashed))

    user = cursor.fetchone()
    conn.close()

    if user:
        print("Password update verified successfully.")
    else:
        print("Password update verification failed.")

def verify():
    print("Verify Password Update")
    username = input("Enter username: ")
    password = input("Enter password to verify: ")

    verify_update(username, password)