const formatFileType = (mimetype, filename) => {
  const value = `${mimetype} ${filename}`.toLowerCase();
  if (value.includes('pdf')) return 'PDF';
  if (value.includes('word') || value.includes('.doc')) return 'DOC';
  if (value.includes('presentation') || value.includes('.ppt')) return 'PPT';
  if (value.includes('excel') || value.includes('.xls')) return 'XLS';
  if (value.includes('zip') || value.includes('rar') || value.includes('7z')) return 'ZIP';
  if (value.includes('video') || value.includes('.mp4') || value.includes('.mov')) return 'VID';
  if (value.includes('image') || value.includes('.png') || value.includes('.jpg') || value.includes('.jpeg') || value.includes('.gif')) return 'IMG';
  return 'FILE';
};

module.exports = {
  formatFileType
};
