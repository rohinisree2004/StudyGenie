import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/UI';
import {
  GraduationCap,
  Search,
  BookOpen,
  Clock,
  Building,
  Lock,
  Unlock,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getStudents({
        search: searchTerm,
        status: statusFilter,
      });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setBannerMessage({ text: 'Could not retrieve students list.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleToggleStatus = async (student) => {
    const nextStatus = student.accountStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} ${student.name}'s account?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(student.id, nextStatus);
      setBannerMessage({
        text: `Student ${student.name} is now ${nextStatus}.`,
        type: 'success',
      });
      await loadStudents();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update student status');
    }
  };

  const activeCount = students.filter((s) => s.accountStatus === 'active').length;
  const suspendedCount = students.filter((s) => s.accountStatus === 'suspended').length;
  const totalEnrolled = students.reduce((sum, s) => sum + (s.enrolledCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Student Roster & Academic Monitoring"
        subtitle="Inspect student enrollment density, study goals, account statuses, and academic performance tracking."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-student" style={{ fontSize: '0.75rem' }}>
              Student Directory
            </span>
          </div>
        }
        actions={
          <Link to="/admin/users" className="btn btn-secondary" style={{ gap: '0.45rem' }}>
            Manage in All Users →
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
        <div className="card card-pastel-sky" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Students</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {students.length} Accounts
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Registered student cohort
          </div>
        </div>

        <div className="card card-pastel-lavender" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Active Learners</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {activeCount} Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {suspendedCount} currently suspended
          </div>
        </div>

        <div className="card card-pastel-pink" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Course Enrollments</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {totalEnrolled} Enrollments
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Across all active subjects
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
            placeholder="Search students by name, email, or school..."
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

      {/* Students List */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <GraduationCap size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No students found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Try updating your search query.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Student</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Institution & Grade</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Enrolled Courses</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Daily Study Goal</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
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
                            backgroundColor: 'var(--pastel-sky)',
                            color: '#242F55',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <div>{s.institution || '—'}</div>
                      {s.gradeLevel && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.gradeLevel}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span className="badge badge-student" style={{ fontSize: '0.75rem' }}>
                        <BookOpen size={11} /> {s.enrolledCount} Course{s.enrolledCount === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <Clock size={13} color="var(--brand-primary)" />
                        {s.dailyStudyGoalHours}h / day
                      </span>
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
                          backgroundColor: s.accountStatus === 'active' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                          color: s.accountStatus === 'active' ? 'var(--status-success-text)' : 'var(--status-error-text)',
                          border: `1px solid ${s.accountStatus === 'active' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
                          textTransform: 'capitalize',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: s.accountStatus === 'active' ? '#0D7A4D' : '#B91C36',
                          }}
                        />
                        {s.accountStatus}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/teacher/students/${s.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                          title="Inspect Student Progress & Analytics"
                        >
                          <ExternalLink size={12} /> Performance
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className="btn btn-ghost"
                          style={{
                            padding: '0.35rem 0.65rem',
                            color: s.accountStatus === 'active' ? '#B91C36' : '#0D7A4D',
                          }}
                          title={s.accountStatus === 'active' ? 'Suspend Student' : 'Activate Student'}
                        >
                          {s.accountStatus === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
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
    </div>
  );
};

export default AdminStudents;
