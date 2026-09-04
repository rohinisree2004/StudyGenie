import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/UI';
import {
  Server,
  Database,
  Megaphone,
  Shield,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  Lock,
  Clock,
  Radio,
} from 'lucide-react';

const AdminSettings = () => {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'normal',
    category: 'system',
  });

  const loadHealth = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSystemHealth();
      if (res.success) {
        setHealthData(res.system);
      }
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
      setBannerMessage({ text: 'Could not fetch system diagnostics.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await adminService.broadcastNotification(broadcastForm);
      setBannerMessage({
        text: `Broadcast alert dispatched successfully to ${res.sentCount} user(s).`,
        type: 'success',
      });
      setBroadcastForm({
        title: '',
        message: '',
        targetRole: 'all',
        priority: 'normal',
        category: 'system',
      });
      setTimeout(() => setBannerMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      alert(err.message || 'Failed to dispatch broadcast notice');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <PageHeader
        title="System Settings & Platform Broadcasts"
        subtitle="Inspect runtime cluster metrics, database connection health, and broadcast announcements platform-wide."
        badge={
          <div className="flex items-center gap-2">
            <span className="badge badge-admin">
              <Shield size={12} /> System Admin
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              Cluster Health & Broadcasts
            </span>
          </div>
        }
        actions={
          <button onClick={loadHealth} className="btn btn-secondary" style={{ gap: '0.45rem' }}>
            <RefreshCw size={15} /> Refresh Diagnostics
          </button>
        }
      />

      {bannerMessage.text && (
        <div className={`alert ${bannerMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {bannerMessage.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Grid: Health & Broadcast */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.75rem' }}>
        {/* System Diagnostics Card */}
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Server size={20} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Cluster & Engine Status
              </h2>
            </div>
            <span className="badge badge-active">
              <Activity size={12} /> Live
            </span>
          </div>

          {isLoading ? (
            <div style={{ minHeight: '25vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner spinner-dark" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Database */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Database size={16} color="#0D7A4D" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    MongoDB Database
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Cluster Status: <strong>{healthData?.database?.status || 'Connected'}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Host: {healthData?.database?.host || 'MongoDB Atlas'} • Database: {healthData?.database?.name || 'studygenie'}
                </div>
              </div>

              {/* Node Runtime */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Cpu size={16} color="var(--brand-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Node.js Runtime & Memory
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Version: <strong>{healthData?.nodeVersion}</strong> ({healthData?.environment} mode)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Heap Used: {healthData?.memory?.heapUsedMB} MB / {healthData?.memory?.heapTotalMB} MB (RSS: {healthData?.memory?.rssMB} MB)
                </div>
              </div>

              {/* Server Uptime */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Clock size={16} color="#453E8A" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Process Uptime
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Active Duration: <strong>{healthData?.uptimeFormatted}</strong> ({healthData?.uptimeSeconds}s)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Port: {healthData?.port} • Platform: {healthData?.platform}
                </div>
              </div>

              {/* Security Policy */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Lock size={16} color="#8A1C78" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    RBAC & Registration Security
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Public Registration: <strong>Students & Teachers Only</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Administrator creation is restricted to internal superadmins via Admin module.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Broadcast Sender Card */}
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Megaphone size={20} color="var(--brand-primary)" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Broadcast System Notice
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Dispatch instant notifications directly into recipient user dashboards.
              </p>
            </div>
          </div>

          <form onSubmit={handleBroadcast}>
            <div className="form-group">
              <label className="form-label" htmlFor="bTitle">Announcement Title *</label>
              <input
                id="bTitle"
                type="text"
                className="form-input no-icon"
                placeholder="e.g. Scheduled System Upgrade"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="bRole">Target Audience</label>
                <select
                  id="bRole"
                  className="form-input no-icon"
                  value={broadcastForm.targetRole}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                >
                  <option value="all">All Registered Users</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bPriority">Priority Level</label>
                <select
                  id="bPriority"
                  className="form-input no-icon"
                  value={broadcastForm.priority}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                >
                  <option value="normal">Normal (Informative)</option>
                  <option value="high">High (Notice)</option>
                  <option value="urgent">Urgent (Immediate Attention)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bCategory">Notice Category</label>
              <select
                id="bCategory"
                className="form-input no-icon"
                value={broadcastForm.category}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
              >
                <option value="system">System Notification</option>
                <option value="announcement">Platform Announcement</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bMessage">Notice Message *</label>
              <textarea
                id="bMessage"
                rows={5}
                className="form-input no-icon"
                placeholder="Enter detailed maintenance instructions, news, or platform alerts..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="btn btn-primary"
              style={{ width: '100%', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <Send size={15} />
              {isBroadcasting ? 'Dispatching Broadcast...' : 'Dispatch Platform Broadcast'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
