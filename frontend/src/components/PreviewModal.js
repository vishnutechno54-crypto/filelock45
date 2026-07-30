import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getFileCategory } from '../utils/helpers';
import '../styles/PreviewModal.css';

export default function PreviewModal({ file, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [content, setContent] = useState(null);
  const fileName = (file?.originalName || file?.name || '').toLowerCase();
  const effectiveCategory = getFileCategory(file.mimetype, file.originalName || file.name);
  const isTextLike = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.sql', '.sh', '.yaml', '.yml'].some((ext) => fileName.endsWith(ext));
  const isPdf = fileName.endsWith('.pdf') || file?.mimetype === 'application/pdf';
  const isPreviewableDocument = effectiveCategory === 'document' && isPdf;
  const isPreviewableMedia = ['image', 'video', 'audio'].includes(effectiveCategory);
  const shouldPreviewAsText = isTextLike || (effectiveCategory === 'code' && file.mimetype.startsWith('text/'));
  const isPreviewSupported = shouldPreviewAsText || isPreviewableDocument || isPreviewableMedia;

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        setContent(null);
        setBlobUrl(null);

        if (!isPreviewSupported) {
          return;
        }

        if (shouldPreviewAsText) {
          const response = await api.get(`/files/${file._id}/preview`, { responseType: 'blob' });
          const text = await response.data.text();
          setContent(text);
          return;
        }

        const response = await api.get(`/files/${file._id}/preview`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(response.data);
        setBlobUrl(url);
      } catch (err) {
        console.error('Preview error:', err);
        setError('Failed to load preview');
        toast.error('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file._id]);

  const handleDownload = async () => {
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

  const handleOpenFile = async () => {
    try {
      const response = await api.get(`/files/${file._id}/preview`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: file.mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Unable to open file. Please download instead.');
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="preview-loading">
          <div className="spinner"></div>
          <p>Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="preview-error">
          <p>{error}</p>
          <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            This file type cannot be previewed. Please download it to view.
          </p>
          <button className="btn-primary" onClick={handleOpenFile}>
            Open file in new tab
          </button>
        </div>
      );
    }

    if (content) {
      return (
        <div className="preview-text">
          <pre>{content}</pre>
        </div>
      );
    }

    if (blobUrl) {
      switch (effectiveCategory) {
        case 'image':
          return (
            <div className="preview-image">
              <img src={blobUrl} alt={file.name} />
            </div>
          );
        case 'video':
          return (
            <div className="preview-video">
              <video controls autoPlay>
                <source src={blobUrl} type={file.mimetype} />
                Your browser does not support the video tag.
              </video>
            </div>
          );
        case 'audio':
          return (
            <div className="preview-audio">
              <audio controls autoPlay>
                <source src={blobUrl} type={file.mimetype} />
                Your browser does not support the audio element.
              </audio>
            </div>
          );
        case 'document':
          if (isPdf) {
            return (
              <div className="preview-document">
                <iframe title="document-preview" src={blobUrl} />
              </div>
            );
          }
          break;
        default:
          break;
      }
    }

    return (
      <div className="preview-error">
        <p>This file cannot be previewed directly in the browser.</p>
        <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
          Please download the file to view it in an app that supports its format.
        </p>
      </div>
    );
  };

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            <h3>{file.name}</h3>
            <span className={`badge badge-${effectiveCategory}`}>{effectiveCategory}</span>
          </div>
          <div className="preview-actions">
            <button className="btn-preview-action" onClick={handleDownload} title="Download">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button className="btn-preview-close" onClick={onClose} title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="preview-content">
          {renderPreview()}
        </div>
        <div className="preview-footer">
          <span className="preview-info">
            {file.size && `Size: ${(file.size / 1024).toFixed(1)} KB`}
          </span>
        </div>
      </div>
    </div>
  );
}
