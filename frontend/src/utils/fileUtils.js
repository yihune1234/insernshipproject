export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const ALLOWED_CSV_TYPES = ['text/csv', 'application/vnd.ms-excel'];

export const validateFile = (file, allowedTypes = ALLOWED_DOCUMENT_TYPES, maxSize = MAX_FILE_SIZE) => {
  if (!allowedTypes.includes(file.type)) {
    return `File type not allowed. Accepted: ${allowedTypes.join(', ')}`;
  }
  if (file.size > maxSize) {
    return `File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
  }
  return null;
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
