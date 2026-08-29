import React, { useState, useEffect } from 'react';
import { subjectService } from '../../services/subjectService';
import { userService } from '../../services/userService';
import { Shield, Plus, Edit, Trash2, Users, BookOpen, User, X, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminSubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    category: 'Computer Science',
    color: '#BBD0FF',
    teacherId: '',
  });

  const [bannerMessage, setBannerMessage] = useState('');

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
      console.error('Failed to load admin data:', err);
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
    setFormData({
      title: '',
      code: '',
      description: '',
      category: 'Computer Science',
      color: '#BBD0FF',
      teacherId: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (subject) => {
    setIsEditing(true);
    setSelectedSubjectId(subject.id);
    setFormData({
      title: subject.title,
      code: subject.code || '',
      description: subject.description || '',
      category: subject.category || 'General',
      color: subject.color || '#BBD0FF',
      teacherId: subject.teacher?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await subjectService.updateSubject(selectedSubjectId, formData);
        setBannerMessage('Subject updated successfully!');
      } else {
        await subjectService.createSubject(formData);
        setBannerMessage('New subject created successfully!');
      }
      setShowModal(false);
      await loadData();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" and all its syllabus topics?`)) {
      return;
    }

    try {
      await subjectService.deleteSubject(id);
      setBannerMessage(`Deleted subject "${title}"`);
      await loadData();
      setTimeout(() => setBannerMessage(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  const totalTopics = subjects.reduce((acc, s) => acc + (s.topicCount || 0), 0);
  const totalStudents = subjects.reduce((acc, s) => acc + (s.studentCount || 0), 0);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
            Academic Subject Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Configure course subjects, syllabus categories, and assign faculty educators.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {bannerMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={17} />
          <span>{bannerMessage}</span>
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
        <div className="card card-pastel-sky">
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Subjects</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {subjects.length} Courses
          </div>
        </div>

        <div className="card card-pastel-lavender">
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Published Topics</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {totalTopics} Topics
          </div>
        </div>

        <div className="card card-pastel-pink">
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Student Seats</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {totalStudents} Enrolled
          </div>
        </div>
      </div>

      {/* Subjects Directory */}
      {isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No subjects created yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Get started by setting up your school or university's primary curriculum.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            Add First Subject
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Subject</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Code</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Assigned Educator</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Topics</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Students</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj) => (
                  <tr
                    key={subj.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: subj.color || '#BBD0FF',
                          }}
                        />
                        {subj.title}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {subj.code || '—'}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-student" style={{ fontSize: '0.72rem' }}>
                        {subj.category || 'General'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {subj.teacher ? (
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{subj.teacher.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {subj.topicCount || 0}
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {subj.studentCount || 0}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenEdit(subj)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          title="Edit Subject"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(subj.id, subj.title)}
                          className="btn btn-ghost"
                          style={{ padding: '0.35rem 0.65rem', color: 'var(--status-error-text)' }}
                          title="Delete Subject"
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
      {showModal && (
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
              maxWidth: '560px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isEditing ? 'Edit Subject' : 'Create Academic Subject'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Subject Title *</label>
                <input
                  id="title"
                  type="text"
                  className="form-input no-icon"
                  placeholder="e.g. Distributed Operating Systems"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="code">Subject Code</label>
                  <input
                    id="code"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. CS-401"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category</label>
                  <input
                    id="category"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Computer Science"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              {/* Assign Teacher Dropdown */}
              <div className="form-group">
                <label className="form-label" htmlFor="teacherSelect">Assign Faculty Educator</label>
                <select
                  id="teacherSelect"
                  className="form-input no-icon"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                >
                  <option value="">-- No Educator Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email}) {t.institution ? `— ${t.institution}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="desc">Course Description</label>
                <textarea
                  id="desc"
                  rows={3}
                  className="form-input no-icon"
                  placeholder="Summary of course scope and academic milestones..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Soft Pastel Color Picker */}
              <div className="form-group">
                <label className="form-label">Pastel Accent Theme</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: formData.color === c ? '3px solid var(--text-main)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transform: formData.color === c ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectManagement;
