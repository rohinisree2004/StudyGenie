import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  Award,
  Users,
  MessageSquare,
  Edit3,
  X,
  Plus,
} from 'lucide-react';
import assignmentService from '../../services/assignmentService';
import taskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';

const AssignmentDetails = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Submission State
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  // Teacher Grading Modal State
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingTarget, setGradingTarget] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getAssignmentById(assignmentId);
      setAssignment(res.data);
      if (res.data.mySubmission) {
        setSubmissionText(res.data.mySubmission.submissionText || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await assignmentService.submitAssignment(assignmentId, { submissionText });
      await fetchAssignment();
      setIsEditingSubmission(false);
      alert('Assignment successfully submitted!');
    } catch (err) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTaskFromAssignment = async () => {
    try {
      await taskService.createTask({
        title: `Work on: ${assignment.title}`,
        description: `Assignment deadline: ${new Date(assignment.dueDate).toLocaleDateString()}.\nInstructions: ${assignment.instructions || assignment.description}`,
        subject: assignment.subject?._id || assignment.subject,
        topic: assignment.topic?._id || assignment.topic,
        assignment: assignment._id,
        dueDate: assignment.dueDate,
        priority: 'high',
        estimatedDuration: 60,
      });
      alert('Task added to your Tasks list!');
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const openGradingModal = (entry) => {
    setGradingTarget(entry);
    setGradeInput(entry.grade !== null && entry.grade !== undefined ? entry.grade : '');
    setFeedbackInput(entry.feedback || '');
    setGradingModalOpen(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingTarget) return;

    try {
      setSavingGrade(true);
      await assignmentService.gradeSubmission(assignmentId, {
        studentId: gradingTarget.student._id,
        grade: Number(gradeInput),
        feedback: feedbackInput,
      });
      setGradingModalOpen(false);
      fetchAssignment();
    } catch (err) {
      alert(err.message || 'Failed to grade submission');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        Loading assignment...
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error-text)', marginBottom: '1rem' }}>{error || 'Assignment not found'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link
        to={isTeacherOrAdmin ? '/teacher/assignments' : '/calendar'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={16} /> {isTeacherOrAdmin ? 'Back to Course Assignments' : 'Back to Calendar'}
      </Link>

      {/* Assignment Header Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderTop: '6px solid var(--pastel-mauve)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--pastel-mauve-subtle)',
                  color: 'var(--brand-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BookOpen size={12} />
                {assignment.subject?.code || assignment.subject?.title}
              </span>

              {assignment.topic && (
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {assignment.topic.title}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              {assignment.title}
            </h1>

            {assignment.description && (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {assignment.description}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--brand-primary)',
                background: 'var(--brand-primary-light)',
                padding: '0.4rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                marginBottom: '0.4rem',
              }}
            >
              {assignment.totalPoints} Points
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: isPastDue ? 'var(--status-error-text)' : 'var(--text-secondary)' }}>
              <Calendar size={13} />
              <span>
                Due: {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Block */}
        {assignment.instructions && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="var(--brand-primary)" /> Instructions & Requirements
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {assignment.instructions}
            </div>
          </div>
        )}

        {/* Student Quick Action: Convert to personal task */}
        {!isTeacherOrAdmin && (
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCreateTaskFromAssignment}
              className="btn btn-ghost"
              style={{
                fontSize: '0.85rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Plus size={15} /> Add as Personal Task
            </button>
          </div>
        )}
      </div>

      {/* STUDENT PERSPECTIVE: Submission Workspace */}
      {!isTeacherOrAdmin && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Your Submission
            </h2>

            {assignment.isCompleted && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--status-success-bg)',
                  color: 'var(--status-success-text)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={16} /> Completed & Handed In
              </span>
            )}
          </div>

          {/* Graded Feedback Card if present */}
          {assignment.mySubmission?.grade !== null && assignment.mySubmission?.grade !== undefined && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--pastel-lavender-subtle)',
                border: '1px solid var(--pastel-lavender)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={20} color="var(--brand-primary)" />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  Grade: {assignment.mySubmission.grade} / {assignment.totalPoints}
                </span>
              </div>
              {assignment.mySubmission.feedback && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  <strong>Instructor Feedback:</strong> "{assignment.mySubmission.feedback}"
                </p>
              )}
            </div>
          )}

          {/* Submission Form / View */}
          {assignment.isCompleted && !isEditingSubmission ? (
            <div>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                }}
              >
                {assignment.mySubmission?.submissionText || 'No text note provided.'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>
                  Submitted at: {new Date(assignment.mySubmission.submittedAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingSubmission(true)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.82rem', color: 'var(--brand-primary)' }}
                >
                  <Edit3 size={14} /> Update Submission
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Your Work & Notes *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste solution proofs, step-by-step calculations, summary notes, or links to your work..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {isEditingSubmission && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSubmission(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 700,
                  }}
                >
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit & Mark Complete'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TEACHER PERSPECTIVE: Enrolled Student Completion Roster */}
      {isTeacherOrAdmin && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Student Completion Roster
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Review individual student status, inspect submitted work, and assign grades.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  background: 'var(--pastel-lavender-subtle)',
                  color: 'var(--brand-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                {assignment.stats?.submittedCount || 0} / {assignment.stats?.totalEnrolled || 0} Submissions
              </span>
            </div>
          </div>

          {/* Roster Table */}
          {(!assignment.roster || assignment.roster.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p>No students enrolled in this subject yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Student</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Submitted At</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Grade</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.roster.map((entry) => {
                    const isDone = entry.status === 'completed' || entry.status === 'graded';
                    return (
                      <tr
                        key={entry.student._id}
                        style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}
                      >
                        {/* Student info */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {entry.student.avatar ? (
                              <img
                                src={entry.student.avatar}
                                alt={entry.student.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'var(--pastel-sky)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  color: '#1E40AF',
                                }}
                              >
                                {entry.student.name?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{entry.student.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.student.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor:
                                entry.status === 'graded'
                                  ? 'var(--brand-primary-light)'
                                  : entry.status === 'completed'
                                  ? 'var(--status-success-bg)'
                                  : 'var(--bg-subtle)',
                              color:
                                entry.status === 'graded'
                                  ? 'var(--brand-primary)'
                                  : entry.status === 'completed'
                                  ? 'var(--status-success-text)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {entry.status}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {entry.submittedAt
                            ? new Date(entry.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>

                        {/* Grade */}
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>
                          {entry.grade !== null && entry.grade !== undefined ? (
                            <span style={{ color: 'var(--brand-primary)' }}>
                              {entry.grade} / {assignment.totalPoints}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => openGradingModal(entry)}
                            className="btn btn-ghost"
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: 'var(--brand-primary)',
                              padding: '0.35rem 0.75rem',
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            {entry.grade !== null && entry.grade !== undefined ? 'Edit Grade' : 'Review & Grade'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grading Modal */}
      {gradingModalOpen && gradingTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(30, 37, 56, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Grade: {gradingTarget.student.name}
              </h3>
              <button onClick={() => setGradingModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                <X size={20} />
              </button>
            </div>

            {/* Student's submission content preview */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                STUDENT'S SUBMISSION TEXT:
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {gradingTarget.submissionText || 'No written response provided.'}
              </div>
            </div>

            <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Score (out of {assignment.totalPoints}) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={assignment.totalPoints}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Feedback for Student
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback, praise, or areas for improvement..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setGradingModalOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={savingGrade} className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {savingGrade ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetails;
