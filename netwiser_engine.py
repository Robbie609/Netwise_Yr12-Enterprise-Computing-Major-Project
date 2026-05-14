import sqlite3
import hashlib
import webbrowser
import os

# --- CONFIGURATION ---
DB_NAME = "netwiser.db"
LOGIN_PAGE = "index.html"

def hash_password(password):
    """Secure SHA-256 Hashing."""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_login(username_email, provided_password):
    """Connects to the EXISTING database to validate credentials."""
    if not os.path.exists(DB_NAME):
        print(f"[!] Error: '{DB_NAME}' not found. Please ensure the database exists.")
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

if __name__ == "__main__":
    print("[*] Netwiser Engine Starting...")
    print("[*] Verifying database connection...")
    
    if os.path.exists(DB_NAME):
        print("[+] Database found. System ready.")
    else:
        print("[-] Warning: Database missing. Authentication will fail.")

    print("[*] Launching Netwiser Portal...")
    webbrowser.open(f'file://{os.path.realpath(LOGIN_PAGE)}')