# 🏛️ Institutional Intelligence System

A full-stack, role-based college management system built with **React**, **Node.js**, **Express**, and **MongoDB Atlas**.

---

## 📸 Overview

Institutional Intelligence System (IIS) is a comprehensive academic management platform designed for engineering colleges. It supports three user roles — **Student**, **Staff**, and **Management** — each with dedicated dashboards and features.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Cloud) |
| Auth | JWT (JSON Web Tokens) |
| Email | Nodemailer + Gmail |
| Styling | Custom CSS (DM Sans + Sora fonts) |

---

## ✅ Features

### 🎓 Student
- Personal dashboard with quick stats
- View semester-wise results and SGPA/CGPA chart
- View subject-wise attendance with bunk calculator
- View fee payment history and dues
- View class timetable
- View CIA-1, CIA-2, MODEL exam marks with class comparison
- Upload assignments (PDF/Image)
- 360° academic profile with achievements

### 👩‍🏫 Staff
- Mark hour-wise attendance (8 periods/day)
- Enter CIA-1, CIA-2, MODEL marks with draft/publish flow
- View and manage students in their class
- View all students across departments
- View staff directory
- View attendance and CIA reports for their classes
- View personal timetable

### 🏛️ Management
- Add new students and staff (auto-generates college email)
- Edit and deactivate user accounts
- View all students with full 360° profile
- View all staff members
- Attendance analytics dashboard with daily trend chart
- CIA assessment summary class-wise
- Send email reports (CIA results, attendance alerts, semester reports) to students and parents
- User management (reset passwords, activate/deactivate)

---

## 📁 Project Structure

```
college-mgmt/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   ├── seed.js             # Demo users seed
│   │   ├── seedAttendance.js   # Attendance data seed
│   │   └── seedProfile.js      # Academic profile seed
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── profileController.js
│   │   ├── ciaController.js
│   │   ├── reportsController.js
│   │   ├── timetableController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── SubjectAttendance.js
│   │   ├── AcademicProfile.js
│   │   ├── CIA.js
│   │   ├── Assignment.js
│   │   └── Timetable.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── ciaRoutes.js
│   │   ├── reportsRoutes.js
│   │   ├── timetableRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── emailService.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── DashboardLayout.js
        │   └── ProtectedRoute.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── StudentDashboard.js
        │   ├── StudentAttendance.js
        │   ├── StudentResults.js
        │   ├── StudentFees.js
        │   ├── StudentMarks.js
        │   ├── StudentProfile.js
        │   ├── Timetable.js
        │   ├── StaffDashboard.js
        │   ├── MarkAttendance.js
        │   ├── EnterMarks.js
        │   ├── StaffStudents.js
        │   ├── StaffReports.js
        │   ├── StaffDirectory.js
        │   ├── ManagementDashboard.js
        │   ├── ManagementStudents.js
        │   ├── ManagementStaff.js
        │   ├── ManagementCIA.js
        │   ├── ManagementAttendance.js
        │   ├── Analytics.js
        │   └── UserManagement.js
        ├── utils/
        │   ├── api.js
        │   └── departments.js
        └── App.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v16+
- MongoDB Atlas account (free tier works)
- Gmail account (for email reports)
- Git

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Crazex-Vibe/Institutional-Intelligence-System.git
cd Institutional-Intelligence-System
```

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```env
PORT=5001
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/college-mgmt
JWT_SECRET=any_random_secret_string_here
JWT_EXPIRE=7d
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

> **MongoDB URI:** Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com), go to **Database → Connect → Drivers** and copy the connection string.
>
> **Gmail App Password:** Go to [myaccount.google.com](https://myaccount.google.com) → Security → Enable 2-Step Verification → App Passwords → Generate for "Mail". Use the 16-character code as `EMAIL_PASS`.

---

### Step 3 — Seed Demo Data

```bash
# Seed demo users (management, staff, student)
node config/seed.js

# Seed attendance data
node config/seedAttendance.js

# Seed student academic profile
node config/seedProfile.js
```

---

### Step 4 — Start Backend

```bash
npm start
# Server runs on http://localhost:5001
```

---

### Step 5 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🏛️ Management | management@college.edu | admin123 |
| 👩‍🏫 Staff | staff@college.edu | staff123 |
| 🎓 Student | student@college.edu | student123 |

> **New users added through Management:** Login with auto-generated email (e.g. `john.doe@college.edu`) and password = roll number (students) or employee ID (staff).

---

## 🏫 Supported Departments

- AI&DS
- Computer Science
- Information Technology
- Electronics
- Electrical
- Mechanical
- Civil

---

## 📧 Email Reports

The system can send automated emails for:
- **CIA Results** — marks with class average comparison
- **Low Attendance Alerts** — warns students/parents below 75%
- **Semester Reports** — full result with SGPA, CGPA, grades

Emails are sent to both the student and their parent email (if provided).

> Email requires Gmail App Password setup in `.env`

---

## 🎓 Grading System

Anna University 10-point grading scale:

| Grade | Points | Result |
|-------|--------|--------|
| O | 10 | Outstanding |
| A+ | 9 | Excellent |
| A | 8 | Very Good |
| B+ | 7 | Good |
| B | 6 | Above Average |
| C | 5 | Average |
| U | 0 | Fail (Arrear) |
| RA | 0 | Reappear |

---

## 📌 Important Notes

- Attendance minimum is **75%** — students below this get flagged
- CIA marks have **Draft** and **Publish** states — students only see published marks
- Passwords for new users are their **roll number** (students) or **employee ID** (staff)
- Running `seed.js` again will reset only the 3 demo accounts — real users added via Management are safe

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Built By

**Anand Balaji F S** — [GitHub](https://github.com/Crazex-Vibe)
**Aswin V** - [GitHub](https://github.com/Ash-ady-exe)
**Naresh R** - [GitHub](https://github.com/Nas-ax)
**Nagaraj K** - [GitHub](https://github.com/nagaraj2327)
**Jayaprakash K** - [Github](https://github.com/jp-006)

> Built with ❤️ for engineering college academic management
