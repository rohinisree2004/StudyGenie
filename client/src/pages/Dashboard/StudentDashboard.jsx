import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import {
  Sparkles,
  BookOpen,
  Clock,
  Calendar,
  CheckSquare,
  Layers,
  Bot,
  Zap,
  HelpCircle,
  TrendingUp,
  Compass,
  Bell,
  Flame,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  PenTool,
  ChevronRight,
  Play,
  Check,
} from 'lucide-react';
import StatCard from '../../components/UI/StatCard';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getStudentDashboard();
      if (res.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Could not load your learning dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDue = (dateStr) => {
    if (!dateStr) return 'No due date';
    const due = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((due - now) / (1000 * 60 * 60));
    if (diffHours < 0) return 'Overdue';
    if (diffHours <= 24) return `Due in ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `Due in ${diffDays}d (${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
  };

  const studyStats = dashboard?.studyStats || {
    currentStreak: 0,
    longestStreak: 0,
    totalStudyHours: 0,
    completedSessionsCount: 0,
    dailyGoalHours: 4,
  };

  const quizPerformance = dashboard?.quizPerformance || {
    totalAttempts: 0,
    averageScore: 0,
    passingRate: 0,
    recentAttempts: [],
  };

  const todaySessions = dashboard?.todaySessions || [];
  const upcomingSessions = dashboard?.upcomingSessions || [];
  const activeSessions = todaySessions.length > 0 ? todaySessions : upcomingSessions;
  const isViewingUpcoming = todaySessions.length === 0 && upcomingSessions.length > 0;

  const subjectProgress = dashboard?.subjectProgress || [];
  const pendingAssignments = dashboard?.pendingAssignments || [];
  const pendingTasks = dashboard?.pendingTasks || [];
  const activeRecommendation = dashboard?.activeRecommendation;
  const recentMaterials = dashboard?.recentMaterials || [];
  const recentNotes = dashboard?.recentNotes || [];
  const recentNotifications = dashboard?.recentNotifications || [];

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Banner */}
      <div
        className="card card-pastel-sky"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
            <span className="badge badge-student">
              <BookOpen size={13} /> Student Workspace
            </span>
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--pastel-pink-subtle)',
                color: '#8A1C78',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Flame size={13} color="#D9383A" />
              {studyStats.currentStreak} Day Study Streak
            </span>
            {dashboard?.unreadNotificationsCount > 0 && (
              <Link to="/notifications" style={{ textDecoration: 'none' }}>
                <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
                  <Bell size={11} /> {dashboard.unreadNotificationsCount} Unread Alerts
                </span>
              </Link>
            )}
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {getGreeting()}, {user?.name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Track today’s schedule, review subject milestones, analyze quiz scores, and let Gemini AI guide your daily study pacing.
          </p>

          {user?.institution && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              🏛️ Enrolled at: <strong style={{ color: 'var(--text-secondary)' }}>{user.institution}</strong>
              {user.gradeLevel ? ` • ${user.gradeLevel}` : ''}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/study-planner" className="btn btn-primary" style={{ gap: '0.45rem', fontSize: '0.85rem' }}>
            <Sparkles size={15} /> AI Study Planner
          </Link>
          <button
            onClick={loadDashboard}
            className="btn btn-ghost"
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)' }}
            title="Refresh Live Learning Stats"
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
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-4" style={{ marginBottom: '1.75rem' }}>
            <StatCard
              label="Total Study Time"
              value={`${studyStats.totalStudyHours} hrs`}
              subtext={`Daily Target: ${studyStats.dailyGoalHours}h / day`}
              icon={Clock}
              pastel="sky"
            />
            <StatCard
              label="Study Streak"
              value={`${studyStats.currentStreak} Days`}
              subtext={`Personal Best: ${studyStats.longestStreak} days`}
              icon={Flame}
              pastel="pink"
            />
            <StatCard
              label="Sessions Completed"
              value={studyStats.completedSessionsCount}
              subtext="Logged study blocks"
              icon={CheckCircle2}
              pastel="lavender"
            />
            <StatCard
              label="Quiz Performance"
              value={`${quizPerformance.averageScore}%`}
              subtext={`${quizPerformance.totalAttempts} Attempts • ${quizPerformance.passingRate}% Pass Rate`}
              icon={Award}
              pastel="mauve"
            />
          </div>

          {/* Quick Action Hub */}
          <div
            className="card"
            style={{
              padding: '1.15rem 1.5rem',
              marginBottom: '1.75rem',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'linear-gradient(135deg, #FFFFFF 0%, var(--bg-subtle) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--pastel-lavender-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="var(--brand-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>AI Power Tools</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Direct shortcuts to specialized learning modules</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/study-planner" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <Calendar size={13} color="var(--brand-primary)" /> Planner
              </Link>
              <Link to="/assistant" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <Bot size={13} color="var(--brand-primary)" /> Assistant
              </Link>
              <Link to="/summarizer" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <Zap size={13} color="var(--brand-primary)" /> Summarizer
              </Link>
              <Link to="/quizzes" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <HelpCircle size={13} color="var(--brand-primary)" /> Quizzes
              </Link>
              <Link to="/recommendations" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <Compass size={13} color="var(--brand-primary)" /> AI Advice
              </Link>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
            {/* Left Column: Schedule & AI Advice & Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Today's / Upcoming Study Sessions */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {isViewingUpcoming ? 'Upcoming Study Sessions' : "Today's Study Sessions"}
                    </h2>
                  </div>
                  <Link to="/calendar" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    View Calendar →
                  </Link>
                </div>

                {activeSessions.length === 0 ? (
                  <div style={{ padding: '2rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                    <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      No sessions scheduled for today
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', maxWidth: '360px', margin: '0 auto 1rem' }}>
                      Generate an optimized study schedule tailored to your syllabus with the AI Study Planner.
                    </p>
                    <Link to="/study-planner" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                      Plan Day with Gemini
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeSessions.slice(0, 4).map((session) => (
                      <div
                        key={session._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-subtle)',
                          borderLeft: `4px solid ${session.subject?.color || 'var(--pastel-sky)'}`,
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {session.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                              <span>{session.subject?.title || 'General'}</span>
                              {session.topic?.title && (
                                <>
                                  <span>•</span>
                                  <span>{session.topic.title}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{session.durationMinutes || 60}m</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Link to="/calendar" className="btn btn-ghost" style={{ padding: '0.3rem', borderRadius: '50%' }}>
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actionable AI Learning Recommendations */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)', borderTop: '4px solid var(--pastel-pink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Compass size={18} color="#8A1C78" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      AI Focus Areas & Advice
                    </h2>
                  </div>
                  <Link to="/recommendations" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    Full Report →
                  </Link>
                </div>

                {activeRecommendation ? (
                  <div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                      {activeRecommendation.summary || 'Based on your recent quiz scores, here are high-priority topics to revise:'}
                    </div>

                    {activeRecommendation.weakTopics?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                        {activeRecommendation.weakTopics.slice(0, 4).map((topic, idx) => (
                          <span
                            key={idx}
                            className="badge"
                            style={{
                              backgroundColor: 'var(--pastel-pink-subtle)',
                              color: '#8A1C78',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            ⚠️ {topic.topicTitle || topic.topic || 'Target Topic'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Recommended Study Allocation:
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {activeRecommendation.recommendedDailyHours || 3} hrs / day
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Complete quizzes and study sessions to unlock personalized AI diagnostic advice.
                    </p>
                    <Link to="/quizzes" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                      Take a Practice Quiz
                    </Link>
                  </div>
                )}
              </div>

              {/* Subject Pacing & Progress */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Curriculum Pacing
                    </h2>
                  </div>
                  <Link to="/subjects" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    All Courses →
                  </Link>
                </div>

                {subjectProgress.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>You are not enrolled in any academic courses yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {subjectProgress.map((subj) => (
                      <div key={subj.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                          <Link to={`/subjects/${subj.id}`} style={{ textDecoration: 'none', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: subj.color || '#BBD0FF' }} />
                            {subj.title} ({subj.code || 'Course'})
                          </Link>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {subj.progress}% ({subj.completedTopics}/{subj.totalTopics} topics)
                          </span>
                        </div>

                        {/* Soft Pastel Progress Track */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${subj.progress}%`,
                              height: '100%',
                              backgroundColor: subj.color || 'var(--brand-primary)',
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Deadlines, Materials, Notes, Notifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Deadlines & Pending Work */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Deadlines & Tasks
                    </h2>
                  </div>
                  <Link to="/tasks" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    All Tasks →
                  </Link>
                </div>

                {pendingAssignments.length === 0 && pendingTasks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <Check size={28} color="#0D7A4D" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>All caught up!</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No pending assignments or tasks due.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Pending Assignments */}
                    {pendingAssignments.map((a) => (
                      <Link
                        key={a._id}
                        to={`/assignments/${a._id}`}
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.85rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            📑 {a.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {a.subject?.title} • {a.totalPoints} pts
                          </div>
                        </div>

                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: 'var(--pastel-pink-subtle)',
                            color: '#8A1C78',
                            fontWeight: 700,
                          }}
                        >
                          {formatDue(a.dueDate)}
                        </span>
                      </Link>
                    ))}

                    {/* Pending Tasks */}
                    {pendingTasks.map((t) => (
                      <Link
                        key={t._id}
                        to={`/tasks/${t._id}`}
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.85rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            ☑️ {t.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.subject?.title || 'Personal Task'}
                          </div>
                        </div>

                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: 'var(--pastel-periwinkle-subtle)',
                            color: '#242F55',
                            fontWeight: 600,
                          }}
                        >
                          {formatDue(t.dueDate)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Materials & Notes */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Recent Resources & Notes
                    </h2>
                  </div>
                  <Link to="/materials" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    Browse All →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {recentMaterials.slice(0, 2).map((m) => (
                    <Link
                      key={m._id}
                      to={`/materials/${m._id}`}
                      style={{
                        textDecoration: 'none',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} color="var(--brand-primary)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {m.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {m.fileType?.toUpperCase()}
                      </span>
                    </Link>
                  ))}

                  {recentNotes.slice(0, 2).map((n) => (
                    <Link
                      key={n._id}
                      to={`/notes/${n._id}`}
                      style={{
                        textDecoration: 'none',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PenTool size={14} color="#6B2D8C" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {n.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Note
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Notifications Widget */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={18} color="var(--brand-primary)" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Recent Alerts
                    </h2>
                  </div>
                  <Link to="/notifications" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    View All →
                  </Link>
                </div>

                {recentNotifications.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No notifications received yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {recentNotifications.slice(0, 3).map((n) => (
                      <div
                        key={n._id}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: n.isRead ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderLeft: n.isRead ? '1px solid var(--border-light)' : '3px solid var(--brand-primary)',
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {n.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
