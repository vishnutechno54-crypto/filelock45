import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#06b6d4', '#84cc16'];
const CATEGORIES = ['general', 'images', 'videos', 'documents', 'audio', 'projects', 'websites', 'archives', 'other'];

export default function CreateFolderModal({ parentId, parentName, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Folder name is required');
    setLoading(true);
    try {
      const { data } = await api.post('/folders', {
        name: name.trim(),
        description,
        parent: parentId || null,
        color,
        category,
      });
      toast.success(`Folder "${data.folder.name}" created`);
      onSuccess?.(data.folder);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal folder-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">New Folder</h2>
            {parentName && <p className="modal-subtitle">Inside: 📁 {parentName}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="folder-form">
          <div className="form-group">
            <label className="form-label">Folder Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter folder name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="folder-preview">
            <div className="folder-icon-preview" style={{ color }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </div>
            <span className="folder-preview-name">{name || 'New Folder'}</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? <span className="btn-loading"><span className="spinner" /> Creating...</span> : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
