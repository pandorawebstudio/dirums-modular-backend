import sanitizeHtml from 'sanitize-html';
import xss from 'xss';

export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  
  // Sanitize HTML content
  value = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  });
  
  // Prevent XSS
  value = xss(value);
  
  return value;
}

export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeInput(value);
  }

  return sanitized;
}

export function validateFileType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size, maxSize) {
  return size <= maxSize;
}