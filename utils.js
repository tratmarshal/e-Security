/**
 * e-Security - Utility Functions
 * Pure helper functions, no side effects.
 */

/**
 * Escape HTML to prevent XSS.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(str).replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

/**
 * Sanitize input string - removes extra whitespace and trims.
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Validate that a string is not empty after trimming.
 * @param {string} str - Input string
 * @returns {boolean} True if valid
 */
function isValidString(str) {
  return str && typeof str === 'string' && str.trim().length > 0;
}

/**
 * Format date for display.
 * @param {Date} date - Date object
 * @returns {string} Formatted date (dd/MM/yyyy)
 */
function formatDateDisplay(date) {
  const d = date || new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

/**
 * Format time for display.
 * @param {Date} date - Date object
 * @returns {string} Formatted time (HH:mm:ss)
 */
function formatTimeDisplay(date) {
  const d = date || new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds;
}

/**
 * Show a loading overlay.
 * @param {string} message - Loading message
 */
function showLoading(message) {
  const overlay = document.getElementById('loadingOverlay');
  const text = overlay.querySelector('.loading-text');
  if (text) text.textContent = message || 'กำลังโหลด...';
  overlay.classList.add('active');
}

/**
 * Hide loading overlay.
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('active');
}

/**
 * Simple debounce function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}