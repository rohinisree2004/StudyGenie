import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/Layout/PublicLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Dashboards
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import TeacherDashboard from './pages/Dashboard/TeacherDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

// Phase 2: Profile & Settings
import Profile from './pages/Profile/Profile';
import Settings from './pages/Profile/Settings';

// Phase 2: Subjects & Topics
import StudentSubjects from './pages/Subjects/StudentSubjects';
import StudentSubjectDetails from './pages/Subjects/StudentSubjectDetails';
import TeacherSubjects from './pages/Subjects/TeacherSubjects';
import TeacherSubjectDetails from './pages/Subjects/TeacherSubjectDetails';
import AdminSubjectManagement from './pages/Subjects/AdminSubjectManagement';

// Phase 3: Study Materials & Notes
import TeacherMaterials from './pages/Materials/TeacherMaterials';
import StudentMaterials from './pages/Materials/StudentMaterials';
import MaterialDetails from './pages/Materials/MaterialDetails';
import MyNotes from './pages/Notes/MyNotes';
import NoteDetails from './pages/Notes/NoteDetails';

// Phase 4: Tasks, Assignments & Calendar
import Tasks from './pages/Tasks/Tasks';
import TaskDetails from './pages/Tasks/TaskDetails';
import StudyCalendar from './pages/Calendar/StudyCalendar';
import TeacherAssignments from './pages/Assignments/TeacherAssignments';
import AssignmentDetails from './pages/Assignments/AssignmentDetails';

// Phase 5: AI-Powered Study Planner
import AIStudyPlanner from './pages/StudyPlan/AIStudyPlanner';

// Phase 6: AI Learning Assistant
import AIAssistant from './pages/Assistant/AIAssistant';

// Phase 7: AI Note & Study Material Summarization
import AISummarizer from './pages/Summarizer/AISummarizer';

// Phase 8: AI Quiz Generation & Examination
import QuizList from './pages/Quizzes/QuizList';
import QuizGenerator from './pages/Quizzes/QuizGenerator';
import TakeQuiz from './pages/Quizzes/TakeQuiz';
import QuizResult from './pages/Quizzes/QuizResult';

// Phase 9: Progress Tracking & Performance Analytics
import ProgressDashboard from './pages/Progress/ProgressDashboard';
import SubjectProgressDetail from './pages/Progress/SubjectProgressDetail';
import TeacherStudentProgress from './pages/Progress/TeacherStudentProgress';

// Phase 10: AI-Powered Study Recommendations
import StudyRecommendations from './pages/Recommendations/StudyRecommendations';

// Phase 11: Teacher Student Monitoring
import TeacherStudents from './pages/Teacher/TeacherStudents';
import TeacherStudentPerformance from './pages/Teacher/TeacherStudentPerformance';
import SubjectStudents from './pages/Teacher/SubjectStudents';

// Phase 12: Notifications & Announcements
import NotificationsCenter from './pages/Notifications/NotificationsCenter';
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements';

// Phase 13: Admin & System Management
import AdminUsers from './pages/Admin/AdminUsers';
import AdminStudents from './pages/Admin/AdminStudents';
import AdminTeachers from './pages/Admin/AdminTeachers';
import AdminSubjects from './pages/Admin/AdminSubjects';
import AdminMaterials from './pages/Admin/AdminMaterials';
import AdminQuizzes from './pages/Admin/AdminQuizzes';
import AdminSettings from './pages/Admin/AdminSettings';

// Common
import Landing from './pages/Landing/Landing';
import Unauthorized from './pages/Common/Unauthorized';
import NotFound from './pages/Common/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Soft Pastel Ambient Accent Background */}
        <div className="pastel-ambient-canvas">
          <div className="pastel-blob-1" />
          <div className="pastel-blob-2" />
          <div className="pastel-blob-3" />
        </div>

        {/* Route Definitions */}
        <Routes>
          {/* Public Routes wrapped in PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
          </Route>

          {/* Common Protected Routes for Authenticated Users (Profile, Settings, Notes, Materials, Calendar, Assignment Details) */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/materials" element={<StudentMaterials />} />
            <Route path="/materials/:materialId" element={<MaterialDetails />} />
            <Route path="/notes" element={<MyNotes />} />
            <Route path="/notes/new" element={<NoteDetails />} />
            <Route path="/notes/:noteId" element={<NoteDetails />} />
            <Route path="/calendar" element={<StudyCalendar />} />
            <Route path="/assignments/:assignmentId" element={<AssignmentDetails />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/assistant/:conversationId" element={<AIAssistant />} />
            <Route path="/summarizer" element={<AISummarizer />} />
            <Route path="/summarizer/:summaryId" element={<AISummarizer />} />
            <Route path="/quizzes" element={<QuizList />} />
            <Route path="/quizzes/new" element={<QuizGenerator />} />
            <Route path="/quizzes/:quizId/take" element={<TakeQuiz />} />
            <Route path="/quizzes/:quizId/results/:attemptId" element={<QuizResult />} />
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/progress/subjects/:subjectId" element={<SubjectProgressDetail />} />
            <Route path="/recommendations" element={<StudyRecommendations />} />
            <Route path="/recommendations/:recommendationId" element={<StudyRecommendations />} />
            <Route path="/notifications" element={<NotificationsCenter />} />
          </Route>

          {/* Role-Protected Route: Student (Dashboard, Subjects, Tasks, AI Study Planner) */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/subjects" element={<StudentSubjects />} />
            <Route path="/subjects/:subjectId" element={<StudentSubjectDetails />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/new" element={<TaskDetails />} />
            <Route path="/tasks/:taskId" element={<TaskDetails />} />
            <Route path="/study-planner" element={<AIStudyPlanner />} />
            <Route path="/study-planner/:planId" element={<AIStudyPlanner />} />
          </Route>

          {/* Role-Protected Route: Teacher & Admin Course Management */}
          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="/teacher/materials" element={<TeacherMaterials />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/progress" element={<TeacherStudents />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/students/:studentId" element={<TeacherStudentPerformance />} />
            <Route path="/teacher/subjects/:subjectId/students" element={<SubjectStudents />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
          </Route>

          {/* Role-Protected Route: Teacher */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/subjects" element={<TeacherSubjects />} />
            <Route path="/teacher/subjects/:subjectId" element={<TeacherSubjectDetails />} />
          </Route>

          {/* Role-Protected Route: Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/teachers" element={<AdminTeachers />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/materials" element={<AdminMaterials />} />
            <Route path="/admin/quizzes" element={<AdminQuizzes />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
