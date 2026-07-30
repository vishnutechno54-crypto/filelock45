export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getFileExtension = (filename = '') => {
  const parts = (filename || '').split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const getFileCategory = (mimetype = '', filename = '') => {
  const type = (mimetype || '').toLowerCase();
  const extension = getFileExtension(filename);

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff'].includes(extension)) return 'image';
  if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg'].includes(extension)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) return 'audio';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gzip') || type.includes('7z') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) return 'archive';
  if (
    type.includes('javascript') || type.includes('html') || type.includes('css') || type.includes('json') || type.includes('xml') || type.startsWith('text/') ||
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'md', 'txt', 'json', 'xml', 'html', 'css', 'yaml', 'yml'].includes(extension)
  ) return 'code';
  if (type.includes('pdf') || type.includes('word') || type.includes('excel') || type.includes('powerpoint') || type.includes('document') || type.includes('sheet') || type.includes('presentation') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'document';
  return 'other';
};

export const getFileIcon = (mimetype, category, filename = '') => {
  const name = (filename || '').toLowerCase();
  const ext = name.split('.').pop() || '';

  if (mimetype?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff'].includes(ext)) return '🖼️';
  if (mimetype?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg'].includes(ext)) return '🎬';
  if (mimetype?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return '🎵';
  if (mimetype?.includes('pdf') || ext === 'pdf') return '📕';
  if (mimetype?.includes('word') || mimetype?.includes('document') || ['doc', 'docx'].includes(ext)) return '📝';
  if (mimetype?.includes('excel') || mimetype?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (mimetype?.includes('powerpoint') || mimetype?.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return '📋';
  if (mimetype?.includes('zip') || mimetype?.includes('rar') || mimetype?.includes('tar') || mimetype?.includes('gzip') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '🗜️';
  if (mimetype?.includes('html') || mimetype?.includes('css') || mimetype?.includes('javascript') || mimetype?.includes('json') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'md', 'txt', 'json', 'xml', 'html', 'css', 'yaml', 'yml'].includes(ext)) return '💻';
  if (mimetype?.startsWith('text/')) return '📄';
  return '📁';
};

export const getCategoryColor = (category) => {
  const colors = {
    image: '#10b981',
    video: '#f59e0b',
    audio: '#8b5cf6',
    document: '#3b82f6',
    archive: '#ef4444',
    code: '#06b6d4',
    other: '#6b7280',
  };
  return colors[category] || colors.other;
};

export const CATEGORY_LABELS = {
  all: 'All Files',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  document: 'Documents',
  archive: 'Archives',
  code: 'Code & Web',
  other: 'Other',
};
