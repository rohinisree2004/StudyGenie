import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  FileText,
  Megaphone,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import StatCard from '../../components/UI/StatCard';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getTeacherDashboard();
      if (res.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
      setError(err.message || 'Could not load educator analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = dashboard?.kpis || {
    totalAssignedSubjects: 0,
    totalUniqueStudents: 0,
    studentsOnTrack: 0,
    studentsNeedingSupport: 0,
    averageQuizScore: 0,
    totalStudentStudyHours: 0,
    totalPendingReview: 0,
  };

  const assignedSubjects = dashboard?.assignedSubjects || [];
  const recentAssignments = dashboard?.recentAssignments || [];
  const assignmentOverview = dashboard?.assignmentOverview || {
    totalExpectedSubmissions: 0,
    totalActualSubmissions: 0,
    totalGradedSubmissions: 0,
    totalPendingReview: 0,
    overallCompletionRate: 0,
  };
  const weakAreas = dashboard?.weakAreas || [];
  const recentMaterials = dashboard?.recentMaterials || [];
  const recentAnnouncements = dashboard?.recentAnnouncements || [];

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Banner */}
      <div
        className="card card-pastel-mauve"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '1.75rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
            <span className="badge badge-teacher">
              <GraduationCap size={13} /> Educator Workspace
            </span>
            <span className="badge badge-active">
              <CheckCircle2 size={13} /> Verified Faculty
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name} 📚
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Supervise curriculum milestones, track student assignment submissions, monitor quiz averages, and identify conceptual bottlenecks.
          </p>

          {user?.institution && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              🏛️ Faculty Department: <strong style={{ color: 'var(--text-secondary)' }}>{user.institution}</strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/teacher/students" className="btn btn-secondary" style={{ gap: '0.45rem', fontSize: '0.85rem' }}>
            <Users size={15} color="var(--brand-primary)" /> Students Monitoring
          </Link>
          <Link to="/teacher/assignments" className="btn btn-primary" style={{ gap: '0.45rem', fontSize: '0.85rem' }}>
            <Layers size={15} /> Assignments Queue
          </Link>
          <button
            onClick={loadDashboard}
            className="btn btn-ghost"
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)' }}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-4" style={{ marginBottom: '1.75rem' }}>
            <StatCard
              label="Assigned Classes"
              value={`${kpis.totalAssignedSubjects} Courses`}
              subtext="Under your instruction"
              icon={BookOpen}
              pastel="mauve"
            />
            <StatCard
              label="Enrolled Students"
              value={`${kpis.totalUniqueStudents} Learners`}
              subtext={`${kpis.studentsOnTrack} on track • ${kpis.studentsNeedingSupport} support`}
              icon={Users}
              pastel="sky"
            />
            <StatCard
              label="Class Quiz Average"
              value={`${kpis.averageQuizScore}%`}
              subtext="Across evaluations"
              icon={Award}
              pastel="lavender"
            />
            <StatCard
              label="Student Study Time"
              value={`${kpis.totalStudentStudyHours} hrs`}
              subtext="Logged in your classes"
              icon={Clock}
              pastel="pink"
            />
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
            {/* Left Column: Assigned Subjects Overview & Assignment Tracking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Assigned Subjects & Class Pacing */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Assigned Courses & Class Pacing
                    </h2>
                  </div>
                  <Link to="/teacher/subjects" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    All Classes →
                  </Link>
                </div>

                {assignedSubjects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No academic courses currently assigned to your account.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {assignedSubjects.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-subtle)',
                          borderLeft: `4px solid ${s.color || 'var(--pastel-mauve)'}`,
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <Link to={`/teacher/subjects/${s.id}`} style={{ textDecoration: 'none', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {s.title} ({s.code || 'Course'})
                          </Link>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {s.averageProgress}% Average Completion
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.6rem' }}>
                          <div
                            style={{
                              width: `${s.averageProgress}%`,
                              height: '100%',
                              backgroundColor: s.color || 'var(--brand-primary)',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>👥 {s.studentCount} Students</span>
                          <span>•</span>
                          <span>📚 {s.topicCount} Topics</span>
                          <span>•</span>
                          <span>📁 {s.materialCount} Materials</span>
                          <span>•</span>
                          <span>📑 {s.assignmentCount} Assignments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment Completion & Review Queue */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Assignment Completion Tracker
                    </h2>
                  </div>
                  <Link to="/teacher/assignments" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    View All ({assignmentOverview.totalPendingReview} Pending) →
                  </Link>
                </div>

                {recentAssignments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No assignments created for your classes yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentAssignments.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {a.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {a.subject?.title} • Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'None'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: a.completionRate >= 70 ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                              color: a.completionRate >= 70 ? 'var(--status-success-text)' : 'var(--status-info-text)',
                            }}
                          >
                            {a.submissionsCount} / {a.expectedSubmissions} Submitted ({a.completionRate}%)
                          </span>

                          {a.pendingReview > 0 && (
                            <Link
                              to="/teacher/assignments"
                              className="badge"
                              style={{
                                backgroundColor: 'var(--pastel-pink-subtle)',
                                color: '#8A1C78',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.7rem',
                              }}
                            >
                              Grade ({a.pendingReview})
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Weak Areas, Student Pacing, Recent Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Conceptual Weak Areas */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)', borderTop: '4px solid var(--pastel-pink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="#8A1C78" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Target Weak Areas & Concept Gaps
                    </h2>
                  </div>
                  <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'var(--pastel-pink-subtle)', color: '#8A1C78' }}>
                    Under 75% Average
                  </span>
                </div>

                {weakAreas.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <CheckCircle2 size={24} color="#0D7A4D" style={{ margin: '0 auto 0.4rem' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>Strong class performance!</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No critical topic gaps detected across your active courses.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {weakAreas.map((w, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            ⚠️ {w.topicOrQuiz}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Based on {w.attemptCount} assessment evaluation(s)
                          </div>
                        </div>

                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: '#B91C36',
                          }}
                        >
                          {w.averageScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Materials & Teacher Announcements */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Megaphone size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Recent Announcements & Materials
                    </h2>
                  </div>
                  <Link to="/teacher/announcements" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    Manage →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Announcements */}
                  {recentAnnouncements.map((an) => (
                    <div
                      key={an._id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        📢 {an.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span>{an.subject?.title}</span>
                        <span>•</span>
                        <span>{new Date(an.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}

                  {/* Materials */}
                  {recentMaterials.map((mat) => (
                    <div
                      key={mat._id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          📁 {mat.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {mat.subject?.title} • {mat.fileType?.toUpperCase()}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {mat.downloadCount || 0} downloads
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
