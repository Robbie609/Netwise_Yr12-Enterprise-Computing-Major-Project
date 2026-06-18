# NETWISER

NetWiser is a desktop application developed as part of a Year 12 Software Design and Development project. It is designed to improve cybersecurity education for Year 6 - 8 students by providing an interactive platform for learning cyber safety concepts through lessons, quizzes, simulations, achievements, and progress tracking.

## 📌 Project Overview

Cybersecurity is becoming increasingly important for young students, yet many educational resources are either too technical or not engaging enough.

NetWiser addresses this problem by providing a centralised learning platform that teaches students essential cyber safety skills through structured lessons and interactive activities. Teachers can monitor student progress, manage classes, and track learning outcomes through a dedicated dashboard.

## 🎯 Aim

The aim of NetWiser is to design and develop a cybersecurity learning platform that:

* Improves cyber safety awareness among students
* Provides engaging and interactive learning experiences
* Allows teachers to monitor student progress and performance
* Tracks lesson completion, quiz results, and achievements
* Stores and manages educational data securely using a database

## 👥 Stakeholders

### Student

* Completes lessons and modules
* Participates in quizzes and simulations
* Earns achievements
* Tracks learning progress

### Teacher

* Monitors student progress
* Views class performance
* Creates announcements
* Supports student learning

## ✨ System Features

### 📚 Interactive Lessons

Students complete cybersecurity lessons covering topics such as passwords, phishing, online privacy, social engineering, safe browsing, and digital footprints.

### 📝 Quiz System

Each lesson includes quizzes that assess student understanding and record results.

### 🎮 Cybersecurity Simulations

Students participate in realistic cyber safety scenarios to apply their knowledge in practical situations.

### 🏆 Achievement System

Students unlock achievements for completing lessons, quizzes, and learning milestones.

### 📊 Progress Tracking

Lesson, module, quiz, and simulation progress is recorded and displayed through the dashboard.

### 📢 Teacher Dashboard

Teachers can view classes, monitor student performance, and manage announcements.

## 🧰 Technologies Used

* Python
* HTML
* CSS
* JavaScript
* SQLite

## 🏗️ System Design Overview

NetWiser follows a modular architecture where responsibilities are separated into components such as:

* Database management
* Authentication system
* Student dashboard
* Teacher dashboard
* User interface pages
* Progress tracking systems

This structure improves maintainability and allows future expansion of the platform.

## 🔐 Security and Access Control

The system uses role-based authentication to separate student and teacher functionality. Users can only access features relevant to their role, helping protect data integrity and prevent unauthorised access.

Passwords are securely stored using SHA-256 hashing within the database.

## 📁 Project Structure

```text
netwiser/
│
├── backend/
│   ├── database.py
│   └── netwiser.db
│
├── pages/
│   ├── index/
│   ├── student_dashboard/
│   └── teacher_dashboard/
│
├── netwiser_engine.py
└── README.md
```

## 🚀 How to Run NetWiser

### 📌 System Requirements

Before running NetWiser, ensure your system meets the following requirements:

* Windows 10 or Windows 11
* Python 3.10 or later
* Visual Studio Code (VS Code)
* SQLite Viewer
* At least 100 MB of free storage

### 📥 Required Downloads

Download Python from:

https://www.python.org/downloads/

During installation:

* Tick **Add Python to PATH**
* Select **Install Now**

Download VS Code from:

https://code.visualstudio.com/

Install the Python extension published by Microsoft.

### 📂 Project Installation

1. Navigate to the Netwiser GitHub repository.
2. Select Code → Download ZIP.
3. Extract the ZIP file to a suitable location.
4. Open Visual Studio Code.
5. Select File → Open Folder.
6. Open the extracted Netwiser project folder.
7. Open a new terminal in Visual Studio Code.
8. Verify that the database file (netwiser.db) is located within the backend folder.


### ▶️ Running NetWiser

Open a terminal in the project folder and run:

```bash
python netwiser_engine.py
```

The NetWiser landing page should appear.

## ✅ Verifying Installation

The installation is successful if:

* Users can log in successfully
* Student dashboards display student specific information
* Teacher dashboards display teacher specific information
* Data is retrieved from the SQLite database
* Lessons, quizzes, achievements, and progress appear correctly

## 🔑Account Credentials
Students:
- Rithwick → Username: Ricky, Password: Netwiser1
- Rowan → Username: RowanR, Password: Netwiser2
- Rigved → Username: RigvedG, Password: Netwiser3
- Sai → Username: SaiR, Password: Netwiser4
- Oliver Mahady → Username: OliverM, Password: Netwiser5
- Daniel Wang → Username: DanielW, Password: Netwiser6
- Haydan Wang → Username: HaydanW, Password: Netwiser7
- Kahim T. → Username: KahimT, Password: Netwiser8
- Jerrard H. → Username: JerrardH, Password: Netwiser9
- Oliver L. → Username: OliverL, Password: Netwiser10

Teachers:
- Blake White → Username: MrWhite, Password: Netwiser100
- Andrew Simpson → Username: MrSimpson, Password: Netwiser200

## 🎉 Installation Complete

NetWiser is now ready to use. Students can begin learning cybersecurity concepts while teachers can monitor progress and support classroom learning.

## Conclusion

NetWiser provides an engaging and educational approach to cybersecurity awareness for young students. By combining lessons, quizzes, simulations, achievements, and teacher monitoring tools into a single platform, it helps students develop essential digital safety skills in a structured and interactive environment.
