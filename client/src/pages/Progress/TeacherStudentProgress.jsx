import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  BookOpen,
  ChevronRight,
  TrendingUp,
  X,
  Layers,
  FileText,
} from 'lucide-react';
import progressService from '../../services/progressService';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

const STATUS_CONFIG = {
  on_track: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', label: 'On Track' },
  in_progress: { bg: 'var(--pastel-sky-subtle)', border: '#BBD0FF', text: '#1E4D8A', label: 'In Progress' },
  needs_support: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', label: 'Needs Support' },
};

const TeacherStudentProgress = () => {
  const [cohortData, setCohortData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchCohortProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const subjParam = selectedSubject !== 'all' ? selectedSubject : null;
        const res = await progressService.getTeacherCohortProgress(subjParam);
        if (res.success && res.data) {
          setCohortData(res.data);
        } else {
          setError('Failed to load cohort analytics.');
        }
      } catch (err) {
        console.error('Error fetching teacher cohort progress:', err);
        setError(err.response?.data?.message || 'Could not retrieve cohort data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCohortProgress();
  }, [selectedSubject]);

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
          Aggregating Cohort Learning Analytics...
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Querying enrolled student study logs, topic completions, and quiz performance
        </p>
      </div>
    );
  }

  if (error || !cohortData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Unable to Load Cohort Data
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {error || 'Could not load student progress for your courses.'}
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

  const { cohortSummary, assignedSubjects = [], students = [] } = cohortData;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ width: '100%', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <PageHeader
        badge="Faculty Oversight"
        title="Student Cohort Progress & Analytics"
        description="Empirical tracking of syllabus completion, study session hours, and practice quiz scores for students enrolled in your assigned subjects."
      />

      {/* Cohort Summary Metrics Row */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          icon={Users}
          value={cohortSummary.totalStudents}
          label="Enrolled Students"
          sublabel={`Across ${cohortSummary.totalAssignedSubjects} assigned courses`}
          accent="sky"
        />
        <StatCard
          icon={BookOpen}
          value={`${cohortSummary.averageTopicCompletion}%`}
          label="Avg Syllabus Progress"
          sublabel="Topics marked complete by cohort"
          accent="lavender"
        />
        <StatCard
          icon={Clock}
          value={`${cohortSummary.totalStudyHoursLogged}h`}
          label="Total Study Hours"
          sublabel="Completed by students in your subjects"
          accent="pink"
        />
        <StatCard
          icon={Award}
          value={cohortSummary.averageQuizScore > 0 ? `${cohortSummary.averageQuizScore}%` : 'N/A'}
          label="Avg Quiz Score"
          sublabel="Practice quiz accuracy average"
          accent="mauve"
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'white',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search student by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Subject Selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="form-control"
            style={{ minWidth: '200px', fontSize: '0.85rem' }}
          >
            <option value="all">All Assigned Subjects ({assignedSubjects.length})</option>
            {assignedSubjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title} ({s.code || 'COURSE'})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          {['all', 'on_track', 'in_progress', 'needs_support'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? 'white' : 'transparent',
                color: statusFilter === st ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: statusFilter === st ? 'var(--shadow-sm)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Student Progress Roster Table */}
      {filteredStudents.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Users size={36} color="var(--brand-primary)" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            No Students Matching Current Filter
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Try clearing your search query or selecting another course.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Student
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Topic Progress
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Study Hours
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Quizzes
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Assignments
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const statusConf = STATUS_CONFIG[s.status] || STATUS_CONFIG.in_progress;

                  return (
                    <tr
                      key={s._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-sunken)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Student Profile */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--pastel-lavender)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#342852',
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)' }}>
                              {s.name}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {s.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Topic Completion Progress Bar */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ width: '130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.topicCompletionRate}%</span>
                            <span style={{ color: 'var(--text-muted)' }}>{s.completedTopics}/{s.totalTopics}</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', background: 'var(--surface-sunken)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${s.topicCompletionRate}%`,
                                background: 'var(--brand-primary)',
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Study Hours */}
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.studyHours}h
                      </td>

                      {/* Quizzes */}
                      <td style={{ padding: '1rem' }}>
                        {s.quizAttemptsCount > 0 ? (
                          <div>
                            <span style={{ fontWeight: 700, color: s.averageQuizScore >= 70 ? '#10B981' : '#E11D48' }}>
                              {s.averageQuizScore}%
                            </span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {s.quizAttemptsCount} attempts
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None yet</span>
                        )}
                      </td>

                      {/* Assignments */}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {s.assignmentsSubmitted} / {s.totalAssignments}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: statusConf.bg,
                            border: `1px solid ${statusConf.border}`,
                            color: statusConf.text,
                            display: 'inline-block',
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Inspect Action */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Student Inspector Modal */}
      {selectedStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              background: 'white',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--pastel-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#342852',
                  fontSize: '1.1rem',
                }}
              >
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                  {selectedStudent.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStudent.email}</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                padding: '1.25rem',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Topic Progress
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedStudent.completedTopics}/{selectedStudent.totalTopics} ({selectedStudent.topicCompletionRate}%)
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Study Sessions
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedStudent.studyHours}h ({selectedStudent.sessionsCount} sessions)
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Quiz Average
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedStudent.averageQuizScore >= 70 ? '#10B981' : '#E11D48' }}>
                  {selectedStudent.averageQuizScore !== null ? `${selectedStudent.averageQuizScore}%` : 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Assignments Done
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedStudent.assignmentsSubmitted}/{selectedStudent.totalAssignments}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentProgress;
