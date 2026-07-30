import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FileCard from '../components/FileCard';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import PreviewModal from '../components/PreviewModal';
import { CATEGORY_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Files() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const folderId = params.get('folder');
  const categoryFilter = params.get('category') || 'all';
  const isStarred = params.get('starred') === 'true';

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [total, setTotal] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fileQuery = new URLSearchParams();
      if (folderId) fileQuery.set('folder', folderId);
      else fileQuery.set('folder', 'root');
      if (categoryFilter && categoryFilter !== 'all') fileQuery.set('category', categoryFilter);
      if (isStarred) fileQuery.set('starred', 'true');
      if (search) fileQuery.set('search', search);
      fileQuery.set('limit', '100');

      const promises = [api.get(`/files?${fileQuery}`)];

      if (!categoryFilter || categoryFilter === 'all') {
        const folderQuery = folderId ? `parent=${folderId}` : 'parent=root';
        promises.push(api.get(`/folders?${folderQuery}`));
      } else {
        promises.push(Promise.resolve({ data: { folders: [] } }));
      }

      if (folderId) {
        promises.push(api.get(`/folders/${folderId}`));
        promises.push(api.get(`/folders/${folderId}/breadcrumb`));
      }

      const [filesRes, foldersRes, folderRes, breadcrumbRes] = await Promise.all(promises);
      setFiles(filesRes.data.files);
      setTotal(filesRes.data.total);
      setFolders(foldersRes.data.folders || []);
      if (folderRes) setCurrentFolder(folderRes.data.folder);
      else setCurrentFolder(null);
      if (breadcrumbRes) setBreadcrumb(breadcrumbRes.data.breadcrumb);
      else setBreadcrumb([]);
    } catch (err) {
      console.error('Files load error:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, categoryFilter, isStarred, search]);

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"? It must be empty.`)) return;
    try {
      await api.delete(`/folders/${folder._id}`);
      toast.success('Folder deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const pageTitle = isStarred ? '⭐ Starred Files'
    : categoryFilter !== 'all' ? CATEGORY_LABELS[categoryFilter]
    : currentFolder ? `📁 ${currentFolder.name}`
    : 'All Files';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          {breadcrumb.length > 0 && (
            <div className="breadcrumb">
              <button className="breadcrumb-item" onClick={() => navigate('/files')}>Root</button>
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b._id}>
                  <span className="breadcrumb-sep">/</span>
                  <button
                    className={`breadcrumb-item ${i === breadcrumb.length - 1 ? 'active' : ''}`}
                    onClick={() => navigate(`/files?folder=${b._id}`)}
                  >{b.name}</button>
                </React.Fragment>
              ))}
            </div>
          )}
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
            Upload
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="files-toolbar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="toolbar-right">
          <span className="file-count">{total} item{total !== 1 ? 's' : ''}</span>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading files...</p>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="files-section">
              <h3 className="files-section-title">Folders</h3>
              <div className="folders-grid">
                {folders.map((folder) => (
                  <div key={folder._id} className="folder-card" >
                    <div className="folder-card-main" onClick={() => navigate(`/files?folder=${folder._id}`)}>
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
                    <button className="folder-delete-btn" onClick={() => handleDeleteFolder(folder)} title="Delete folder">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 ? (
            <div className="files-section">
              {folders.length > 0 && <h3 className="files-section-title">Files</h3>}
              {viewMode === 'grid' ? (
                <div className="files-grid">
                  {files.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      viewMode="grid"
                      onDelete={(id) => setFiles((prev) => prev.filter((f) => f._id !== id))}
                      onUpdate={(updated) => setFiles((prev) => prev.map((f) => f._id === updated._id ? updated : f))}
                      onPreview={setPreviewFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="files-list">
                  <div className="files-list-header">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Date</span>
                    <span>Type</span>
                    <span>Actions</span>
                  </div>
                  {files.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      viewMode="list"
                      onDelete={(id) => setFiles((prev) => prev.filter((f) => f._id !== id))}
                      onUpdate={(updated) => setFiles((prev) => prev.map((f) => f._id === updated._id ? updated : f))}
                      onPreview={setPreviewFile}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            folders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No files here yet</h3>
                <p>{search ? `No results for "${search}"` : 'Upload files to get started'}</p>
                {!search && (
                  <button className="btn-primary" onClick={() => setShowUpload(true)}>
                    Upload Your First File
                  </button>
                )}
              </div>
            )
          )}
        </>
      )}

      {showUpload && (
        <UploadModal
          folderId={folderId}
          folderName={currentFolder?.name}
          onClose={() => setShowUpload(false)}
          onSuccess={loadData}
        />
      )}
      {showCreateFolder && (
        <CreateFolderModal
          parentId={folderId}
          parentName={currentFolder?.name}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={loadData}
        />
      )}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
