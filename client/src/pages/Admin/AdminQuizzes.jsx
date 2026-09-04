import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { subjectService } from '../../services/subjectService';
import { PageHeader } from '../../components/UI';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Shield,
  X,
  Clock,
  Target,
  Users,
} from 'lucide-react';

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Inspect questions modal
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [inspectingQuiz, setInspectingQuiz] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [quizRes, subjRes] = await Promise.all([
        adminService.getQuizzes({
          search: searchTerm,
          subjectId: selectedSubject || undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        }),
        subjectService.getSubjects(true),
      ]);

      if (quizRes.success) {
        setQuizzes(quizRes.quizzes || []);
      }
      if (subjRes.success) {
        setSubjects(subjRes.subjects || []);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      setBannerMessage({ text: 'Could not load quiz assessments.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSubject, selectedDifficulty]);

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Permanently delete quiz "${quiz.title}" and all its student attempts?`)) {
      return;
    }

    try {
      await adminService.deleteQuiz(quiz.id);
      setBannerMessage({ text: `Quiz "${quiz.title}" removed.`, type: 'success' });
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const handleOpenQuestions = (quiz) => {
    setInspectingQuiz(quiz);
    setShowQuestionsModal(true);
  };

  const totalQuestionsCount = quizzes.reduce((sum, q) => sum + (q.questionCount || 0), 0);
  const totalAttemptsCount = quizzes.reduce((sum, q) => sum + (q.attemptsCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Quiz & Assessment Management"
        subtitle="Inspect AI-generated and educator assessments, audit questions, monitor average scores, and delete stale tests."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              Assessment Repository
            </span>
          </div>
        }
      />

      {bannerMessage.text && (
        <div className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
          {bannerMessage.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card card-pastel-sky" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Quizzes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {quizzes.length} Quizzes
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Published across curricula
          </div>
        </div>

        <div className="card card-pastel-lavender" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Questions Bank</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {totalQuestionsCount} Questions
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            AI & instructor generated
          </div>
        </div>

        <div className="card card-pastel-pink" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Student Attempts</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {totalAttemptsCount} Attempts
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Completed evaluations
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Search quizzes by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Subject Filter */}
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Quizzes Table */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <HelpCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No quizzes found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Try adjusting your search criteria or subject filters.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Quiz Title</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Course Subject</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Difficulty</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Questions</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Attempts & Avg Score</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr
                    key={q.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--pastel-sky-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <HelpCircle size={15} color="var(--brand-primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {q.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            By {q.creator?.name || 'Instructor'} ({q.creatorRole})
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      {q.subject ? (
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-light)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: q.subject.color || '#BBD0FF' }} />
                          {q.subject.title}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                          backgroundColor:
                            q.difficulty === 'easy'
                              ? 'var(--pastel-sky-subtle)'
                              : q.difficulty === 'hard'
                              ? 'var(--pastel-pink-subtle)'
                              : 'var(--pastel-lavender-subtle)',
                        }}
                      >
                        {q.difficulty}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {q.questionCount} Questions
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 600 }}>{q.attemptsCount} Attempts</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Avg Score: {q.averageScore ? `${Math.round(q.averageScore)}%` : 'No attempts'}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenQuestions(q)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                          title="Inspect Questions & Answers"
                        >
                          <Eye size={13} /> Questions
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(q)}
                          className="btn btn-ghost"
                          style={{ padding: '0.35rem 0.6rem', color: 'var(--status-error-text)' }}
                          title="Delete Quiz"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Questions Modal */}
      {showQuestionsModal && inspectingQuiz && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
              maxWidth: '720px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Questions Audit: {inspectingQuiz.title}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {inspectingQuiz.questionCount} Questions • Passing: {inspectingQuiz.passingScore}%
                </p>
              </div>

              <button onClick={() => setShowQuestionsModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inspectingQuiz.questions?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No individual questions stored in this quiz record.</p>
              ) : (
                inspectingQuiz.questions?.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Q{idx + 1}. {q.questionText}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswerIndex;
                        return (
                          <div
                            key={optIdx}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.82rem',
                              backgroundColor: isCorrect ? 'var(--status-success-bg)' : 'var(--bg-surface)',
                              color: isCorrect ? 'var(--status-success-text)' : 'var(--text-secondary)',
                              border: `1px solid ${isCorrect ? 'var(--status-success-border)' : 'var(--border-light)'}`,
                              fontWeight: isCorrect ? 700 : 500,
                            }}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt} {isCorrect ? '✓ (Correct)' : ''}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.4rem' }}>
                        💡 Explanation: {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowQuestionsModal(false)} className="btn btn-secondary">
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizzes;
