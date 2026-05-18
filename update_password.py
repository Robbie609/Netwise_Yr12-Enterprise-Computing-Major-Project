import sqlite3

DB_NAME = "netwiser.db"

def delete_accounts():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM student_accounts
        WHERE username IN ('student2', 'adminstudent')
    """)

    conn.commit()
    conn.close()

    print("Deleted accounts: student2, adminstudent")

def main():
    print("Delete Accounts Tool")
    delete_accounts()

if __name__ == "__main__":
    main()