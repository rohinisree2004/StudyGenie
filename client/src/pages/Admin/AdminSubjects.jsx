import React, { useState, useEffect } from 'react';
import { subjectService } from '../../services/subjectService';
import { topicService } from '../../services/topicService';
import { adminService } from '../../services/adminService';
import { userService } from '../../services/userService';
import { PageHeader } from '../../components/UI';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ArrowUpDown,
  Archive,
  GraduationCap,
} from 'lucide-react';

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Create / Edit Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    code: '',
    description: '',
    category: 'Computer Science',
    color: '#BBD0FF',
    teacherId: '',
    status: 'active',
  });

  // Topics Management Modal
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [activeSubjectForTopics, setActiveSubjectForTopics] = useState(null);
  const [subjectTopics, setSubjectTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    difficulty: 'intermediate',
    estimatedHours: 2,
    description: '',
  });
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjRes, teacherRes] = await Promise.all([
        subjectService.getSubjects(true),
        userService.getTeachers(),
      ]);
      setSubjects(subjRes.subjects || []);
      setTeachers(teacherRes.teachers || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setBannerMessage({ text: 'Could not load curriculum data.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedSubjectId(null);
    setSubjectForm({
      title: '',
      code: '',
      description: '',
      category: 'Computer Science',
      color: '#BBD0FF',
      teacherId: '',
      status: 'active',
    });
    setShowSubjectModal(true);
  };

  const handleOpenEdit = (subject) => {
    setIsEditing(true);
    setSelectedSubjectId(subject.id);
    setSubjectForm({
      title: subject.title,
      code: subject.code || '',
      description: subject.description || '',
      category: subject.category || 'General',
      color: subject.color || '#BBD0FF',
      teacherId: subject.teacher?._id || subject.teacher?.id || '',
      status: subject.status || 'active',
    });
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.title.trim()) return;

    setIsSavingSubject(true);
    try {
      if (isEditing) {
        await subjectService.updateSubject(selectedSubjectId, subjectForm);
        setBannerMessage({ text: 'Subject updated successfully!', type: 'success' });
      } else {
        await subjectService.createSubject(subjectForm);
        setBannerMessage({ text: 'New academic course created successfully!', type: 'success' });
      }
      setShowSubjectModal(false);
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save subject');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Permanently delete "${subject.title}" and its topics? This cannot be undone.`)) {
      return;
    }

    try {
      await subjectService.deleteSubject(subject.id);
      setBannerMessage({ text: `Course "${subject.title}" deleted.`, type: 'success' });
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  // Topics Management
  const handleOpenTopics = async (subject) => {
    setActiveSubjectForTopics(subject);
    setShowTopicsModal(true);
    setIsLoadingTopics(true);
    try {
      const res = await topicService.getTopicsBySubject(subject.id);
      setSubjectTopics(res.topics || []);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicForm.title.trim() || !activeSubjectForTopics) return;

    setIsAddingTopic(true);
    try {
      await topicService.createTopic(activeSubjectForTopics.id, newTopicForm);
      const res = await topicService.getTopicsBySubject(activeSubjectForTopics.id);
      setSubjectTopics(res.topics || []);
      setNewTopicForm({ title: '', difficulty: 'intermediate', estimatedHours: 2, description: '' });
      await loadData(); // refresh topic counts on main table
    } catch (err) {
      alert(err.message || 'Failed to add topic');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this syllabus topic?')) return;

    try {
      await topicService.deleteTopic(topicId);
      setSubjectTopics(subjectTopics.filter((t) => t._id !== topicId && t.id !== topicId));
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete topic');
    }
  };

  // Filter logic
  const categories = ['all', ...new Set(subjects.map((s) => s.category).filter(Boolean))];
  const filteredSubjects = subjects.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Subject & Syllabus Management"
        subtitle="Configure academic courses, assign faculty instructors, and manage curriculum syllabus topics."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              Curriculum Manager
            </span>
          </div>
        }
        actions={
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} /> New Subject
          </button>
        }
      />

      {bannerMessage.text && (
        <div className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
          {bannerMessage.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
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
            placeholder="Search courses by title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-ghost"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: selectedCategory === cat ? 700 : 500,
                backgroundColor: selectedCategory === cat ? 'var(--pastel-lavender)' : 'transparent',
                color: selectedCategory === cat ? '#242F55' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--border-light)' : 'none',
              }}
            >
              {cat === 'all' ? 'All Disciplines' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Table */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No courses found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            No subjects match your current filter selection.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            Create First Subject
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Course</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Code</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Assigned Educator</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Topics</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Students</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: s.color || '#BBD0FF',
                            boxShadow: '0 0 0 2px rgba(0,0,0,0.05)',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {s.title}
                          </div>
                          {s.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {s.code || '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span className="badge badge-student" style={{ fontSize: '0.72rem' }}>
                        {s.category || 'General'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      {s.teacher ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.teacher.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <button
                        onClick={() => handleOpenTopics(s)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
                        title="Manage Syllabus Topics"
                      >
                        <Layers size={12} color="var(--brand-primary)" />
                        {s.topicCount || 0} Topics
                      </button>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={13} color="var(--text-muted)" />
                        {s.studentCount || 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Edit Course"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s)}
                          className="btn btn-ghost"
                          style={{ padding: '0.35rem 0.6rem', color: 'var(--status-error-text)' }}
                          title="Delete Course & Topics"
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

      {/* Create / Edit Subject Modal */}
      {showSubjectModal && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Academic Subject' : 'Create Academic Subject'}
              </h2>
              <button onClick={() => setShowSubjectModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="subjTitle">Subject Title *</label>
                <input
                  id="subjTitle"
                  type="text"
                  className="form-input no-icon"
                  placeholder="e.g. Distributed Cloud Computing"
                  value={subjectForm.title}
                  onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subjCode">Subject Code</label>
                  <input
                    id="subjCode"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. CS-501"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="subjCategory">Discipline Category</label>
                  <input
                    id="subjCategory"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Computer Science"
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subjTeacher">Assign Faculty Educator</label>
                <select
                  id="subjTeacher"
                  className="form-input no-icon"
                  value={subjectForm.teacherId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                >
                  <option value="">-- No Educator Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subjDesc">Course Description</label>
                <textarea
                  id="subjDesc"
                  rows={2}
                  className="form-input no-icon"
                  placeholder="Syllabus overview and goals..."
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                />
              </div>

              {/* Pastel Color Selector */}
              <div className="form-group">
                <label className="form-label">Pastel Accent</label>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
                  {['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: c })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: subjectForm.color === c ? '3px solid var(--text-main)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transform: subjectForm.color === c ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingSubject} className="btn btn-primary">
                  {isSavingSubject ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Syllabus Topics Manager Modal */}
      {showTopicsModal && activeSubjectForTopics && (
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
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeSubjectForTopics.color }} />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Syllabus Topics: {activeSubjectForTopics.title}
                  </h2>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Manage module curriculum milestones and estimated study durations.
                </p>
              </div>

              <button onClick={() => setShowTopicsModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            {/* Existing Topics List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Published Topics ({subjectTopics.length})
              </h3>

              {isLoadingTopics ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <div className="spinner spinner-dark" />
                </div>
              ) : subjectTopics.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No syllabus topics defined for this subject yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {subjectTopics.map((topic, idx) => (
                    <div
                      key={topic._id || topic.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {topic.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem' }}>
                            <span>Difficulty: <strong>{topic.difficulty || 'intermediate'}</strong></span>
                            <span>•</span>
                            <span>Est: <strong>{topic.estimatedHours || 2} hrs</strong></span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTopic(topic._id || topic.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.3rem', color: 'var(--status-error-text)' }}
                        title="Remove Topic"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Topic Form */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                Add New Syllabus Topic
              </h3>

              <form onSubmit={handleAddTopic}>
                <div className="form-group">
                  <label className="form-label" htmlFor="topicTitle">Topic Title *</label>
                  <input
                    id="topicTitle"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Asynchronous Consensus Algorithms"
                    value={newTopicForm.title}
                    onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="topicDiff">Difficulty</label>
                    <select
                      id="topicDiff"
                      className="form-input no-icon"
                      value={newTopicForm.difficulty}
                      onChange={(e) => setNewTopicForm({ ...newTopicForm, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="topicHours">Est. Study Hours</label>
                    <input
                      id="topicHours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      className="form-input no-icon"
                      value={newTopicForm.estimatedHours}
                      onChange={(e) => setNewTopicForm({ ...newTopicForm, estimatedHours: parseFloat(e.target.value) || 2 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" disabled={isAddingTopic} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                    <Plus size={14} />
                    {isAddingTopic ? 'Adding...' : 'Add Topic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjects;
