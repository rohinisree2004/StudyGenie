import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Compass,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
  Flame,
  HelpCircle,
  FileText,
  CheckSquare,
  ShieldAlert,
  GraduationCap,
  Award,
} from 'lucide-react';
import recommendationService from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';

const StudyRecommendations = () => {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'weak' | 'subjects' | 'deadlines' | 'strategies'

  // Fetch recommendations on page load
  const fetchRecommendations = async (force = false) => {
    try {
      if (force) {
        setIsRegenerating(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await recommendationService.getRecommendations(force);
      if (res.success && res.data) {
        setRecommendation(res.data);
        setIsCached(res.cached || false);
        setExpiresAt(res.expiresAt || res.data.expiresAt);
      } else {
        setError('Unable to load AI study recommendations.');
      }
    } catch (err) {
      console.error('Failed to load study recommendations:', err);
      setError(err.message || 'Error generating AI recommendations.');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  const handleRegenerate = () => {
    fetchRecommendations(true);
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return {
          bg: '#FFE5EC',
          text: '#D90429',
          border: '#FFCCD5',
          label: 'High Priority',
          icon: <AlertTriangle size={13} className="mr-1" />,
        };
      case 'medium':
        return {
          bg: '#FFF3CD',
          text: '#B7791F',
          border: '#FFEAA7',
          label: 'Moderate Priority',
          icon: <Clock size={13} className="mr-1" />,
        };
      case 'low':
      default:
        return {
          bg: '#EBF4FF',
          text: '#3182CE',
          border: '#C3DAFE',
          label: 'Foundational',
          icon: <CheckCircle2 size={13} className="mr-1" />,
        };
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Pacesetter':
        return { bg: '#E7C6FF', text: '#5B21B6', border: '#C8B6FF' };
      case 'Consistent Scholar':
        return { bg: '#BBD0FF', text: '#1E40AF', border: '#B8C0FF' };
      case 'Emerging Potential':
        return { bg: '#FFD6FF', text: '#86198F', border: '#E7C6FF' };
      case 'Building Foundations':
      default:
        return { bg: '#FFF0F5', text: '#9D174D', border: '#FCE7F3' };
    }
  };

  const formatExpiryTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
        {/* Skeleton loading */}
        <div
          className="rounded-3xl p-8 border animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #FFD6FF 0%, #C8B6FF 50%, #BBD0FF 100%)',
            opacity: 0.8,
            height: '240px',
          }}
        >
          <div className="h-6 w-48 bg-white/60 rounded-full mb-4"></div>
          <div className="h-10 w-3/4 bg-white/60 rounded-xl mb-4"></div>
          <div className="h-5 w-1/2 bg-white/60 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-64 animate-pulse">
              <div className="h-5 w-24 bg-slate-200 rounded-full mb-4"></div>
              <div className="h-6 w-48 bg-slate-200 rounded mb-3"></div>
              <div className="h-16 w-full bg-slate-100 rounded-lg mb-4"></div>
              <div className="h-8 w-28 bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !recommendation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Could Not Load Recommendations</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => fetchRecommendations(true)}
          className="inline-flex items-center px-6 py-3 rounded-xl text-white font-medium shadow-md transition-all duration-200"
          style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
        >
          <RefreshCw size={18} className="mr-2" />
          Retry Generating Recommendations
        </button>
      </div>
    );
  }

  const overview = recommendation?.overview || {};
  const weakTopics = recommendation?.weakTopicRecommendations || [];
  const subjectAttention = recommendation?.subjectAttention || [];
  const scheduleAdvice = recommendation?.studyScheduleAdvice || {};
  const prioritizedDeadlines = recommendation?.prioritizedDeadlines || [];
  const revisionStrategies = recommendation?.revisionStrategies || [];
  const recommendedResources = recommendation?.recommendedResources || [];
  const tierStyle = getTierBadge(overview.performanceTier);

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* 1. TOP HERO HEADER WITH AI QUOTE */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md border"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 214, 255, 0.55) 0%, rgba(200, 182, 255, 0.45) 50%, rgba(187, 208, 255, 0.55) 100%)',
          borderColor: 'rgba(200, 182, 255, 0.6)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top pill badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-purple-900 shadow-xs border border-purple-200 backdrop-blur-sm">
                <Sparkles size={13} className="mr-1 text-purple-600" />
                StudyGenie AI Strategist
              </span>

              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: tierStyle.bg,
                  color: tierStyle.text,
                  borderColor: tierStyle.border,
                }}
              >
                <Award size={13} className="mr-1" />
                {overview.performanceTier || 'Consistent Scholar'}
              </span>

              {isCached ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-700 border border-slate-200/80">
                  <Clock size={11} className="mr-1 text-slate-500" />
                  Cached · Active until {formatExpiryTime(expiresAt)}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <CheckCircle2 size={11} className="mr-1 text-emerald-600" />
                  Live AI Generated Just Now
                </span>
              )}
            </div>

            {/* Inspiring Strategic Quote */}
            <blockquote className="text-xl md:text-2xl font-bold text-slate-800 leading-snug tracking-tight">
              &ldquo;{recommendation?.summaryQuote}&rdquo;
            </blockquote>

            {/* Strategic Overview Meta Bar */}
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-slate-700">
              {overview.keyFocusArea && (
                <div className="flex items-center space-x-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-white/80 backdrop-blur-xs">
                  <Target size={16} className="text-purple-600" />
                  <span className="font-medium text-slate-800">Focus:</span>
                  <span className="text-slate-600 truncate max-w-xs">{overview.keyFocusArea}</span>
                </div>
              )}

              {overview.recommendedFocusSubject && (
                <div className="flex items-center space-x-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-white/80 backdrop-blur-xs">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-800">Priority Subject:</span>
                  <span className="text-slate-600">{overview.recommendedFocusSubject}</span>
                </div>
              )}

              {scheduleAdvice.optimalStudyTime && (
                <div className="flex items-center space-x-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-white/80 backdrop-blur-xs">
                  <Clock size={16} className="text-blue-600" />
                  <span className="font-medium text-slate-800">Optimal Window:</span>
                  <span className="text-slate-600 capitalize">{scheduleAdvice.optimalStudyTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow disabled:opacity-75 cursor-pointer"
              style={{
                backgroundColor: 'var(--brand-primary, #5A5FDB)',
              }}
              title="Re-analyze learning activities and synthesize fresh AI advice"
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${isRegenerating ? 'animate-spin' : ''}`}
              />
              {isRegenerating ? 'Synthesizing...' : 'Regenerate AI Advice'}
            </button>
            <span className="text-xs text-slate-500 text-right">
              Powered by {recommendation?.aiModel || 'Gemini'}
            </span>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div
          className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #FFD6FF 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 2. NAVIGATION FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Recommendations', count: null },
          { id: 'weak', label: 'Weak Concepts', count: weakTopics.length },
          { id: 'subjects', label: 'Subject Attention', count: subjectAttention.length },
          { id: 'deadlines', label: 'Prioritized Deadlines', count: prioritizedDeadlines.length },
          { id: 'strategies', label: 'Revision Tactics', count: revisionStrategies.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-purple-200 text-purple-900 font-bold'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. SECTION: PACING & SCHEDULE ADVICE (Always shown when tab is 'all') */}
      {(activeTab === 'all') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Compass size={20} className="mr-2 text-purple-600" />
                Optimal Study Rhythm & Pacing
              </h3>
              <p className="text-sm text-slate-500">
                AI calculated benchmarks tailored to your current academic commitments
              </p>
            </div>
            <Link
              to="/planner"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center"
            >
              Open AI Planner <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Minutes */}
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 space-y-1">
              <span className="text-xs font-medium text-purple-800 uppercase tracking-wider">
                Daily Study Target
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-purple-900">
                  {scheduleAdvice.recommendedDailyMinutes || 90}
                </span>
                <span className="text-sm font-medium text-purple-700">minutes/day</span>
              </div>
              <p className="text-xs text-slate-600 pt-1">
                Optimal for high-retention spaced learning
              </p>
            </div>

            {/* Weekly Target */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-1">
              <span className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                Weekly Target
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-blue-900">
                  {scheduleAdvice.recommendedWeeklyHours || 12}
                </span>
                <span className="text-sm font-medium text-blue-700">hours/week</span>
              </div>
              <p className="text-xs text-slate-600 pt-1">
                Balanced pace across enrolled courses
              </p>
            </div>

            {/* Optimal Window */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-1">
              <span className="text-xs font-medium text-indigo-800 uppercase tracking-wider">
                Optimal Peak Window
              </span>
              <div className="text-xl font-bold text-indigo-900 capitalize flex items-center">
                <Clock size={18} className="mr-1.5 text-indigo-600" />
                {scheduleAdvice.optimalStudyTime || 'Evening'}
              </div>
              <p className="text-xs text-slate-600 pt-1">
                Peak cognitive readiness period
              </p>
            </div>

            {/* Streak Advice */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-1">
              <span className="text-xs font-medium text-amber-800 uppercase tracking-wider flex items-center">
                <Flame size={13} className="mr-1 text-amber-600" />
                Streak Protection
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed pt-1">
                {scheduleAdvice.streakAdvice ||
                  'Log at least one 25-minute session today to keep your streak unbroken.'}
              </p>
            </div>
          </div>

          {/* Workload Pacing Callout */}
          {scheduleAdvice.workloadPacing && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                <Brain size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tactical Workload Pacing Advice
                </h4>
                <p className="text-sm text-slate-600 mt-0.5">
                  {scheduleAdvice.workloadPacing}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SECTION: WEAK CONCEPTS & INTERVENTIONS */}
      {(activeTab === 'all' || activeTab === 'weak') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Target size={20} className="mr-2 text-rose-500" />
                Targeted Concept Interventions
              </h3>
              <p className="text-sm text-slate-500">
                Topics flagged for immediate revision based on quiz accuracy and curriculum pacing
              </p>
            </div>
            <Link
              to="/quizzes"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center"
            >
              Browse All Quizzes <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          {weakTopics.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800">No Critical Conceptual Gaps Detected!</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                You are currently scoring above the 70% threshold across all attempted quizzes. Keep advancing your syllabus!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((item, idx) => {
                const badge = getUrgencyBadge(item.urgency);
                return (
                  <div
                    key={item._id || idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Subject & Urgency */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {item.subjectTitle || 'General Course'}
                        </span>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: badge.border,
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>

                      {/* Topic title */}
                      <h4 className="text-base font-bold text-slate-800">
                        {item.topicTitle}
                      </h4>

                      {/* Mastery Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Demonstrated Mastery</span>
                          <span className="font-semibold text-slate-700">
                            {item.currentMastery}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, item.currentMastery))}%`,
                              backgroundColor:
                                item.currentMastery < 50
                                  ? '#EF4444'
                                  : item.currentMastery < 70
                                  ? '#F59E0B'
                                  : '#10B981',
                            }}
                          />
                        </div>
                      </div>

                      {/* Diagnostic Reason */}
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700">Diagnostic: </span>
                        {item.diagnosticReason}
                      </div>

                      {/* Actionable Strategy */}
                      <div className="text-xs text-purple-900 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                        <span className="font-semibold text-purple-800">Recommended Action: </span>
                        {item.recommendedAction}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Direct Intervention</span>
                      <Link
                        to={item.actionUrl || '/quizzes'}
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
                      >
                        Launch Practice <ArrowRight size={13} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION: SUBJECT ATTENTION & EFFORT ALLOCATION */}
      {(activeTab === 'all' || activeTab === 'subjects') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <BookOpen size={20} className="mr-2 text-indigo-600" />
                Subject Attention & Study Pacing
              </h3>
              <p className="text-sm text-slate-500">
                Weekly effort allocation tailored to keep syllabus progression balanced
              </p>
            </div>
            <Link
              to="/progress"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center"
            >
              View Analytics Dashboard <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          {subjectAttention.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
              No enrolled subjects found to analyze.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjectAttention.map((sub, idx) => {
                const priorityBadge = getUrgencyBadge(sub.priorityLevel);
                const progressPct =
                  sub.suggestedWeeklyHours > 0
                    ? Math.min(100, Math.round((sub.hoursLogged / sub.suggestedWeeklyHours) * 100))
                    : 100;

                return (
                  <div
                    key={sub._id || idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Top color indicator */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: sub.color || '#C8B6FF' }}
                    />

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                          {sub.subjectCode || 'Course'}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: priorityBadge.bg,
                            color: priorityBadge.text,
                            borderColor: priorityBadge.border,
                          }}
                        >
                          {priorityBadge.label}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800 truncate">
                        {sub.subjectTitle}
                      </h4>

                      {/* Hours Logged vs Target */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Hours Logged: {sub.hoursLogged}h</span>
                          <span className="font-semibold text-slate-800">
                            Target: {sub.suggestedWeeklyHours}h/wk
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: sub.color || '#B8C0FF',
                            }}
                          />
                        </div>
                      </div>

                      {/* Status Note */}
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        {sub.statusNote}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Weekly Target</span>
                      <Link
                        to="/calendar"
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center"
                      >
                        Schedule in Calendar <ChevronRight size={14} className="ml-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. SECTION: PRIORITIZED DEADLINES & AI STUDY TACTICS */}
      {(activeTab === 'all' || activeTab === 'deadlines') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckSquare size={20} className="mr-2 text-amber-500" />
                Prioritized Upcoming Deadlines & AI Tactics
              </h3>
              <p className="text-sm text-slate-500">
                Smart sequencing to execute assignments and tasks without last-minute panic
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <Link to="/tasks" className="font-semibold text-purple-700 hover:underline">
                View Tasks
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/assignments" className="font-semibold text-purple-700 hover:underline">
                View Assignments
              </Link>
            </div>
          </div>

          {prioritizedDeadlines.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
              No pressing upcoming deadlines recorded. You are fully caught up!
            </div>
          ) : (
            <div className="space-y-3">
              {prioritizedDeadlines.map((item, idx) => {
                const isUrgent = item.daysRemaining <= 2;
                return (
                  <div
                    key={item._id || idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            item.itemType === 'assignment'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.itemType}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.daysRemaining === 0
                            ? 'Due Today'
                            : item.daysRemaining === 1
                            ? 'Due Tomorrow'
                            : `${item.daysRemaining} days remaining`}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          {item.subjectTitle}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800">{item.title}</h4>

                      {item.aiTactic && (
                        <div className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 flex items-start space-x-2">
                          <Zap size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-amber-900">AI Execution Tactic: </span>
                            {item.aiTactic}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center justify-end">
                      <Link
                        to={item.actionUrl || (item.itemType === 'assignment' ? '/assignments' : '/tasks')}
                        className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-primary, #5A5FDB)' }}
                      >
                        Open {item.itemType === 'assignment' ? 'Assignment' : 'Task'}
                        <ArrowRight size={13} className="ml-1.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. SECTION: COGNITIVE REVISION STRATEGIES & CURATED RESOURCES */}
      {(activeTab === 'all' || activeTab === 'strategies') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revision Strategies */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <Brain size={18} className="mr-2 text-purple-600" />
                Evidence-Based Revision Techniques
              </h3>
            </div>

            <div className="space-y-3">
              {revisionStrategies.map((strat, idx) => (
                <div
                  key={strat._id || idx}
                  className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-purple-950 flex items-center">
                      <Zap size={14} className="mr-1.5 text-purple-600" />
                      {strat.strategyName}
                    </h4>
                    <span className="text-xs font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      {strat.technique}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {strat.description}
                  </p>
                  {strat.applicableTopic && (
                    <div className="text-xs text-purple-800 font-medium pt-1">
                      Applied to: <span className="font-semibold">{strat.applicableTopic}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Curated Resources */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <Layers size={18} className="mr-2 text-indigo-600" />
                Curated Practice & Reference Materials
              </h3>
              <Link to="/quizzes" className="text-xs font-semibold text-purple-700 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedResources.map((resItem, idx) => (
                <div
                  key={resItem._id || idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-purple-200 transition-colors bg-white flex items-center justify-between space-x-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold uppercase">
                        {resItem.resourceType}
                      </span>
                      {resItem.subjectTitle && (
                        <span className="text-xs text-slate-500 font-medium">
                          {resItem.subjectTitle}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {resItem.title}
                    </h4>
                    <p className="text-xs text-slate-500">{resItem.reason}</p>
                  </div>

                  <Link
                    to={resItem.actionUrl || '/quizzes'}
                    className="shrink-0 p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                    title="Launch resource"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyRecommendations;
