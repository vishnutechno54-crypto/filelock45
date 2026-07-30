import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatBytes, formatDate, getFileIcon, getFileCategory } from '../utils/helpers';

export default function FileCard({ file, onDelete, onUpdate, onPreview, viewMode = 'grid' }) {
  const [starring, setStarring] = useState(false);
  const [isStarred, setIsStarred] = useState(file.isStarred);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(null);
  const effectiveCategory = getFileCategory(file.mimetype, file.originalName || file.name);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    if (effectiveCategory === 'image' && viewMode !== 'list') {
      api
        .get(`/files/${file._id}/preview`, { responseType: 'blob' })
        .then(({ data }) => {
          if (cancelled) return;
          objectUrl = window.URL.createObjectURL(data);
          setThumbUrl(objectUrl);
        })
        .catch(() => {
          // Fall back silently to the generic file icon.
        });
    }

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file._id, effectiveCategory, viewMode]);

  const handleStar = async (e) => {
    e.stopPropagation();
    setStarring(true);
    try {
      const { data } = await api.patch(`/files/${file._id}/star`);
      setIsStarred(data.isStarred);
      onUpdate?.({ ...file, isStarred: data.isStarred });
    } catch {
      toast.error('Failed to update star');
    } finally {
      setStarring(false);
    }
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    setShowMenu(false);
    try {
      const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName || file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    setShowMenu(false);
    if (!window.confirm(`Delete "${file.name}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/files/${file._id}`);
      toast.success('File deleted');
      onDelete?.(file._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = (e) => {
    e?.stopPropagation();
    setShowMenu(false);
    onPreview?.(file);
  };

  if (viewMode === 'list') {
    return (
      <div className={`file-row ${deleting ? 'file-deleting' : ''}`}>
        <div className="file-row-icon">{getFileIcon(file.mimetype, effectiveCategory, file.name)}</div>
        <div className="file-row-name">
          <span className="file-name" title={file.name}>{file.name}</span>
          {file.tags?.length > 0 && (
            <div className="file-tags">
              {file.tags.slice(0, 2).map((t) => <span key={t} className="file-tag">{t}</span>)}
            </div>
          )}
        </div>
        <div className="file-row-size">{formatBytes(file.size)}</div>
        <div className="file-row-date">{formatDate(file.createdAt)}</div>
        <div className="file-row-category">
          <span className={`badge badge-${effectiveCategory}`}>{effectiveCategory}</span>
        </div>
        <div className="file-row-actions">
          <button className={`btn-star ${isStarred ? 'starred' : ''}`} onClick={handleStar} disabled={starring}>★</button>
          <button className="btn-icon-sm" onClick={handlePreview} title="Preview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button className="btn-icon-sm" onClick={() => handleDownload()} title="Download">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button className="btn-icon-sm btn-danger-sm" onClick={handleDelete} disabled={deleting} title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6m4-6v6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-card ${deleting ? 'file-deleting' : ''}`} onClick={handlePreview}>
      <div className="file-card-preview">
        {effectiveCategory === 'image' && thumbUrl ? (
          <img
            src={thumbUrl}
            alt={file.name}
            className="file-preview-img"
          />
        ) : null}
        <div className="file-preview-icon" style={{ display: effectiveCategory === 'image' && thumbUrl ? 'none' : 'flex' }}>
          <span className="file-emoji">{getFileIcon(file.mimetype, effectiveCategory, file.name)}</span>
          <span className={`category-badge cat-${effectiveCategory}`}>{effectiveCategory}</span>
        </div>
        <button
          className={`btn-star-float ${isStarred ? 'starred' : ''}`}
          onClick={handleStar}
          disabled={starring}
        >★</button>
        <div className="file-card-menu">
          <button
            className="btn-menu"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >⋯</button>
          {showMenu && (
            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={handlePreview}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </button>
              <button onClick={() => handleDownload()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
              <button className="danger" onClick={handleDelete}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="file-card-body">
        <p className="file-card-name" title={file.name}>{file.name}</p>
        <div className="file-card-meta">
          <span>{formatBytes(file.size)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
        {file.tags?.length > 0 && (
          <div className="file-tags">
            {file.tags.slice(0, 3).map((t) => <span key={t} className="file-tag">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
