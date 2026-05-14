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


# Seeing updated un hashed passwords and usernames
def see_updated_credentials():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash FROM student_accounts")
    rows = cursor.fetchall()
    
    for username, password_hash in rows:
        print(f"Username: {username}, Password Hash: {password_hash}")
    conn.close()