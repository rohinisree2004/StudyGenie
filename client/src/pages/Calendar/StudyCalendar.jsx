import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  BookOpen,
  CheckSquare,
  Square,
  Layers,
  CheckCircle2,
  X,
  Trash2,
  ExternalLink,
  Flame,
  Filter,
} from 'lucide-react';
import calendarService from '../../services/calendarService';
import studySessionService from '../../services/studySessionService';
import taskService from '../../services/taskService';
import subjectService from '../../services/subjectService';
import PageHeader from '../../components/UI/PageHeader';

const PASTEL_COLORS = [
  { hex: '#FFD6FF', name: 'Pink' },
  { hex: '#E7C6FF', name: 'Mauve' },
  { hex: '#C8B6FF', name: 'Lavender' },
  { hex: '#B8C0FF', name: 'Periwinkle' },
  { hex: '#BBD0FF', name: 'Sky Blue' },
];

const StudyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showTasks, setShowTasks] = useState(true);
  const [showAssignments, setShowAssignments] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Session Form
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    startTime: '',
    endTime: '',
    color: '#FFD6FF',
    notes: '',
  });

  // Task Form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium',
    dueDate: '',
    estimatedDuration: 30,
    color: '#B8C0FF',
  });

  const [availableTopics, setAvailableTopics] = useState([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode, showTasks, showAssignments, showSessions, subjectFilter]);

  const fetchSubjects = async () => {
    try {
      const res = await subjectService.getSubjects();
      const list = res.subjects || res.data || [];
      setSubjects(list);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const getDateRangeForView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      const start = new Date(year, month, 1);
      start.setDate(start.getDate() - 7); // include previous padding
      const end = new Date(year, month + 1, 0);
      end.setDate(end.getDate() + 14); // include next padding
      return { start, end };
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      // Day view
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRangeForView();

      const types = [];
      if (showTasks) types.push('tasks');
      if (showAssignments) types.push('assignments');
      if (showSessions) types.push('study_sessions');

      if (types.length === 0) {
        setEvents([]);
        return;
      }

      const params = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        types: types.join(','),
      };
      if (subjectFilter !== 'all') params.subject = subjectFilter;

      const res = await calendarService.getCalendarEvents(params);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderTitle = () => {
    const options = { month: 'long', year: 'numeric' };
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(undefined, options);
    } else if (viewMode === 'week') {
      const { start, end } = getDateRangeForView();
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Quick Open Add Modals with pre-filled date
  const openScheduleSessionModal = (targetDate = null) => {
    const d = targetDate ? new Date(targetDate) : new Date();
    d.setMinutes(0, 0, 0);
    const startStr = d.toISOString().slice(0, 16);
    const end = new Date(d.getTime() + 60 * 60 * 1000);
    const endStr = end.toISOString().slice(0, 16);

    setSessionForm({
      title: '',
      description: '',
      subject: subjects.length > 0 ? subjects[0].id || subjects[0]._id : '',
      topic: '',
      startTime: startStr,
      endTime: endStr,
      color: '#FFD6FF',
      notes: '',
    });
    setAvailableTopics([]);
    setIsSessionModalOpen(true);
  };

  const openAddTaskModal = (targetDate = null) => {
    const d = targetDate ? new Date(targetDate) : new Date();
    d.setHours(18, 0, 0, 0);
    const dueStr = d.toISOString().slice(0, 16);

    setTaskForm({
      title: '',
      description: '',
      subject: subjects.length > 0 ? subjects[0].id || subjects[0]._id : '',
      priority: 'medium',
      dueDate: dueStr,
      estimatedDuration: 30,
      color: '#B8C0FF',
    });
    setIsTaskModalOpen(true);
  };

  const handleSessionSubjectChange = async (subjId) => {
    setSessionForm((prev) => ({ ...prev, subject: subjId, topic: '' }));
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

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.title.trim()) return alert('Please enter a session title');
    if (!sessionForm.subject) return alert('Please select a subject');

    try {
      await studySessionService.createStudySession(sessionForm);
      setIsSessionModalOpen(false);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to schedule session');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return alert('Please enter a task title');

    try {
      await taskService.createTask(taskForm);
      setIsTaskModalOpen(false);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleToggleEventComplete = async (event) => {
    try {
      if (event.type === 'task') {
        await taskService.toggleComplete(event.originalId);
      } else if (event.type === 'study_session') {
        await studySessionService.completeStudySession(event.originalId);
      }
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Are you sure you want to delete this ${event.type.replace('_', ' ')}?`)) return;
    try {
      if (event.type === 'task') {
        await taskService.deleteTask(event.originalId);
      } else if (event.type === 'study_session') {
        await studySessionService.deleteStudySession(event.originalId);
      }
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Calendar Day Cell Matrix generation for Month View
  const renderMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding days to fill 35 or 42 grid slots
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= (remainingSlots >= 7 ? remainingSlots - 7 : remainingSlots); i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    const todayStr = new Date().toDateString();

    return days.map(({ date, isCurrentMonth }, idx) => {
      const dateStr = date.toDateString();
      const isToday = dateStr === todayStr;

      // Filter events that fall on this day
      const dayEvents = events.filter((e) => {
        const eDate = new Date(e.start).toDateString();
        return eDate === dateStr;
      });

      return (
        <div
          key={idx}
          onClick={() => openScheduleSessionModal(date)}
          style={{
            minHeight: '110px',
            background: isCurrentMonth ? 'var(--bg-surface)' : 'rgba(243, 245, 250, 0.5)',
            borderRight: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0.45rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          className="calendar-day-cell"
        >
          {/* Day Number Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: '0.78rem',
                fontWeight: isToday ? 800 : isCurrentMonth ? 600 : 400,
                color: isToday ? '#FFFFFF' : isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: isToday ? 'var(--brand-primary)' : 'transparent',
              }}
            >
              {date.getDate()}
            </span>

            {dayEvents.length > 0 && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {dayEvents.length}
              </span>
            )}
          </div>

          {/* Event Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'hidden' }}>
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                style={{
                  padding: '0.2rem 0.45rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: event.color || '#B8C0FF',
                  color: '#232946',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  textDecoration: event.isCompleted ? 'line-through' : 'none',
                  opacity: event.isCompleted ? 0.65 : 1,
                }}
              >
                {event.type === 'study_session' && <BookOpen size={10} />}
                {event.type === 'assignment' && <Layers size={10} />}
                {event.type === 'task' && <CheckSquare size={10} />}
                <span>{event.title}</span>
              </div>
            ))}

            {dayEvents.length > 3 && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--brand-primary)',
                  fontWeight: 700,
                  paddingLeft: '0.2rem',
                }}
              >
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // Week View Layout
  const renderWeekDays = () => {
    const { start } = getDateRangeForView();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const todayStr = new Date().toDateString();

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}
      >
        {days.map((date, idx) => {
          const dateStr = date.toDateString();
          const isToday = dateStr === todayStr;
          const dayEvents = events.filter(
            (e) => new Date(e.start).toDateString() === dateStr
          );

          return (
            <div
              key={idx}
              style={{
                borderRight: idx < 6 ? '1px solid var(--border-subtle)' : 'none',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  background: isToday ? 'var(--pastel-periwinkle-subtle)' : 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isToday ? 'var(--brand-primary)' : 'var(--text-main)' }}>
                  {date.getDate()}
                </div>
              </div>

              {/* Events in column */}
              <div
                onClick={() => openScheduleSessionModal(date)}
                style={{
                  padding: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  flex: 1,
                  cursor: 'pointer',
                }}
              >
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderLeft: `4px solid ${event.color || '#B8C0FF'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem',
                      boxShadow: 'var(--shadow-xs)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} />
                      {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Day View Layout
  const renderDayTimeline = () => {
    const dateStr = currentDate.toDateString();
    const dayEvents = events.filter((e) => new Date(e.start).toDateString() === dateStr);

    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Schedule for {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => openScheduleSessionModal(currentDate)}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Schedule Session
            </button>
            <button
              onClick={() => openAddTaskModal(currentDate)}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', border: '1px solid var(--border-light)' }}
            >
              <Plus size={15} /> Add Task
            </button>
          </div>
        </div>

        {dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <CalendarIcon size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p>No study sessions, tasks, or assignments scheduled for this day.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderLeft: `5px solid ${event.color || '#B8C0FF'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: event.color || 'var(--pastel-lavender)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#232946',
                    }}
                  >
                    {event.type === 'study_session' && <BookOpen size={18} />}
                    {event.type === 'assignment' && <Layers size={18} />}
                    {event.type === 'task' && <CheckSquare size={18} />}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {event.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} />
                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.end && ` - ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                      {event.subject && (
                        <span>• {event.subject.code || event.subject.title}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {event.isCompleted ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-success-text)' }}>
                      Completed ✓
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Bar */}
      <PageHeader
        badge="Personal Study Schedule"
        title="Study Calendar & Agenda"
        description="Schedule focused study blocks, monitor assignment deadlines, and manage daily to-dos."
        action={
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => openScheduleSessionModal()}
              className="btn btn-primary"
              style={{ gap: '0.45rem' }}
            >
              <Plus size={16} /> Schedule Session
            </button>
            <button
              onClick={() => openAddTaskModal()}
              className="btn btn-secondary"
              style={{ gap: '0.45rem' }}
            >
              <Plus size={16} /> Quick Task
            </button>
          </div>
        }
      />

      {/* Toolbar: Navigation + View Mode Switcher + Filters */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Navigation & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handlePrev}
            className="btn btn-ghost"
            style={{ padding: '0.45rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleNext}
            className="btn btn-ghost"
            style={{ padding: '0.45rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}
            title="Next"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={handleToday}
            className="btn btn-ghost"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Today
          </button>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginLeft: '0.5rem' }}>
            {getHeaderTitle()}
          </h2>
        </div>

        {/* View Mode Buttons (Month / Week / Day) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          {['month', 'week', 'day'].map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: active ? 800 : 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  boxShadow: active ? 'var(--shadow-xs)' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'var(--transition-fast)',
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Showing:
          </span>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showSessions}
              onChange={(e) => setShowSessions(e.target.checked)}
            />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD6FF' }} />
            Study Sessions
          </label>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(e) => setShowTasks(e.target.checked)}
            />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B8C0FF' }} />
            Tasks
          </label>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showAssignments}
              onChange={(e) => setShowAssignments(e.target.checked)}
            />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E7C6FF' }} />
            Assignments
          </label>
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="input-field"
          style={{ height: '36px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id || s._id} value={s.id || s._id}>
              {s.code ? `${s.code} - ` : ''}{s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Main Calendar View Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          Updating calendar feed...
        </div>
      ) : viewMode === 'month' ? (
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <div
            style={{
              minWidth: '700px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Weekday Labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Day Cells Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {renderMonthDays()}
            </div>
          </div>
        </div>
      ) : viewMode === 'week' ? (
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: '700px' }}>
            {renderWeekDays()}
          </div>
        </div>
      ) : (
        renderDayTimeline()
      )}

      {/* Event Details Popup Modal */}
      {selectedEvent && (
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
              maxWidth: '500px',
              borderTop: `6px solid ${selectedEvent.color || '#B8C0FF'}`,
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {selectedEvent.type.replace('_', ' ')}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn btn-ghost"
                style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {selectedEvent.description && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {selectedEvent.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Clock size={15} color="var(--brand-primary)" />
                <span>
                  {new Date(selectedEvent.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  • {new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>

              {selectedEvent.subject && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <BookOpen size={15} color="var(--brand-primary)" />
                  <span>{selectedEvent.subject.code ? `${selectedEvent.subject.code}: ` : ''}{selectedEvent.subject.title}</span>
                </div>
              )}

              {selectedEvent.totalPoints && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Layers size={15} color="var(--brand-primary)" />
                  <span>Total: {selectedEvent.totalPoints} Points</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                {(selectedEvent.type === 'task' || selectedEvent.type === 'study_session') && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="btn btn-ghost"
                    style={{ color: 'var(--status-error-text)', fontSize: '0.82rem' }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(selectedEvent.type === 'task' || selectedEvent.type === 'study_session') && (
                  <button
                    onClick={() => handleToggleEventComplete(selectedEvent)}
                    className="btn btn-ghost"
                    style={{
                      border: '1px solid var(--border-light)',
                      color: selectedEvent.isCompleted ? 'var(--status-success-text)' : 'var(--text-main)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {selectedEvent.isCompleted ? 'Mark Incomplete' : 'Mark Complete ✓'}
                  </button>
                )}

                {selectedEvent.type === 'task' && (
                  <Link
                    to={`/tasks/${selectedEvent.originalId}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    View Task <ExternalLink size={13} />
                  </Link>
                )}

                {selectedEvent.type === 'assignment' && (
                  <Link
                    to={`/assignments/${selectedEvent.originalId}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    View Assignment <ExternalLink size={13} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Study Session Modal */}
      {isSessionModalOpen && (
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
              maxWidth: '540px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Schedule Study Session
              </h3>
              <button onClick={() => setIsSessionModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Study: Vector Spaces & Projections"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Subject & Cascading Topic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Subject *
                  </label>
                  <select
                    required
                    value={sessionForm.subject}
                    onChange={(e) => handleSessionSubjectChange(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.code ? `${s.code} - ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Topic (Optional)
                  </label>
                  <select
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                    className="input-field"
                    disabled={!sessionForm.subject || availableTopics.length === 0}
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">All Topics</option>
                    {availableTopics.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Time & End Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Session Color Accent
                </label>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  {PASTEL_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSessionForm({ ...sessionForm, color: col.hex })}
                      title={col.name}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: col.hex,
                        border: sessionForm.color === col.hex ? '3px solid var(--brand-primary)' : '2px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transform: sessionForm.color === col.hex ? 'scale(1.15)' : 'scale(1)',
                        transition: 'var(--transition-fast)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Notes or Focus Goals
                </label>
                <textarea
                  rows={2}
                  placeholder="Target 3 Pomodoros, summarize definitions, practice problem set..."
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSessionModalOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Task Modal */}
      {isTaskModalOpen && (
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
              maxWidth: '500px',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Quick Add Task
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.35rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finish reading chapter 4"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Subject
                  </label>
                  <select
                    value={taskForm.subject}
                    onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">General</option>
                    {subjects.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.code ? `${s.code} - ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyCalendar;
