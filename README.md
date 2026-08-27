# StudyGenie – AI Study Planner & Smart Learning Assistant 🚀

StudyGenie is an intelligent, full-stack AI-powered learning management and study optimization platform built on the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with Google Gemini AI integration, Cloudinary media storage, role-based access control (RBAC), and a tranquil Soft Pastel design system.

---

## 🌟 Key Platform Features

- **Role-Based Access Control (RBAC)**: Tailored dashboards and workflows for **Students**, **Teachers**, and **Administrators**.
- **AI Study Planner**: Formulates personalized, spaced-repetition revision schedules and synchronizes directly with the calendar.
- **AI Learning Assistant**: Multi-turn chat assistant with contextual academic awareness, suggested prompts, and markdown rendering.
- **AI Summarizer**: Synthesizes lengthy study materials, lecture transcripts, and notes into structured key concepts and study notes.
- **AI Assessment & Quizzes**: Automated quiz generation with instant evaluation, score reports, and detailed explanations.
- **Academic Hierarchy**: Subjects, syllabus topics, study materials (PDF/notes), assignments, submissions, and grading.
- **Tasks & Kanban Board**: Task prioritization with deadline reminders, categories, and calendar event integration.
- **Analytics & Recommendations**: Deep performance analytics, weak-area detection, study streak tracking, and AI guidance.
- **Tranquil Soft Pastel Design**: Modern SaaS interface utilizing a gentle palette (`#FFD6FF`, `#E7C6FF`, `#C8B6FF`, `#B8C0FF`, `#BBD0FF`) optimized for focused learning.

---

## 🏗️ Architecture & Project Structure

```
StudyGenie/
├── server/                    # Node.js + Express.js Backend (MVC Architecture)
│   ├── src/
│   │   ├── config/            # Database (MongoDB Atlas) & Cloudinary configuration
│   │   ├── controllers/       # Auth, Subjects, Materials, Tasks, AI, Quizzes, Analytics
│   │   ├── middleware/        # JWT auth, RBAC guards, multer file upload, error handling
│   │   ├── models/            # Mongoose Schemas (User, Subject, Topic, Material, Task, etc.)
│   │   ├── routes/            # REST API routes
│   │   ├── services/          # Gemini AI engine, Cloudinary service, Notification engine
│   │   ├── scripts/           # Seeding scripts and verification test suites
│   │   └── server.js          # Express app, CORS, rate-limiting, error handling
│   ├── .env.example           # Environment template
│   └── package.json
│
├── client/                    # React.js Frontend (Vite + Modern Responsive CSS)
│   ├── src/
│   │   ├── components/        # Navigation, Sidebar, Live Notification Bell, UI Library
│   │   ├── context/           # AuthContext (state management, session persistence)
│   │   ├── layouts/           # AppLayout (collapsible sidebar + header), PublicLayout
│   │   ├── pages/             # Auth, Dashboards, AI Studio, Quizzes, Subjects, Analytics, Admin
│   │   ├── services/          # Axios API clients with JWT interceptors
│   │   ├── App.jsx            # React Router v6 route configuration with guards
│   │   ├── index.css          # Design system tokens, responsive utilities, glassmorphism
│   │   └── main.jsx
│   ├── .env.example           # Client environment template
│   └── package.json
│
├── DESIGN_SYSTEM.md           # UI design tokens, color swatches & guidelines
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and supply your MONGO_URI, JWT_SECRET, and GEMINI_API_KEY

# Seed initial platform data (Users, Subjects, Topics, Quizzes)
npm run seed

# Start server in development mode
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Default points to http://localhost:5000/api

# Start client in development mode
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔑 Default Seeded Demo Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@studygenie.com` | `Admin@StudyGenie2026!` |
| **Educator** | Prof. Sarah Jenkins | `sarah.teacher@studygenie.com` | `TeacherPass123!` |
| **Student** | Alex Morgan | `alex.student@studygenie.com` | `StudentPass123!` |

*(You can also use the 1-click **Quick Demo Autofill** buttons directly on the Login page at `http://localhost:5173/login`)*

---

## 🔒 Security & Privacy
- **Password Protection**: Passwords hashed with `bcryptjs` using 10 salt rounds.
- **Authentication**: Stateless JSON Web Tokens (JWT) signed and verified on every protected request.
- **Sensitive Files Excluded**: All `.env` files, API keys, local uploads, and build artifacts are strictly excluded via `.gitignore`.
