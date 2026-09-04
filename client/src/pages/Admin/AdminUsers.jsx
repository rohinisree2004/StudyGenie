import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/UI';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  Building,
  Mail,
  Filter,
} from 'lucide-react';

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    institution: '',
    gradeLevel: '',
    phone: '',
    bio: '',
  });

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'student',
    institution: '',
    gradeLevel: '',
    phone: '',
    bio: '',
    password: '',
  });

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        limit: 50,
      });
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setBannerMessage({ text: 'Could not load users.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      institution: '',
      gradeLevel: '',
      phone: '',
      bio: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createUser(createForm);
      setBannerMessage({ text: `Account for ${createForm.name} created successfully!`, type: 'success' });
      setShowCreateModal(false);
      await loadUsers();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution || '',
      gradeLevel: user.gradeLevel || '',
      phone: user.phone || '',
      bio: user.bio || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const payload = { ...editForm };
      if (!payload.password.trim()) delete payload.password;

      await adminService.updateUser(editingUser._id, payload);
      setBannerMessage({ text: `User ${editForm.name} updated successfully!`, type: 'success' });
      setShowEditModal(false);
      await loadUsers();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentAdmin?.id || user._id === currentAdmin?._id) {
      alert('Security Protection: You cannot suspend your own Administrator account.');
      return;
    }

    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} ${user.name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.updateUserStatus(user._id, nextStatus);
      setBannerMessage({
        text: `Account for ${user.name} is now ${nextStatus}.`,
        type: 'success',
      });
      await loadUsers();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteUser(userToDelete._id);
      setBannerMessage({
        text: `User ${userToDelete.name} was successfully removed.`,
        type: 'success',
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadUsers();
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="Platform User Management"
        subtitle="Audit, provision, update, suspend, or manage roles across all platform accounts."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              {users.length} Records Loaded
            </span>
          </div>
        }
        actions={
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} /> Create New Account
          </button>
        }
      />

      {bannerMessage.text && (
        <div className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
          {bannerMessage.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Search by name, email, or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Role Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
            Role:
          </span>
          {['all', 'student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className="btn btn-ghost"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: roleFilter === role ? 700 : 500,
                backgroundColor: roleFilter === role ? 'var(--pastel-lavender)' : 'transparent',
                color: roleFilter === role ? '#242F55' : 'var(--text-secondary)',
                border: roleFilter === role ? '1px solid var(--border-light)' : 'none',
              }}
            >
              {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
            Status:
          </span>
          <select
            className="form-input no-icon"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" />
        </div>
      ) : users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No accounts match your criteria
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Try adjusting your search terms or clearing your role/status filters.
          </p>
          <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>User</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Institution & Grade</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Joined</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = u._id === currentAdmin?.id || u._id === currentAdmin?._id;
                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: u.role === 'admin' ? 'var(--pastel-pink)' : u.role === 'teacher' ? 'var(--pastel-mauve)' : 'var(--pastel-sky)',
                              color: '#242F55',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {u.name}
                              {isCurrent && (
                                <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--pastel-pink-subtle)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-xs)' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          className={`badge ${u.role === 'admin' ? 'badge-admin' : u.role === 'teacher' ? 'badge-teacher' : 'badge-student'}`}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {u.role === 'admin' && <Shield size={11} />}
                          {u.role === 'teacher' && <GraduationCap size={11} />}
                          {u.role === 'student' && <BookOpen size={11} />}
                          {u.role}
                        </span>
                      </td>

                      {/* Institution */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 500 }}>{u.institution || '—'}</div>
                        {u.gradeLevel && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.gradeLevel}
                          </div>
                        )}
                      </td>

                      {/* Status */}
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
                            backgroundColor: u.accountStatus === 'active' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                            color: u.accountStatus === 'active' ? 'var(--status-success-text)' : 'var(--status-error-text)',
                            border: `1px solid ${u.accountStatus === 'active' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
                            textTransform: 'capitalize',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: u.accountStatus === 'active' ? '#0D7A4D' : '#B91C36',
                            }}
                          />
                          {u.accountStatus}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className="btn btn-ghost"
                            style={{
                              padding: '0.35rem 0.6rem',
                              color: u.accountStatus === 'active' ? '#B91C36' : '#0D7A4D',
                              opacity: isCurrent ? 0.3 : 1,
                            }}
                            title={u.accountStatus === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.accountStatus === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title="Edit Account Details"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => { setUserToDelete(u); setShowDeleteModal(true); }}
                            disabled={isCurrent}
                            className="btn btn-ghost"
                            style={{
                              padding: '0.35rem 0.6rem',
                              color: 'var(--status-error-text)',
                              opacity: isCurrent ? 0.3 : 1,
                            }}
                            title={isCurrent ? 'Cannot delete self' : 'Delete Account'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
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
                Provision New User
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newName">Full Name *</label>
                  <input
                    id="newName"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Jordan Smith"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newRole">System Role *</label>
                  <select
                    id="newRole"
                    className="form-input no-icon"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher (Educator)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newEmail">Email Address *</label>
                  <input
                    id="newEmail"
                    type="email"
                    className="form-input no-icon"
                    placeholder="e.g. jordan@studygenie.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">Initial Password *</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input no-icon"
                    placeholder="Minimum 6 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newInst">Institution / School</label>
                  <input
                    id="newInst"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. Stanford University"
                    value={createForm.institution}
                    onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newGrade">Grade / Academic Level</label>
                  <input
                    id="newGrade"
                    type="text"
                    className="form-input no-icon"
                    placeholder="e.g. 1st Year Master's"
                    value={createForm.gradeLevel}
                    onChange={(e) => setCreateForm({ ...createForm, gradeLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newBio">Biography & Notes</label>
                <textarea
                  id="newBio"
                  rows={2}
                  className="form-input no-icon"
                  placeholder="Optional background or academic profile note..."
                  value={createForm.bio}
                  onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn btn-primary">
                  {isCreating ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
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
                Edit Account: {editingUser.name}
              </h2>
              <button onClick={() => setShowEditModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editName">Full Name *</label>
                  <input
                    id="editName"
                    type="text"
                    className="form-input no-icon"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editRole">System Role</label>
                  <select
                    id="editRole"
                    className="form-input no-icon"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={editingUser._id === currentAdmin?.id || editingUser._id === currentAdmin?._id}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editEmail">Email Address *</label>
                  <input
                    id="editEmail"
                    type="email"
                    className="form-input no-icon"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editPass">New Password (leave blank to keep)</label>
                  <input
                    id="editPass"
                    type="password"
                    className="form-input no-icon"
                    placeholder="Enter to change"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editInst">Institution</label>
                  <input
                    id="editInst"
                    type="text"
                    className="form-input no-icon"
                    value={editForm.institution}
                    onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editGrade">Grade Level</label>
                  <input
                    id="editGrade"
                    type="text"
                    className="form-input no-icon"
                    value={editForm.gradeLevel}
                    onChange={(e) => setEditForm({ ...editForm, gradeLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editBio">Bio</label>
                <textarea
                  id="editBio"
                  rows={2}
                  className="form-input no-icon"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                  {isUpdating ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#B91C36', marginBottom: '1rem' }}>
              <AlertCircle size={24} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Confirm Account Deletion
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Are you sure you want to permanently delete <strong>{userToDelete.name}</strong> ({userToDelete.email})?
            </p>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              🛡️ <strong>Cascade Safeguards:</strong> If this user is an educator, courses will remain intact and be unassigned. If they are a student, subject enrollments will be safely pulled.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn btn-primary"
                style={{ backgroundColor: '#B91C36', borderColor: '#B91C36' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
