import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  Tag,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  BookOpen,
  ArrowRight,
  Flame,
  ListTodo,
} from 'lucide-react';
import taskService from '../../services/taskService';
import subjectService from '../../services/subjectService';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

const PASTEL_COLORS = [
  { hex: '#B8C0FF', name: 'Periwinkle' },
  { hex: '#FFD6FF', name: 'Pink' },
  { hex: '#E7C6FF', name: 'Mauve' },
  { hex: '#C8B6FF', name: 'Lavender' },
  { hex: '#BBD0FF', name: 'Sky Blue' },
];

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedDuration: 30,
    color: '#B8C0FF',
    tags: '',
  });

  const [availableTopics, setAvailableTopics] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, subjectFilter, sortBy]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsRes] = await Promise.all([
        subjectService.getSubjects(),
        fetchTasks(),
      ]);
      const subList = subjectsRes.subjects || subjectsRes.data || [];
      setSubjects(subList);
    } catch (err) {
      setError(err.message || 'Failed to load task resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {
        sort: sortBy,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (subjectFilter !== 'all') params.subject = subjectFilter;
      if (search.trim()) params.search = search.trim();

      const res = await taskService.getTasks(params);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleToggleComplete = async (taskId, e) => {
    e.stopPropagation();
    try {
      const res = await taskService.toggleComplete(taskId);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to toggle task');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingTaskId(null);
    setFormData({
      title: '',
      description: '',
      subject: subjects.length > 0 ? subjects[0].id || subjects[0]._id : '',
      topic: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      estimatedDuration: 30,
      color: '#B8C0FF',
      tags: '',
    });
    setAvailableTopics([]);
    setIsModalOpen(true);
  };

  const openEditModal = (task, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingTaskId(task._id);

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
      color: task.color || '#B8C0FF',
      tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
    });

    // If subject exists, load topics
    if (task.subject?._id || task.subject) {
      const subjId = task.subject?._id || task.subject;
      subjectService.getTopics(subjId).then((res) => {
        setAvailableTopics(res.topics || res.data || []);
      }).catch(() => {});
    }

    setIsModalOpen(true);
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (modalMode === 'create') {
        const res = await taskService.createTask(payload);
        setTasks((prev) => [res.data, ...prev]);
      } else {
        const res = await taskService.updateTask(editingTaskId, payload);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTaskId ? res.data : t))
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const highPriorityCount = tasks.filter(
    (t) => (t.priority === 'high' || t.priority === 'urgent') && !t.isCompleted
  ).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: '#FDE8E8',
              color: '#9B1C1C',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Flame size={12} /> Urgent
          </span>
        );
      case 'high':
        return (
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'var(--pastel-pink-subtle)',
              color: '#7E2A6A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            High
          </span>
        );
      case 'medium':
        return (
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: 'var(--pastel-periwinkle-subtle)',
              color: '#343B80',
            }}
          >
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: 'var(--pastel-sky-subtle)',
              color: '#264B7A',
            }}
          >
            Low
          </span>
        );
    }
  };

  const isOverdue = (dueDate, isCompleted) => {
    if (!dueDate || isCompleted) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header & Metrics */}
      <PageHeader
        badge="Academic Task Board"
        title="Tasks & To-Dos"
        description="Organize personal study tasks, track academic deadlines, and maintain learning momentum."
        action={
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={18} /> New Task
          </button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          icon={ListTodo}
          value={totalCount}
          label="Total Tasks"
          accent="periwinkle"
        />
        <StatCard
          icon={Clock}
          value={pendingCount}
          label="Active / In Progress"
          accent="sky"
        />
        <StatCard
          icon={CheckCircle2}
          value={completedCount}
          label="Completed"
          accent="lavender"
        />
        <StatCard
          icon={AlertCircle}
          value={highPriorityCount}
          label="Urgent / High Priority"
          accent="pink"
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search tasks by title, details, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                paddingLeft: '2.4rem',
                paddingRight: '1rem',
                fontSize: '0.88rem',
                height: '40px',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </form>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input-field"
            style={{
              flex: '0 1 180px',
              height: '40px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.code ? `${s.code}: ` : ''}{s.title}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field"
            style={{
              flex: '0 1 150px',
              height: '40px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
            style={{
              flex: '0 1 160px',
              height: '40px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>

        {/* Status Pill Filter Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            overflowX: 'auto',
          }}
        >
          {['all', 'todo', 'in_progress', 'completed'].map((status) => {
            const labelMap = {
              all: 'All Statuses',
              todo: 'To Do',
              in_progress: 'In Progress',
              completed: 'Completed',
            };
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: active ? 700 : 500,
                  border: '1px solid',
                  borderColor: active ? 'var(--brand-primary)' : 'var(--border-light)',
                  backgroundColor: active ? 'var(--brand-primary-light)' : 'transparent',
                  color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {labelMap[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List / Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'var(--pastel-lavender-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <CheckSquare size={30} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No tasks found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks match your current filter criteria. Try resetting your search or filters.'
              : 'You have no tasks on your list yet. Create your first task to start organizing your study goals!'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.isCompleted);
            return (
              <div
                key={task._id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderLeft: `5px solid ${task.color || '#B8C0FF'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'var(--transition-normal)',
                  opacity: task.isCompleted ? 0.7 : 1,
                }}
              >
                {/* Left side: Checkbox + Content */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                  <button
                    type="button"
                    onClick={(e) => handleToggleComplete(task._id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: task.isCompleted ? 'var(--status-success-text)' : 'var(--text-muted)',
                      padding: 0,
                      marginTop: '2px',
                    }}
                    title={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 size={22} color="#0D7A4D" fill="#E8F7F0" />
                    ) : (
                      <Square size={22} />
                    )}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Link
                        to={`/tasks/${task._id}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: task.isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </Link>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.description && (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.6rem',
                          lineHeight: 1.45,
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Meta tags bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      {task.subject && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <BookOpen size={12} />
                          {task.subject.code || task.subject.title}
                        </span>
                      )}

                      {task.topic && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {task.topic.title}
                        </span>
                      )}

                      {task.dueDate && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: overdue ? '#FEE2E2' : 'var(--bg-subtle)',
                            color: overdue ? '#991B1B' : 'var(--text-secondary)',
                            fontWeight: overdue ? 700 : 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}

                      {task.estimatedDuration && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={12} />
                          {task.estimatedDuration}m
                        </span>
                      )}

                      {task.tags?.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--pastel-lavender-subtle)',
                            color: 'var(--brand-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={(e) => openEditModal(task, e)}
                    className="btn btn-ghost"
                    style={{ padding: '0.45rem', color: 'var(--text-muted)' }}
                    title="Edit Task"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteTask(task._id, e)}
                    className="btn btn-ghost"
                    style={{ padding: '0.45rem', color: 'var(--status-error-text)' }}
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>

                  <Link
                    to={`/tasks/${task._id}`}
                    className="btn btn-ghost"
                    style={{ padding: '0.45rem', color: 'var(--brand-primary)' }}
                    title="View Details"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {modalMode === 'create' ? 'Create New Task' : 'Edit Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost"
                style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Linear Algebra Chapter 3 & solve practice problems"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add context, theorems to review, or key checklist items..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
                />
              </div>

              {/* Subject & Cascading Topic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Subject (Optional)
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Topic (Optional)
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

              {/* Priority & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
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
              </div>

              {/* Estimated Duration & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Estimated Duration (mins)
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Pastel Accent Color Swatches */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
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

              {/* Tags */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="math, homework, exam-prep"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ padding: '0.55rem 1.15rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.35rem', fontWeight: 700 }}
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Task' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
