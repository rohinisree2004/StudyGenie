import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { subjectService } from '../../services/subjectService';
import { PageHeader } from '../../components/UI';
import {
  GraduationCap,
  Search,
  BookOpen,
  Lock,
  Unlock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Building,
} from 'lucide-react';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Assign Course Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        adminService.getTeachers({ search: searchTerm, status: statusFilter }),
        subjectService.getSubjects(true),
      ]);

      if (teachersRes.success) {
        setTeachers(teachersRes.teachers || []);
      }
      if (subjectsRes.success) {
        setAllSubjects(subjectsRes.subjects || []);
      }
    } catch (err) {
      console.error('Failed to load teachers data:', err);
      setBannerMessage({ text: 'Could not load educator directory.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleToggleStatus = async (teacher) => {
    const nextStatus = teacher.accountStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} educator ${teacher.name}?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(teacher.id, nextStatus);
      setBannerMessage({
        text: `Educator ${teacher.name} status updated to ${nextStatus}.`,
        type: 'success',
      });
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update educator status');
    }
  };

  const handleOpenAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedSubjectId('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSubjectId) return;

    setIsAssigning(true);
    try {
      await adminService.assignTeacher(selectedSubjectId, selectedTeacher.id);
      setBannerMessage({
        text: `Assigned course to ${selectedTeacher.name} successfully!`,
        type: 'success',
      });
      setShowAssignModal(false);
      setSelectedTeacher(null);
      await loadData();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to assign course');
    } finally {
      setIsAssigning(false);
    }
  };

  const totalAssignedCourses = teachers.reduce((acc, t) => acc + (t.totalAssigned || 0), 0);
  const activeCount = teachers.filter((t) => t.accountStatus === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Faculty & Educator Management"
        subtitle="Review assigned faculty instructors, monitor course allocations, and manage teaching assignments."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-teacher" style={{ fontSize: '0.75rem' }}>
              Faculty Directory
            </span>
          </div>
        }
        actions={
          <Link to="/admin/subjects" className="btn btn-secondary" style={{ gap: '0.45rem' }}>
            Curriculum Directory →
          </Link>
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
        <div className="card card-pastel-mauve" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Faculty</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {teachers.length} Educators
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Registered instructor accounts
          </div>
        </div>

        <div className="card card-pastel-lavender" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Active Instructors</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {activeCount} Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Teaching & managing courses
          </div>
        </div>

        <div className="card card-pastel-sky" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Course Assignments</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {totalAssignedCourses} Courses
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Assigned to faculty members
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search faculty by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Teachers List */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <GraduationCap size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No educators found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Faculty Educator</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Institution & Dept</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Assigned Courses</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--pastel-mauve)',
                            color: '#242F55',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {t.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <div>{t.institution || '—'}</div>
                      {t.bio && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.bio}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      {t.assignedSubjects?.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          No courses assigned
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {t.assignedSubjects.map((s) => (
                            <span
                              key={s.id}
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
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color || '#BBD0FF' }} />
                              {s.title} ({s.studentCount} students)
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: t.accountStatus === 'active' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                          color: t.accountStatus === 'active' ? 'var(--status-success-text)' : 'var(--status-error-text)',
                          border: `1px solid ${t.accountStatus === 'active' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
                          textTransform: 'capitalize',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: t.accountStatus === 'active' ? '#0D7A4D' : '#B91C36',
                          }}
                        />
                        {t.accountStatus}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenAssign(t)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                          title="Assign Subject to Educator"
                        >
                          <Plus size={12} /> Assign Subject
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className="btn btn-ghost"
                          style={{
                            padding: '0.35rem 0.65rem',
                            color: t.accountStatus === 'active' ? '#B91C36' : '#0D7A4D',
                          }}
                          title={t.accountStatus === 'active' ? 'Suspend Educator' : 'Activate Educator'}
                        >
                          {t.accountStatus === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
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

      {/* Assign Course Modal */}
      {showAssignModal && selectedTeacher && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Assign Course to {selectedTeacher.name}
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="subjSelect">Select Curriculum Course *</label>
                <select
                  id="subjSelect"
                  className="form-input no-icon"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.code || 'No Code'}) {s.teacher ? `[Currently: ${s.teacher.name}]` : '[Unassigned]'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isAssigning} className="btn btn-primary">
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
