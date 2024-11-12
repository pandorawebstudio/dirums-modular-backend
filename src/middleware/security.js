import sanitizeHtml from 'sanitize-html';
import xss from 'xss';
import { logger } from '../utils/logger.js';

export function sanitizeInputs(request, reply, done) {
  try {
    if (request.body) {
      request.body = sanitizeObject(request.body);
    }
    if (request.query) {
      request.query = sanitizeObject(request.query);
    }
    if (request.params) {
      request.params = sanitizeObject(request.params);
    }
    done();
  } catch (error) {
    logger.error(`Input sanitization error: ${error.message}`);
    reply.code(400).send({ error: 'Invalid input' });
  }
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Sanitize HTML content
    value = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {}
    });
    // Prevent XSS
    value = xss(value);
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }

  return value;
}