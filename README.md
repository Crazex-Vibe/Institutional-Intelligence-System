# 🏛️ EduManage — Role-Based College Management System

A full-stack web application built with **React + Node.js + MongoDB** for academic administration.

---

## 📁 Project Structure

```
college-mgmt/
├── backend/                  ← Express + MongoDB API
│   ├── config/
│   │   ├── db.js             ← MongoDB connection
│   │   └── seed.js           ← Demo data seeder
│   ├── controllers/
│   │   └── authController.js ← Login, register, getMe
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT protect + role authorize
│   ├── models/
│   │   └── User.js           ← User schema (all 3 roles)
│   ├── routes/
│   │   └── authRoutes.js     ← Auth API routes
│   ├── .env                  ← Environment variables
│   └── server.js             ← Express app entry
│
└── frontend/                 ← React SPA
    └── src/
        ├── context/
        │   └── AuthContext.js    ← Global auth state
        ├── components/
        │   ├── ProtectedRoute.js ← Route guards
        │   ├── DashboardLayout.js← Sidebar + Topbar shell
        │   └── DashboardLayout.css
        ├── pages/
        │   ├── Login.js          ← Login with role quick-fill
        │   ├── Login.css
        │   ├── StudentDashboard.js
        │   ├── StaffDashboard.js
        │   ├── ManagementDashboard.js
        │   ├── Unauthorized.js
        │   └── ComingSoon.js     ← Placeholder for future modules
        ├── utils/
        │   └── api.js            ← Axios instance + interceptors
        └── App.js                ← Routes + role-based navigation
```

---

## 🚀 Setup & Run (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`)
- Two terminal windows

---

### Step 1 — Backend Setup

```bash
cd college-mgmt/backend
npm install
```

Edit `.env` if needed (MongoDB URI, JWT secret).

**Seed demo users:**
```bash
npm run seed
```

This creates 3 users:
| Role       | Email                    | Password    |
|------------|--------------------------|-------------|
| Management | management@college.edu   | admin123    |
| Staff      | staff@college.edu        | staff123    |
| Student    | student@college.edu      | student123  |

**Start backend:**
```bash
npm run dev        # with nodemon (auto-restart)
# OR
npm start          # production
```
Backend runs on → `http://localhost:5000`

---

### Step 2 — Frontend Setup

```bash
cd college-mgmt/frontend
npm install
npm start
```
Frontend runs on → `http://localhost:3000`

---

## 🔑 Authentication Flow

1. User visits `/login`
2. Enters credentials (or clicks quick-role button)
3. JWT token stored in `localStorage`
4. Every API call sends `Authorization: Bearer <token>`
5. Backend verifies token → returns user + role
6. React Router redirects to role-specific dashboard:
   - Student → `/student/dashboard`
   - Staff → `/staff/dashboard`
   - Management → `/management/dashboard`

---

## 🛡️ Role-Based Access Control

| Feature                  | Student | Staff | Management |
|--------------------------|---------|-------|------------|
| View own academic profile| ✅      | ❌    | ✅         |
| Mark attendance          | ❌      | ✅    | ❌         |
| View all students        | ❌      | ✅    | ✅         |
| Class tracking overview  | ❌      | ❌    | ✅         |
| Manage users             | ❌      | ❌    | ✅         |
| Enter CIA marks          | ❌      | ✅    | ❌         |
| View own marks           | ✅      | ❌    | ❌         |

---

## 📡 API Endpoints

```
POST   /api/auth/register          Register a user
POST   /api/auth/login             Login → returns JWT
GET    /api/auth/me                Get current user (protected)
PUT    /api/auth/change-password   Change password (protected)

GET    /api/auth/student-only      Test student access
GET    /api/auth/staff-only        Test staff access
GET    /api/auth/management-only   Test management access

GET    /api/health                 Server health check
```

---

## 🗺️ Modules Roadmap

### ✅ Module 1 — Login & Role-Based Auth (Current)
- JWT authentication
- Role-based route protection
- 3 role dashboards (Student / Staff / Management)
- Responsive sidebar layout

### 🔜 Module 2 — Attendance System
- Staff marks hour-wise attendance
- Auto day attendance derivation
- Attendance % and leave calculation

### 🔜 Module 3 — Student 360° Profile
- Full academic profile view
- CGPA, semester GPA
- Fee and scholarship status

### 🔜 Module 4 — Internal Assessment Management
- CIA-1, CIA-2 marks entry
- Assignment upload (images/PDF)
- Automated email reports

### 🔜 Module 5 — Academic Analytics
- Attendance trends
- Performance reports
- Management class tracking view
