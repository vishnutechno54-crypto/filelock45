import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatBytes, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const { data } = await api.get('/admin/dashboard');
        setDashboard(data.dashboard);
      } else if (tab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data.users);
      } else if (tab === 'activity') {
        const { data } = await api.get('/admin/activity');
        setActivity(data.activity);
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleUser = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/users', newUser);
      toast.success('User created successfully');
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setShowCreateUser(false);
      if (tab === 'users') loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const ACTION_COLORS = {
    upload: '#10b981', download: '#3b82f6', delete: '#ef4444', create_folder: '#6366f1',
    delete_folder: '#ef4444', rename: '#f59e0b', login: '#8b5cf6', logout: '#6b7280',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚡ Admin Panel</h1>
          <p className="page-subtitle">Manage users, files, and system activity</p>
        </div>
      </div>

      <div className="admin-tabs">
        {['dashboard', 'users', 'activity'].map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /><p>Loading...</p></div>
      ) : (
        <>
          {tab === 'dashboard' && dashboard && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <p className="stat-value">{dashboard.totalUsers}</p>
                    <p className="stat-label">Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <p className="stat-value">{dashboard.totalFiles}</p>
                    <p className="stat-label">Total Files</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <p className="stat-value">{dashboard.totalFolders}</p>
                    <p className="stat-label">Total Folders</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <p className="stat-value">{formatBytes(dashboard.storageStats?.totalStorage || 0)}</p>
                    <p className="stat-label">Total Storage Used</p>
                  </div>
                </div>
              </div>

              {dashboard.recentActivity?.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Recent Activity</h2>
                  <div className="activity-list">
                    {dashboard.recentActivity.slice(0, 10).map((a, i) => (
                      <div key={i} className="activity-item">
                        <div className="activity-dot" style={{ background: ACTION_COLORS[a.action] || '#6b7280' }} />
                        <div className="activity-info">
                          <span className="activity-user">{a.user?.name || 'Unknown'}</span>
                          <span className="activity-action">{a.action.replace('_', ' ')}</span>
                          {a.target && <span className="activity-target">"{a.target}"</span>}
                        </div>
                        <span className="activity-time">{formatDate(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="section-title">{users.length} Users</h2>
                <button className="btn-primary" onClick={() => setShowCreateUser(true)}>+ Add User</button>
              </div>

              {showCreateUser && (
                <div className="create-user-form">
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Create New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <div className="form-row">
                      <input className="form-input" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                      <input className="form-input" type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                      <input className="form-input" type="password" placeholder="Password (min 8 chars)" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={8} />
                      <select className="form-input form-select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button type="submit" className="btn-primary" disabled={creating}>
                        {creating ? 'Creating...' : 'Create User'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setShowCreateUser(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="users-table">
                <div className="users-table-header">
                  <span>User</span><span>Role</span><span>Storage</span><span>Last Login</span><span>Status</span><span>Actions</span>
                </div>
                {users.map((user) => (
                  <div key={user._id} className={`user-row ${!user.isActive ? 'user-inactive' : ''}`}>
                    <div className="user-row-info">
                      <div className="user-avatar-sm">{user.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="user-row-name">{user.name}</p>
                        <p className="user-row-email">{user.email}</p>
                      </div>
                    </div>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                    <span className="user-storage">{formatBytes(user.storageUsed || 0)} / {formatBytes(user.storageLimit)}</span>
                    <span className="user-last-login">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="user-row-actions">
                      <button className="btn-icon-sm" onClick={() => handleToggleUser(user)} title={user.isActive ? 'Deactivate' : 'Activate'}>
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                      <button className="btn-icon-sm btn-danger-sm" onClick={() => handleDeleteUser(user)} title="Delete user">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>System Activity Log</h2>
              <div className="activity-list">
                {activity.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: ACTION_COLORS[a.action] || '#6b7280' }} />
                    <div className="activity-info">
                      <span className="activity-user">{a.user?.name || 'Unknown'}</span>
                      <span className="activity-email">({a.user?.email})</span>
                      <span className="activity-action"> {a.action.replace('_', ' ')}</span>
                      {a.target && <span className="activity-target"> "{a.target}"</span>}
                      {a.details && <span className="activity-details"> — {a.details}</span>}
                    </div>
                    <span className="activity-time">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
                {activity.length === 0 && (
                  <div className="empty-state"><p>No activity recorded yet</p></div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
