import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle,
  BarChart2,
  CheckSquare,
  HelpCircle,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import progressService from '../../services/progressService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/UI/PageHeader';

const PERIOD_LABELS = {
  daily: 'Daily (Last 14 Days)',
  weekly: 'Weekly (Last 8 Weeks)',
  monthly: 'Monthly (Last 6 Months)',
};

const ProgressDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [chartPoints, setChartPoints] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch full dashboard on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await progressService.getDashboardProgress(selectedPeriod);
        if (res.success && res.data) {
          setDashboardData(res.data);
          setChartPoints(res.data.chartData || []);
        } else {
          setError('Failed to load study analytics.');
        }
      } catch (err) {
        console.error('Error loading progress dashboard:', err);
        setError(err.response?.data?.message || 'Could not retrieve progress analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch chart data when period changes
  const handlePeriodChange = async (period) => {
    if (period === selectedPeriod) return;
    setSelectedPeriod(period);
    try {
      setIsChartLoading(true);
      const res = await progressService.getPeriodicAnalytics(period);
      if (res.success && res.data) {
        setChartPoints(res.data);
      }
    } catch (err) {
      console.error('Error switching chart period:', err);
    } finally {
      setIsChartLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div
          className="animate-spin"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E7C6FF',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            margin: '0 auto 1.25rem',
          }}
        />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Aggregating Real Learning Progress...
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Calculating study hours, streak consistency, and subject mastery
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Unable to Load Progress
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {error || 'An unexpected error occurred while fetching your learning progress.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { overview, subjectProgress = [], recentActivity = [], recommendationDataContract } = dashboardData;
  const { streak, studyHours, tasks, assignments, quizzes } = overview;
  const weakTopics = recommendationDataContract?.weakTopics || [];

  // SVG Chart Dimensions
  const maxStudyHour = Math.max(...chartPoints.map((p) => p.studyHours || 0), 2);
  const chartHeight = 160;

  return (
    <div className="animate-fade-in" style={{ width: '100%', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <PageHeader
        badge="Performance Analytics"
        title="Study Progress & Mastery Dashboard"
        description="Empirical insights computed from your completed study sessions, tasks, and quizzes."
        action={
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link
              to="/recommendations"
              className="btn btn-primary"
              style={{ gap: '0.4rem' }}
            >
              <Sparkles size={15} />
              AI Advice
            </Link>
            <Link
              to="/study-planner"
              className="btn btn-secondary"
              style={{ gap: '0.4rem' }}
            >
              <Sparkles size={15} color="var(--brand-primary)" />
              AI Planner
            </Link>
            <Link
              to="/quizzes"
              className="btn btn-outline"
              style={{ gap: '0.4rem' }}
            >
              <HelpCircle size={15} />
              Practice Quizzes
            </Link>
          </div>
        }
      />

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        {/* 1. Study Streak Card */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            borderTop: '4px solid #E7C6FF',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF6FF 100%)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Study Streak
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--pastel-mauve-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={20} color="#9C448E" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              {streak.currentStreak}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9C448E' }}>
              {streak.currentStreak === 1 ? 'Day Streak' : 'Days Streak'} 🔥
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Best Record: <strong style={{ color: 'var(--text-main)' }}>{streak.longestStreak} days</strong> • {streak.activeDaysTotal} total active days
          </p>
        </div>

        {/* 2. Total Study Hours Card */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            borderTop: '4px solid #BBD0FF',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F9FF 100%)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Study Time
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--pastel-sky-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} color="#1E4D8A" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              {studyHours.totalHours}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E4D8A' }}>
              Hours Logged
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {studyHours.completedSessions} of {studyHours.totalSessions} scheduled sessions completed ({studyHours.completionRate}%)
          </p>
        </div>

        {/* 3. Task & Assignment Completion Card */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            borderTop: '4px solid #C8B6FF',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Task & Workload
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--pastel-lavender-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckSquare size={20} color="var(--brand-primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              {tasks.completionRate}%
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
              Completed
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {tasks.completedTasks}/{tasks.totalTasks} tasks done • {assignments.submittedAssignments}/{assignments.totalAssignments} assignments submitted
          </p>
        </div>

        {/* 4. Quiz Performance Card */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            borderTop: '4px solid #FFD6FF',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9FE 100%)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quiz Mastery
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--pastel-pink-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={20} color="#8A1C78" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
              {quizzes.averageScore}%
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8A1C78' }}>
              Average Score
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {quizzes.totalAttempts} total attempts • {quizzes.passRate}% pass rate • Peak {quizzes.highestScore}%
          </p>
        </div>
      </div>

      {/* Interactive Activity Chart Section */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          background: 'white',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
              Study Hours & Activity Trajectory
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Hover over points to inspect hours, completed sessions, and quiz scores
            </p>
          </div>

          {/* Period Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--surface-sunken)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => handlePeriodChange(period)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedPeriod === period ? 'white' : 'transparent',
                  color: selectedPeriod === period ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: selectedPeriod === period ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize',
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Responsive Chart Canvas */}
        <div style={{ position: 'relative', minHeight: '190px' }}>
          {isChartLoading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                className="animate-spin"
                style={{
                  width: '28px',
                  height: '28px',
                  border: '2px solid #E7C6FF',
                  borderTopColor: 'var(--brand-primary)',
                  borderRadius: '50%',
                }}
              />
            </div>
          ) : (
            <div>
              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(30, 41, 59, 0.94)',
                    color: 'white',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span>
                    <strong>{hoveredPoint.label}</strong>
                  </span>
                  <span>⏳ {hoveredPoint.studyHours}h studied</span>
                  {hoveredPoint.tasksCompleted > 0 && <span>✅ {hoveredPoint.tasksCompleted} tasks</span>}
                  {hoveredPoint.quizzesTaken > 0 && <span>🎯 {hoveredPoint.quizzesTaken} quiz ({hoveredPoint.averageScore}%)</span>}
                </div>
              )}

              {/* Responsive Bar Grid */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: `${chartHeight}px`,
                  paddingTop: '20px',
                  gap: '0.35rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                {chartPoints.map((pt, idx) => {
                  const heightPercent = maxStudyHour > 0 ? Math.max((pt.studyHours / maxStudyHour) * 100, 4) : 4;
                  const isHovered = hoveredPoint?.label === pt.label;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Bar Fill */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: selectedPeriod === 'daily' ? '32px' : '48px',
                          height: `${heightPercent}%`,
                          borderRadius: '6px 6px 0 0',
                          background:
                            pt.studyHours > 0
                              ? isHovered
                                ? 'linear-gradient(180deg, #C8B6FF 0%, #B8C0FF 100%)'
                                : 'linear-gradient(180deg, #E7C6FF 0%, #C8B6FF 100%)'
                              : 'rgba(231, 198, 255, 0.25)',
                          transition: 'all 0.2s ease',
                          boxShadow: isHovered ? '0 4px 12px rgba(200, 182, 255, 0.5)' : 'none',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.65rem',
                  gap: '0.35rem',
                }}
              >
                {chartPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      fontWeight: hoveredPoint?.label === pt.label ? 700 : 500,
                      color: hoveredPoint?.label === pt.label ? 'var(--brand-primary)' : 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pt.shortLabel || pt.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weak Topics / Areas Needing Focus Banner (Phase 10 Foundation) */}
      {weakTopics.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF5FC 0%, #FAF0FA 100%)',
            border: '1.5px solid #FFD6FF',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={20} color="#9C246E" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4A154B', margin: 0 }}>
                Concepts Needing Revision ({weakTopics.length})
              </h3>
            </div>
            <Link
              to="/recommendations"
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#9C246E',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Sparkles size={14} /> Full AI Recommendations →
            </Link>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#68245D', margin: '0 0 1rem', lineHeight: 1.5 }}>
            Our diagnostic analytics identified the following topics where quiz performance was below 70%. Reinforcing these topics now will significantly boost your test readiness!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {weakTopics.map((topic) => (
              <div
                key={topic.topicId}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid #FFD6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#FCE7F3', color: '#9C246E' }}>
                      {topic.averageScore}% Mastery
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{topic.subjectTitle}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {topic.topicTitle}
                  </h4>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Link
                    to={`/quizzes/new?topicId=${topic.topicId}&subjectId=${topic.subjectId}`}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Quiz
                  </Link>
                  <Link
                    to={`/assistant?subjectId=${topic.subjectId}&topicId=${topic.topicId}&prompt=${encodeURIComponent(`Explain ${topic.topicTitle} simply with step-by-step examples`)}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Subject Mastery Cards & Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Left: Subject-Wise Progress Cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Enrolled Course Progress ({subjectProgress.length})
            </h2>
            <Link to="/subjects" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
              View All Courses →
            </Link>
          </div>

          {subjectProgress.length === 0 ? (
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
              }}
            >
              <BookOpen size={36} color="var(--brand-primary)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No Enrolled Subjects Yet
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Enroll in subjects to unlock customized topic-level tracking.
              </p>
              <Link to="/subjects" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Browse Subjects
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {subjectProgress.map((subj) => {
                const colorAccent = subj.color || '#BBD0FF';

                return (
                  <div
                    key={subj.subjectId}
                    className="card"
                    style={{
                      padding: '1.35rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      background: 'white',
                      boxShadow: 'var(--shadow-xs)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* Subject Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'var(--surface-sunken)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {subj.code || 'COURSE'}
                          </span>
                          {subj.teacher && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              • {subj.teacher.name}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {subj.title}
                        </h3>
                      </div>

                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: 'var(--brand-primary)',
                          background: 'var(--pastel-lavender-subtle)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                        }}
                      >
                        {subj.masteryScore}% Mastery
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: '8px',
                        width: '100%',
                        background: 'var(--surface-sunken)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${subj.topicCompletionRate}%`,
                          background: colorAccent,
                          borderRadius: '999px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>

                    {/* Metadata Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <span>
                        📚 <strong>{subj.completedTopics}/{subj.totalTopics}</strong> Topics
                      </span>
                      <span>
                        ⏳ <strong>{subj.studyHours}h</strong> Studied
                      </span>
                      <span>
                        🎯 <strong>{subj.averageQuizScore !== null ? `${subj.averageQuizScore}%` : 'N/A'}</strong> Quiz Avg
                      </span>

                      <Link
                        to={`/progress/subjects/${subj.subjectId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontWeight: 700,
                          color: 'var(--brand-primary)',
                          textDecoration: 'none',
                        }}
                      >
                        Breakdown <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Learning Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Recent Learning Milestones
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
              }}
            >
              <Zap size={36} color="var(--brand-primary)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No Activity Logged Yet
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Complete your first study session or task to see your activity timeline here!
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'white',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              {recentActivity.map((item, idx) => {
                let badgeNode = null;
                if (item.type === 'session') {
                  badgeNode = (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pastel-sky-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={16} color="#1E4D8A" />
                    </div>
                  );
                } else if (item.type === 'task') {
                  badgeNode = (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pastel-lavender-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={16} color="var(--brand-primary)" />
                    </div>
                  );
                } else if (item.type === 'quiz') {
                  badgeNode = (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pastel-pink-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={16} color="#8A1C78" />
                    </div>
                  );
                }

                const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-sunken)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {badgeNode}
                      <div>
                        <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {item.subject ? item.subject.title : 'General Academic'} • {dateStr}
                        </span>
                      </div>
                    </div>

                    {item.score !== undefined && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: item.passed ? '#ECFDF5' : '#FEF2F2',
                          color: item.passed ? '#065F46' : '#991B1B',
                          flexShrink: 0,
                        }}
                      >
                        {item.score}%
                      </span>
                    )}
                    {item.durationMinutes !== undefined && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {item.durationMinutes}m
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
