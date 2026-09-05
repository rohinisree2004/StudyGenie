import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { dashboardService } from '../../services/dashboardService';
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  HelpCircle,
  Clock,
  Activity,
  Server,
  Megaphone,
  UserPlus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Send,
  Database,
  Lock,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [selectedRange, setSelectedRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Quick broadcast modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'normal',
  });

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getAdminDashboard({ range: selectedRange });
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      setBannerMessage({ text: 'Could not fetch live dashboard metrics.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedRange]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await adminService.broadcastNotification(broadcastForm);
      setBannerMessage({
        text: `Platform broadcast dispatched to ${res.sentCount} user(s).`,
        type: 'success',
      });
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', targetRole: 'all', priority: 'normal' });
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setBannerMessage({ text: err.message || 'Failed to dispatch broadcast alert.', type: 'error' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'Just started';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const kpis = stats?.kpis || {};
  const aiStats = stats?.aiUsageStats || {
    recommendationsGenerated: 0,
    studyPlansCreated: 0,
    conversationsStarted: 0,
    summariesCreated: 0,
  };
  const quizAnalytics = stats?.quizPerformanceAnalytics || {
    averageScore: 0,
    passingRate: 0,
    totalAttempts: 0,
    brackets: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
  };
  const activityTrend = stats?.studyActivityTrend || [];

  const maxHoursInTrend = Math.max(1, ...activityTrend.map((t) => t.hours || 0));

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Banner */}
      <div
        className="card card-pastel-pink"
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
            <span className="badge badge-admin">
              <Shield size={13} /> System Administrator
            </span>
            <span className="badge badge-active">
              <CheckCircle2 size={13} /> Full Clearance
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            Admin Console & System Intelligence 🛡️
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Audit platform-wide activity, manage users and roles, oversee curriculum health, and monitor Google Gemini AI service utilization.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>⏱️ Cluster Uptime: <strong style={{ color: 'var(--text-secondary)' }}>{formatUptime(stats?.clusterHealth?.uptimeSeconds)}</strong></span>
            <span>•</span>
            <span>💾 Memory Heap: <strong style={{ color: 'var(--text-secondary)' }}>{stats?.clusterHealth?.memoryHeapUsedMB || 0} MB</strong></span>
          </div>
        </div>

        {/* Top Actions: Broadcast Modal Trigger & Refresh */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.45rem', fontSize: '0.85rem' }}
          >
            <Megaphone size={15} /> System Broadcast
          </button>
          <button
            onClick={loadStats}
            className="btn btn-ghost"
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)' }}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {bannerMessage.text && (
        <div
          className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}
          style={{ marginBottom: '1.5rem' }}
        >
          {bannerMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Date Range Analytics Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Analytical Aggregation Window:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: '7d', label: 'Past 7 Days' },
            { id: '30d', label: 'Past 30 Days' },
            { id: 'all', label: 'All-Time Cumulative' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setSelectedRange(range.id)}
              className={`btn btn-sm ${selectedRange === range.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : (
        <>
          {/* System KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '1.75rem' }}>
            {/* Total Users */}
            <div className="card card-pastel-pink" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Platform Accounts
                </span>
                <Users size={20} color="#8A1C78" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {kpis.users?.total || 0}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  🎓 {kpis.users?.students || 0} Students
                </span>
                <span>•</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  👨‍🏫 {kpis.users?.teachers || 0} Teachers
                </span>
                <span>•</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  🛡️ {kpis.users?.admins || 0} Admins
                </span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: kpis.users?.suspended > 0 ? '#B91C36' : 'var(--text-muted)' }}>
                {kpis.users?.suspended || 0} account(s) currently suspended
              </div>
            </div>

            {/* Curriculum */}
            <div className="card card-pastel-mauve" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Curriculum & Topics
                </span>
                <BookOpen size={20} color="#6B2D8C" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {kpis.curriculum?.activeSubjects || 0} Courses
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  📚 {kpis.curriculum?.totalTopics || 0} Syllabus Topics
                </span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Managed across faculty educators
              </div>
            </div>

            {/* Study Resources */}
            <div className="card card-pastel-lavender" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Study Resources
                </span>
                <FileText size={20} color="#3E347A" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {kpis.resources?.totalMaterials || 0} Files
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  📝 {kpis.resources?.totalQuizzes || 0} Quizzes
                </span>
                <span>•</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  🎯 {kpis.resources?.totalQuizAttempts || 0} Attempts
                </span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {kpis.resources?.totalStorageMB || 0} MB stored
              </div>
            </div>

            {/* Learning Hours */}
            <div className="card card-pastel-sky" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tracked Study Time
                </span>
                <Clock size={20} color="#244580" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {kpis.activity?.totalStudyHours || 0} hrs
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  ⏱️ {kpis.activity?.completedSessions || 0} Completed Sessions
                </span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Recorded across student study planner sessions
              </div>
            </div>
          </div>

          {/* Phase 14 Advanced Analytics Row: Activity Trend & Quiz Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
            {/* Study Activity Trends (Bar Chart) */}
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--brand-primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Study Activity Volume Trend
                  </h3>
                </div>
                <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'var(--pastel-sky-subtle)', color: '#242F55' }}>
                  {selectedRange === '7d' ? 'Past 7 Days' : selectedRange === '30d' ? 'Past 30 Days' : 'All-time'}
                </span>
              </div>

              {activityTrend.length === 0 ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <Clock size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No completed study activity recorded in this time window.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    {activityTrend.map((item, idx) => {
                      const heightPercent = Math.max(12, Math.round((item.hours / maxHoursInTrend) * 100));
                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            gap: '0.25rem',
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {item.hours}h
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: `${heightPercent}%`,
                              backgroundColor: 'var(--pastel-periwinkle)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease',
                            }}
                            title={`${item.date}: ${item.hours} hrs (${item.sessionsCount} sessions)`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{activityTrend[0]?.date}</span>
                    <span>{activityTrend[activityTrend.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Performance Analytics */}
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} color="var(--brand-primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Quiz Evaluation Analytics
                  </h3>
                </div>
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                  {quizAnalytics.passingRate}% Pass Rate
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {quizAnalytics.averageScore}%
                  </div>
                </div>
                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Evaluated Attempts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {quizAnalytics.totalAttempts}
                  </div>
                </div>
              </div>

              {/* Score Brackets Distribution Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Score Bracket Distribution
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2A4580' }} />
                      90 - 100% (Mastery / Excellent)
                    </span>
                    <strong>{quizAnalytics.brackets?.excellent || 0} attempts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5A5FDB' }} />
                      75 - 89% (Good)
                    </span>
                    <strong>{quizAnalytics.brackets?.good || 0} attempts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6B2D8C' }} />
                      50 - 74% (Passing)
                    </span>
                    <strong>{quizAnalytics.brackets?.average || 0} attempts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B91C36' }} />
                      &lt; 50% (Needs Remediation)
                    </span>
                    <strong style={{ color: '#B91C36' }}>{quizAnalytics.brackets?.needsImprovement || 0} attempts</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Usage Statistics Widget */}
          <div className="card" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', borderRadius: 'var(--radius-xl)', borderTop: '4px solid var(--pastel-lavender)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  AI Module Utilization & Engagement
                </h3>
              </div>
              <span className="badge badge-accent" style={{ backgroundColor: 'var(--pastel-lavender-subtle)', color: 'var(--brand-primary)' }}>
                Gemini 1.5 & Flash Models
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Compass size={14} color="var(--brand-primary)" /> AI Recommendations
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {aiStats.recommendationsGenerated}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pacing diagnostics generated</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Calendar size={14} color="var(--brand-primary)" /> AI Study Plans
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {aiStats.studyPlansCreated}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Schedules created & synced</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Bot size={14} color="var(--brand-primary)" /> AI Assistant Chats
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {aiStats.conversationsStarted}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Conversations conducted</div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Zap size={14} color="var(--brand-primary)" /> AI Content Summaries
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {aiStats.summariesCreated}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Material & note summaries</div>
              </div>
            </div>
          </div>

          {/* Administrative Modules Launchpads Grid */}
          <div className="card" style={{ padding: '2rem 2.25rem', marginBottom: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Administrative Modules & Control Center
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <Link to="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-pink)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>👥 User Directory</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Manage student, educator, and administrator accounts, roles, and statuses.
                  </p>
                </div>
              </Link>

              <Link to="/admin/students" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-sky)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>🎓 Student Roster</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Inspect student enrollments, daily study goals, and academic performance.
                  </p>
                </div>
              </Link>

              <Link to="/admin/teachers" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-mauve)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>👨‍🏫 Faculty Educators</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Assign faculty members to courses and review active educator workloads.
                  </p>
                </div>
              </Link>

              <Link to="/admin/subjects" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-lavender)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>📚 Curriculum & Topics</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Configure courses, syllabus topics, difficulty levels, and credit structures.
                  </p>
                </div>
              </Link>

              <Link to="/admin/materials" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-periwinkle)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>📁 Study Materials</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Moderate uploaded courseware documents, toggle public access, or delete files.
                  </p>
                </div>
              </Link>

              <Link to="/admin/quizzes" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid var(--pastel-pink)',
                    backgroundColor: 'var(--bg-subtle)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>🎯 Quiz Repository</h3>
                    <ArrowRight size={15} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Inspect generated assessments, questions, average scores, and attempts.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Infrastructure & Recent Users Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* System Health Widget */}
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={18} color="var(--brand-primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    System Health & Diagnostics
                  </h3>
                </div>
                <span className="badge badge-active">
                  <Activity size={12} /> Operational
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Database Cluster</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {stats?.systemHealth?.dbState === 'connected' ? '🟢 Connected (Atlas)' : '🔴 Disconnected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Server Uptime</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatUptime(stats?.systemHealth?.uptimeSeconds)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Node Environment</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {stats?.systemHealth?.environment || 'Development'} ({stats?.systemHealth?.nodeVersion})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Process Memory (Heap)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {stats?.systemHealth?.memoryHeapMB || 0} MB
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Role Provisioning</span>
                  <span style={{ fontWeight: 600, color: '#0D7A4D' }}>
                    🛡️ Admin Registration Restricted
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Registrations Table */}
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Recent Registrations
                </h3>
                <Link to="/admin/users" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>

              {stats?.recentUsers?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent user registrations found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats?.recentUsers?.slice(0, 5).map((u) => (
                    <div
                      key={u._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--pastel-pink)' : u.role === 'teacher' ? 'var(--pastel-mauve)' : 'var(--pastel-sky)',
                            color: '#242F55',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className={`badge ${u.role === 'admin' ? 'badge-admin' : u.role === 'teacher' ? 'badge-teacher' : 'badge-student'}`}
                          style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}
                        >
                          {u.role}
                        </span>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: u.accountStatus === 'active' ? '#0D7A4D' : '#B91C36',
                          }}
                          title={`Status: ${u.accountStatus}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="var(--brand-primary)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Platform Broadcast Alert
                </h2>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label className="form-label" htmlFor="broadcastTitle">Notice Title *</label>
                <input
                  id="broadcastTitle"
                  type="text"
                  className="form-input no-icon"
                  placeholder="e.g. Scheduled System Upgrade"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="broadcastRole">Target Audience</label>
                  <select
                    id="broadcastRole"
                    className="form-input no-icon"
                    value={broadcastForm.targetRole}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                  >
                    <option value="all">Everyone (All Accounts)</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="broadcastPriority">Priority Level</label>
                  <select
                    id="broadcastPriority"
                    className="form-input no-icon"
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                  >
                    <option value="normal">Normal (Informative)</option>
                    <option value="high">High (Notice)</option>
                    <option value="urgent">Urgent (Immediate)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="broadcastMessage">Notice Message *</label>
                <textarea
                  id="broadcastMessage"
                  rows={4}
                  className="form-input no-icon"
                  placeholder="Type announcement message dispatched to user notification centers..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="btn btn-primary"
                  style={{ gap: '0.45rem' }}
                >
                  <Send size={15} />
                  {isBroadcasting ? 'Dispatching...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
