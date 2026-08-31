import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Tag,
  CheckCircle2,
  Square,
  Trash2,
  Save,
  Flame,
  Layers,
  AlertCircle,
} from 'lucide-react';
import taskService from '../../services/taskService';
import subjectService from '../../services/subjectService';

const PASTEL_COLORS = [
  { hex: '#B8C0FF', name: 'Periwinkle' },
  { hex: '#FFD6FF', name: 'Pink' },
  { hex: '#E7C6FF', name: 'Mauve' },
  { hex: '#C8B6FF', name: 'Lavender' },
  { hex: '#BBD0FF', name: 'Sky Blue' },
];

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const isNew = !taskId || taskId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedDuration: 30,
    isCompleted: false,
    color: '#B8C0FF',
    tags: '',
  });

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const subjRes = await subjectService.getSubjects();
      const subList = subjRes.subjects || subjRes.data || [];
      setSubjects(subList);

      if (!isNew) {
        const res = await taskService.getTaskById(taskId);
        const task = res.data;
        const formattedDueDate = task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 16)
          : '';

        setFormData({
          title: task.title,
          description: task.description || '',
          subject: task.subject?._id || task.subject || '',
          topic: task.topic?._id || task.topic || '',
          priority: task.priority || 'medium',
          status: task.status || 'todo',
          dueDate: formattedDueDate,
          estimatedDuration: task.estimatedDuration || 30,
          isCompleted: Boolean(task.isCompleted),
          color: task.color || '#B8C0FF',
          tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
          assignment: task.assignment,
        });

        if (task.subject?._id || task.subject) {
          const sId = task.subject?._id || task.subject;
          const topicRes = await subjectService.getTopics(sId);
          setAvailableTopics(topicRes.topics || topicRes.data || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = async (subjId) => {
    setFormData((prev) => ({ ...prev, subject: subjId, topic: '' }));
    if (!subjId) {
      setAvailableTopics([]);
      return;
    }
    try {
      const res = await subjectService.getTopics(subjId);
      setAvailableTopics(res.topics || res.data || []);
    } catch {
      setAvailableTopics([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (isNew) {
        await taskService.createTask(payload);
      } else {
        await taskService.updateTask(taskId, payload);
      }
      navigate('/tasks');
    } catch (err) {
      alert(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (isNew) return;
    try {
      const res = await taskService.toggleComplete(taskId);
      setFormData((prev) => ({
        ...prev,
        isCompleted: res.data.isCompleted,
        status: res.data.status,
      }));
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      navigate('/tasks');
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        Loading task details...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '840px', margin: '0 auto' }}>
      {/* Back Button */}
      <Link
        to="/tasks"
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
        <ArrowLeft size={16} /> Back to Tasks
      </Link>

      {/* Main Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderTop: `6px solid ${formData.color || '#B8C0FF'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '2rem',
        }}
      >
        {/* Header Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isNew && (
              <button
                type="button"
                onClick={handleToggleComplete}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: formData.isCompleted ? 'var(--status-success-text)' : 'var(--text-secondary)',
                }}
              >
                {formData.isCompleted ? (
                  <>
                    <CheckCircle2 size={24} color="#0D7A4D" fill="#E8F7F0" /> Completed
                  </>
                ) : (
                  <>
                    <Square size={24} /> Mark Complete
                  </>
                )}
              </button>
            )}
            {isNew && (
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Create New Task
              </h2>
            )}
          </div>

          {!isNew && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-ghost"
                style={{ color: 'var(--status-error-text)', fontSize: '0.85rem' }}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Linked Assignment Banner if applicable */}
        {formData.assignment && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--pastel-mauve-subtle)',
              border: '1px solid var(--pastel-mauve)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.88rem',
            }}
          >
            <Layers size={18} color="var(--brand-primary)" />
            <span>
              This task is linked to course assignment: <strong>{formData.assignment.title}</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Eigenvectors and Orthogonal Projections"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              style={{ width: '100%', fontSize: '1.05rem', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Task Notes & Objectives
            </label>
            <textarea
              rows={4}
              placeholder="Add detailed bullet points, reminders, steps, or reading pages..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
            />
          </div>

          {/* Subject & Topic */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="input-field"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              >
                <option value="">None / General</option>
                {subjects.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.code ? `${s.code} - ` : ''}{s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Topic
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="input-field"
                disabled={!formData.subject || availableTopics.length === 0}
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              >
                <option value="">None / Overall</option>
                {availableTopics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority, Duration & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                className="input-field"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>

          {/* Color & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Card Accent Color
              </label>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                {PASTEL_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: col.hex })}
                    title={col.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: col.hex,
                      border: formData.color === col.hex ? '3px solid var(--brand-primary)' : '2px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transform: formData.color === col.hex ? 'scale(1.15)' : 'scale(1)',
                      transition: 'var(--transition-fast)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="homework, exam, math"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input-field"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="btn btn-ghost"
              style={{ padding: '0.6rem 1.25rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.5rem',
                fontWeight: 700,
              }}
            >
              <Save size={16} /> {saving ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetails;
