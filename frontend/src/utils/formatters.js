import dayjs from 'dayjs';

export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (value) => {
  if (!value) return '-';
  return dayjs(value).format('MMM D, YYYY');
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};

export const detectFileType = (name = '') => {
  const value = name.toLowerCase();
  if (value.endsWith('.pdf')) return 'PDF';
  if (value.endsWith('.doc') || value.endsWith('.docx')) return 'DOC';
  if (value.endsWith('.ppt') || value.endsWith('.pptx')) return 'PPT';
  if (value.endsWith('.xls') || value.endsWith('.xlsx')) return 'XLS';
  if (value.endsWith('.zip') || value.endsWith('.rar') || value.endsWith('.7z')) return 'ZIP';
  if (value.endsWith('.mp4') || value.endsWith('.mov')) return 'VID';
  return 'FILE';
};
