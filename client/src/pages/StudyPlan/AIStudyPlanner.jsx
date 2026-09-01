import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Square,
  ArrowRight,
  Plus,
  RefreshCw,
  Trash2,
  Sliders,
  Award,
  Flame,
  Check,
  Zap,
  ChevronDown,
  Layers,
  Lightbulb,
} from 'lucide-react';
import studyPlanService from '../../services/studyPlanService';
import subjectService from '../../services/subjectService';
import PageHeader from '../../components/UI/PageHeader';

const AIStudyPlanner = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applyingCalendar, setApplyingCalendar] = useState(false);
  const [error, setError] = useState(null);

  // View mode: 'view' (inspecting active plan) or 'create' (wizard)
  const [viewMode, setViewMode] = useState('view');

  // Generator Wizard Form State
  const [formData, setFormData] = useState({
    goal: '',
    selectedSubjects: [],
    selectedTopics: [],
    examDate: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dailyStudyHours: 3,
    preferredStudyTime: 'evening',
    intensity: 'balanced',
  });

  const [availableTopicsBySubject, setAvailableTopicsBySubject] = useState({});

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, plansRes] = await Promise.all([
        subjectService.getSubjects(),
        studyPlanService.getPlans(),
      ]);

      const subList = subjectsRes.subjects || subjectsRes.data || [];
      setSubjects(subList);

      const planList = plansRes.data || [];
      setPlans(planList);

      // Default select all enrolled subjects for convenience
      if (subList.length > 0 && formData.selectedSubjects.length === 0) {
        const initialSubIds = subList.map((s) => s.id || s._id);
        setFormData((prev) => ({ ...prev, selectedSubjects: initialSubIds }));

        // Load topics for initial subjects
        initialSubIds.forEach((sId) => {
          subjectService.getTopics(sId).then((res) => {
            setAvailableTopicsBySubject((prev) => ({
              ...prev,
              [sId]: res.topics || res.data || [],
            }));
          }).catch(() => {});
        });
      }

      if (planId) {
        const single = await studyPlanService.getPlanById(planId);
        setActivePlan(single.data);
        setViewMode('view');
      } else if (planList.length > 0) {
        const single = await studyPlanService.getPlanById(planList[0]._id);
        setActivePlan(single.data);
        setViewMode('view');
      } else {
        setViewMode('create');
      }
    } catch (err) {
      setError(err.message || 'Failed to load study planner data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = async (subjId) => {
    const isSelected = formData.selectedSubjects.includes(subjId);
    let updated;
    if (isSelected) {
      updated = formData.selectedSubjects.filter((id) => id !== subjId);
    } else {
      updated = [...formData.selectedSubjects, subjId];
      if (!availableTopicsBySubject[subjId]) {
        try {
          const res = await subjectService.getTopics(subjId);
          setAvailableTopicsBySubject((prev) => ({
            ...prev,
            [subjId]: res.topics || res.data || [],
          }));
        } catch {}
      }
    }
    setFormData((prev) => ({ ...prev, selectedSubjects: updated }));
  };

  const handleTopicToggle = (topicId) => {
    const isSelected = formData.selectedTopics.includes(topicId);
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        selectedTopics: prev.selectedTopics.filter((id) => id !== topicId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedTopics: [...prev.selectedTopics, topicId],
      }));
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goal.trim()) {
      alert('Please specify your study goal or exam target.');
      return;
    }
    if (formData.selectedSubjects.length === 0) {
      alert('Please select at least one subject to study.');
      return;
    }

    try {
      setGenerating(true);
      const res = await studyPlanService.generatePlan({
        goal: formData.goal,
        subjects: formData.selectedSubjects,
        topics: formData.selectedTopics,
        examDate: formData.examDate || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        dailyStudyHours: formData.dailyStudyHours,
        preferredStudyTime: formData.preferredStudyTime,
        intensity: formData.intensity,
      });

      setActivePlan(res.data);
      setPlans((prev) => [res.data, ...prev]);
      setViewMode('view');
      navigate(`/study-planner/${res.data._id}`);
    } catch (err) {
      alert(err.message || 'Failed to generate study plan with Gemini AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyToCalendar = async () => {
    if (!activePlan) return;
    try {
      setApplyingCalendar(true);
      const res = await studyPlanService.applyToCalendar(activePlan._id);
      setActivePlan(res.data);
      alert(res.message || 'Study plan applied to Calendar! 📅');
    } catch (err) {
      alert(err.message || 'Failed to apply plan to Calendar');
    } finally {
      setApplyingCalendar(false);
    }
  };

  const handleToggleSessionComplete = async (sessionId) => {
    if (!activePlan) return;
    try {
      const res = await studyPlanService.toggleSessionComplete(activePlan._id, sessionId);
      setActivePlan(res.data);
    } catch (err) {
      alert(err.message || 'Failed to toggle session');
    }
  };

  const handleDeletePlan = async () => {
    if (!activePlan) return;
    if (!window.confirm('Are you sure you want to delete this study plan? Synced calendar sessions will also be removed.')) return;
    try {
      await studyPlanService.deletePlan(activePlan._id);
      const updated = plans.filter((p) => p._id !== activePlan._id);
      setPlans(updated);
      if (updated.length > 0) {
        const next = await studyPlanService.getPlanById(updated[0]._id);
        setActivePlan(next.data);
        navigate(`/study-planner/${updated[0]._id}`);
      } else {
        setActivePlan(null);
        setViewMode('create');
        navigate('/study-planner');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleRegenerate = async () => {
    if (!activePlan) return;
    if (!window.confirm('Regenerate this plan with Gemini AI? Existing session customizations will be updated.')) return;
    try {
      setGenerating(true);
      const res = await studyPlanService.regeneratePlan(activePlan._id, {
        goal: activePlan.goal,
        dailyStudyHours: activePlan.dailyStudyHours,
        preferredStudyTime: activePlan.preferredStudyTime,
        intensity: activePlan.intensity,
      });
      setActivePlan(res.data);
      alert('Plan regenerated with fresh AI insights!');
    } catch (err) {
      alert(err.message || 'Failed to regenerate plan');
    } finally {
      setGenerating(false);
    }
  };

  // Group active plan sessions by date
  const sessionsByDate = {};
  if (activePlan?.sessions) {
    activePlan.sessions.forEach((s) => {
      const d = s.date || 'Scheduled';
      if (!sessionsByDate[d]) sessionsByDate[d] = [];
      sessionsByDate[d].push(s);
    });
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Top Banner */}
      <PageHeader
        badge="Gemini AI Study Engine"
        title="AI-Powered Study Planner"
        description="Transform academic goals into personalized, scientifically structured daily study schedules."
        action={
          plans.length > 0 && (
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {viewMode === 'view' ? (
                <button
                  onClick={() => setViewMode('create')}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> New Study Plan
                </button>
              ) : (
                <button
                  onClick={() => setViewMode('view')}
                  className="btn btn-secondary"
                >
                  View Active Plan
                </button>
              )}
            </div>
          )
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
          Loading AI Study Planner...
        </div>
      ) : viewMode === 'create' ? (
        /* ======================================================================
           WIZARD VIEW: GENERATE AI STUDY PLAN
           ====================================================================== */
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderTop: '6px solid var(--pastel-lavender)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: '2.5rem',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Create Your Personalized AI Study Schedule
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Provide your learning target and constraints. Gemini AI will calculate optimal spaced repetition intervals.
            </p>
          </div>

          <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Step 1: Goal & Target Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                1. What is your primary learning goal? *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Master Linear Algebra Midterm & Score 90%+ on Eigenvalue Proofs"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="input-field"
                style={{ width: '100%', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
              />
            </div>

            {/* Target Exam Date */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Target Exam / Deadline Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Study Window (Start to End Date) *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>to</span>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                    style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Subject & Syllabus Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                2. Select subjects to include in this plan *
              </label>

              {subjects.length === 0 ? (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No enrolled subjects found. Please enroll in a subject under <Link to="/subjects" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>My Subjects</Link> first.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {subjects.map((s) => {
                    const sId = s.id || s._id;
                    const isSelected = formData.selectedSubjects.includes(sId);
                    const subTopics = availableTopicsBySubject[sId] || [];

                    return (
                      <div
                        key={sId}
                        onClick={() => handleSubjectToggle(sId)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                          backgroundColor: isSelected ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                            {s.code || 'SUBJECT'}
                          </span>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--text-muted)'}`,
                              background: isSelected ? 'var(--brand-primary)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                            }}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                          {s.title}
                        </div>

                        {subTopics.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {subTopics.length} syllabus topics ready
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Availability & Preferred Time */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                3. Daily Availability & Intensity
              </h3>

              {/* Hours Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Daily Study Time: <strong style={{ color: 'var(--brand-primary)', fontSize: '1.05rem' }}>{formData.dailyStudyHours} hours/day</strong>
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    (≈ {formData.dailyStudyHours * 60} mins per day)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={formData.dailyStudyHours}
                  onChange={(e) => setFormData({ ...formData, dailyStudyHours: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Preferred Time of Day */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Preferred Time Slot
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {[
                    { id: 'morning', label: '🌅 Morning (08:00)' },
                    { id: 'afternoon', label: '☀️ Afternoon (14:00)' },
                    { id: 'evening', label: '🌆 Evening (18:00)' },
                    { id: 'night', label: '🌙 Night (21:00)' },
                  ].map((slot) => {
                    const active = formData.preferredStudyTime === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredStudyTime: slot.id })}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          fontWeight: active ? 700 : 500,
                          border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                          backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                          color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          boxShadow: active ? 'var(--shadow-xs)' : 'none',
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Plan Intensity
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {[
                    { id: 'relaxed', label: 'Relaxed', desc: 'Shorter blocks with ample review' },
                    { id: 'balanced', label: 'Balanced', desc: 'Optimal spaced repetition & interleaving' },
                    { id: 'intensive', label: 'Intensive', desc: 'Exam cram sprint with deep focus' },
                  ].map((lvl) => {
                    const active = formData.intensity === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, intensity: lvl.id })}
                        style={{
                          padding: '0.55rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'left',
                          border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                          backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: active ? 'var(--brand-primary)' : 'var(--text-main)' }}>
                          {lvl.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {lvl.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={generating || subjects.length === 0}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #5A5FDB 0%, #7E2A6A 100%)',
                  boxShadow: '0 6px 20px rgba(90, 95, 219, 0.35)',
                }}
              >
                <Sparkles size={18} />
                {generating ? 'Synthesizing AI Plan with Gemini...' : 'Generate AI Study Plan'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ======================================================================
           ACTIVE PLAN INSPECTION & TIMELINE VIEW
           ====================================================================== */
        <div>
          {/* Plan Selector Dropdown if multiple plans exist */}
          {plans.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Your Study Plans:
              </span>
              <select
                value={activePlan?._id || ''}
                onChange={(e) => {
                  const pId = e.target.value;
                  const chosen = plans.find((p) => p._id === pId);
                  if (chosen) {
                    studyPlanService.getPlanById(pId).then((r) => setActivePlan(r.data));
                    navigate(`/study-planner/${pId}`);
                  }
                }}
                className="input-field"
                style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
              >
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.summary?.completionRate || 0}% Done)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plan Header Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderTop: '6px solid var(--pastel-lavender)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      background: 'var(--pastel-lavender-subtle)',
                      color: 'var(--brand-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    AI Model: {activePlan?.aiModel}
                  </span>
                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      background: activePlan?.status === 'completed' ? 'var(--status-success-bg)' : 'var(--bg-subtle)',
                      color: activePlan?.status === 'completed' ? 'var(--status-success-text)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {activePlan?.status}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                  {activePlan?.title}
                </h2>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '700px' }}>
                  <strong>Goal:</strong> {activePlan?.goal}
                </p>
              </div>

              {/* Progress Dial & Metrics */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {activePlan?.summary?.completionRate || 0}%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {activePlan?.summary?.completedSessions || 0} / {activePlan?.summary?.totalSessions || 0} Completed
                  </div>
                </div>

                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--pastel-lavender-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={28} color="var(--brand-primary)" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: `${activePlan?.summary?.completionRate || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--pastel-lavender), var(--brand-primary))',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Meta and Calendar Sync Action Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={15} color="var(--brand-primary)" /> {activePlan?.summary?.totalHours || 0} Total Hours
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={15} color="var(--brand-primary)" />
                  {new Date(activePlan?.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(activePlan?.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {activePlan?.appliedToCalendar ? (
                  <Link
                    to="/calendar"
                    className="btn btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--status-success-bg)',
                      color: 'var(--status-success-text)',
                      border: '1px solid var(--status-success-border)',
                      padding: '0.5rem 1rem',
                    }}
                  >
                    <CheckCircle2 size={16} /> Synced to Calendar (View)
                  </Link>
                ) : (
                  <button
                    onClick={handleApplyToCalendar}
                    disabled={applyingCalendar}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      padding: '0.5rem 1.15rem',
                    }}
                  >
                    <Calendar size={16} />
                    {applyingCalendar ? 'Applying...' : 'Apply to Calendar'}
                  </button>
                )}

                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="btn btn-ghost"
                  style={{
                    border: '1px solid var(--border-light)',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                  }}
                  title="Regenerate Plan with Gemini AI"
                >
                  <RefreshCw size={16} />
                </button>

                <button
                  onClick={handleDeletePlan}
                  className="btn btn-ghost"
                  style={{
                    border: '1px solid var(--border-light)',
                    padding: '0.5rem',
                    color: 'var(--status-error-text)',
                  }}
                  title="Delete Plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Sessions Day-by-Day Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {Object.keys(sessionsByDate).map((dateKey) => {
              const daySessions = sessionsByDate[dateKey];
              const dateObj = new Date(dateKey);
              const formattedDateHeader = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : dateKey;

              return (
                <div key={dateKey}>
                  {/* Date Heading */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--pastel-lavender-subtle)',
                        color: 'var(--brand-primary)',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                      }}
                    >
                      {formattedDateHeader}
                    </div>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-subtle)' }} />
                  </div>

                  {/* Sessions Grid for this day */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {daySessions.map((session) => (
                      <div
                        key={session._id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderLeft: `5px solid ${session.color || '#FFD6FF'}`,
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-xs)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.85rem',
                          opacity: session.isCompleted ? 0.7 : 1,
                          transition: 'var(--transition-fast)',
                        }}
                      >
                        <div>
                          {/* Top row: Checkbox + Title */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleSessionComplete(session._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '2px',
                                color: session.isCompleted ? 'var(--status-success-text)' : 'var(--text-muted)',
                              }}
                              title={session.isCompleted ? 'Mark as active' : 'Mark completed'}
                            >
                              {session.isCompleted ? (
                                <CheckCircle2 size={22} color="#0D7A4D" fill="#E8F7F0" />
                              ) : (
                                <Square size={22} />
                              )}
                            </button>

                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: 700,
                                  color: session.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                                  textDecoration: session.isCompleted ? 'line-through' : 'none',
                                  lineHeight: 1.35,
                                  marginBottom: '0.25rem',
                                }}
                              >
                                {session.title}
                              </h4>

                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--brand-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={12} />
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>• {session.duration}m</span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {session.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                              {session.description}
                            </p>
                          )}

                          {/* Subject & Topic Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            {session.subject && (
                              <span
                                style={{
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-subtle)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <BookOpen size={11} /> {session.subject.code || session.subject.title}
                              </span>
                            )}

                            {session.topic && (
                              <span
                                style={{
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {session.topic.title}
                              </span>
                            )}
                          </div>

                          {/* AI Recommendation Strategy */}
                          {session.recommendations && (
                            <div
                              style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--pastel-sky-subtle)',
                                border: '1px solid rgba(187, 208, 255, 0.5)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                color: '#1E3A8A',
                              }}
                            >
                              <Lightbulb size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{session.recommendations}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudyPlanner;
