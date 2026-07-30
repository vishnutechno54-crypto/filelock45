import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatBytes } from '../utils/helpers';

export default function UploadModal({ folderId, folderName, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((f) => ({ file: f, id: Math.random().toString(36).slice(2) })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 2 * 1024 * 1024 * 1024,
    onDropRejected: (rejected) => {
      rejected.forEach((r) => {
        r.errors.forEach((e) => toast.error(e.message));
      });
    },
  });

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadAll = async () => {
    if (!files.length) return;
    setUploading(true);
    let successCount = 0;

    for (const { file, id } of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folder', folderId);

      try {
        setProgress((p) => ({ ...p, [id]: 0 }));
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setProgress((p) => ({ ...p, [id]: pct }));
          },
        });
        setProgress((p) => ({ ...p, [id]: 100 }));
        successCount++;
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err.response?.data?.message || 'Unknown error'}`);
        setProgress((p) => ({ ...p, [id]: -1 }));
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded!`);
      onSuccess?.();
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !uploading && onClose?.()}>
      <div className="modal upload-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Upload Files</h2>
            {folderName && <p className="modal-subtitle">To: 📁 {folderName}</p>}
          </div>
          <button className="modal-close" onClick={onClose} disabled={uploading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
              </svg>
            </div>
            {isDragActive ? (
              <p className="dropzone-text">Drop your files here!</p>
            ) : (
              <>
                <p className="dropzone-text">Drag & drop files here</p>
                <p className="dropzone-subtext">or click to browse · Max 2GB per file</p>
                <p className="dropzone-types">Images · Videos · Audio · Documents · Archives · Code files</p>
              </>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="upload-list">
            <div className="upload-list-header">
              <span>{files.length} file{files.length > 1 ? 's' : ''} selected</span>
              <span>{formatBytes(files.reduce((a, { file }) => a + file.size, 0))}</span>
            </div>
            <div className="upload-items">
              {files.map(({ file, id }) => (
                <div key={id} className="upload-item">
                  <div className="upload-item-info">
                    <span className="upload-item-name" title={file.name}>{file.name}</span>
                    <span className="upload-item-size">{formatBytes(file.size)}</span>
                  </div>
                  {progress[id] !== undefined ? (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(0, progress[id])}%`,
                            background: progress[id] === -1 ? '#ef4444' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          }}
                        />
                      </div>
                      <span className="progress-text">
                        {progress[id] === -1 ? 'Failed' : progress[id] === 100 ? '✓ Done' : `${progress[id]}%`}
                      </span>
                    </div>
                  ) : (
                    <button className="upload-item-remove" onClick={() => removeFile(id)} disabled={uploading}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button
            className="btn-primary"
            onClick={uploadAll}
            disabled={!files.length || uploading}
          >
            {uploading ? (
              <span className="btn-loading"><span className="spinner" /> Uploading...</span>
            ) : (
              `Upload ${files.length || ''} File${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
