import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDate, getFileIcon, getCategoryColor, CATEGORY_LABELS } from '../utils/helpers';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, filesRes, foldersRes] = await Promise.all([
        api.get('/files/stats/summary'),
        api.get('/files?limit=6&page=1'),
        api.get('/folders?parent=root'),
      ]);
      setStats(statsRes.data.stats);
      setRecentFiles(filesRes.data.files);
      setFolders(foldersRes.data.folders);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const storagePercent = stats ? Math.min((stats.storageUsed / stats.storageLimit) * 100, 100) : 0;

  const catStats = stats?.byCategory || [];
  const mainCategories = ['image', 'video', 'audio', 'document', 'archive', 'code'];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's in your secure vault</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => setShowCreateFolder(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            New Folder
          </button>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
            Upload Files
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading your vault...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{stats?.totalFiles || 0}</p>
                <p className="stat-label">Total Files</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{folders.length}</p>
                <p className="stat-label">Folders</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-value">{formatBytes(stats?.storageUsed || 0)}</p>
                <p className="stat-label">Storage Used</p>
              </div>
            </div>

            <div className="stat-card storage-stat-card">
              <div className="storage-overview">
                <div className="storage-overview-header">
                  <span className="stat-label">Storage Capacity</span>
                  <span className="storage-overview-pct">{storagePercent.toFixed(1)}%</span>
                </div>
                <div className="storage-bar-lg">
                  <div
                    className="storage-fill-lg"
                    style={{
                      width: `${storagePercent}%`,
                      background: storagePercent > 80 ? '#ef4444' : storagePercent > 60 ? '#f59e0b' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    }}
                  />
                </div>
                <div className="storage-overview-info">
                  <span>{formatBytes(stats?.storageUsed || 0)} used</span>
                  <span>{formatBytes(stats?.storageLimit || 0)} total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="section">
            <h2 className="section-title">File Categories</h2>
            <div className="category-grid">
              {mainCategories.map((cat) => {
                const catData = catStats.find((c) => c._id === cat);
                return (
                  <div key={cat} className="category-card" onClick={() => navigate(`/files?category=${cat}`)}>
                    <div className="category-card-icon" style={{ color: getCategoryColor(cat) }}>
                      {cat === 'image' ? '🖼️' : cat === 'video' ? '🎬' : cat === 'audio' ? '🎵' : cat === 'document' ? '📄' : cat === 'archive' ? '🗜️' : '💻'}
                    </div>
                    <div className="category-card-info">
                      <p className="category-card-label">{CATEGORY_LABELS[cat]}</p>
                      <p className="category-card-count">{catData?.count || 0} files</p>
                      {catData?.size > 0 && <p className="category-card-size">{formatBytes(catData.size)}</p>}
                    </div>
                    <div className="category-card-arrow">→</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Folders */}
          {folders.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Recent Folders</h2>
                <button className="btn-link" onClick={() => navigate('/files')}>View all →</button>
              </div>
              <div className="folders-grid">
                {folders.slice(0, 6).map((folder) => (
                  <div key={folder._id} className="folder-card" onClick={() => navigate(`/files?folder=${folder._id}`)}>
                    <div className="folder-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill={folder.color || '#6366f1'} fillOpacity="0.2" stroke={folder.color || '#6366f1'} strokeWidth="1.5">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                    </div>
                    <div className="folder-card-info">
                      <p className="folder-card-name" title={folder.name}>{folder.name}</p>
                      <p className="folder-card-cat">{folder.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Files */}
          {recentFiles.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Recently Added</h2>
                <button className="btn-link" onClick={() => navigate('/files')}>View all →</button>
              </div>
              <div className="recent-files-list">
                {recentFiles.map((file) => (
                  <div key={file._id} className="recent-file-item">
                    <span className="recent-file-icon">{getFileIcon(file.mimetype, file.category)}</span>
                    <div className="recent-file-info">
                      <p className="recent-file-name" title={file.name}>{file.name}</p>
                      <p className="recent-file-meta">{formatBytes(file.size)} · {file.folder?.name || 'Root'}</p>
                    </div>
                    <span className="recent-file-date">{formatDate(file.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={loadData} />
      )}
      {showCreateFolder && (
        <CreateFolderModal onClose={() => setShowCreateFolder(false)} onSuccess={loadData} />
      )}
    </div>
  );
}
