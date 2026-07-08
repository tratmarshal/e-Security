/**
 * e-Security - API Client
 * Handles all backend communication with retry, timeout, and abort.
 */

/**
 * Call the backend API with retry logic.
 * @param {string} fn - Function name to call
 * @param {Object} payload - Payload data
 * @param {AbortSignal} signal - AbortSignal from AbortController
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response
 */
async function callApi(fn, payload, signal, retryCount) {
  retryCount = retryCount || 0;
  const maxRetries = CONFIG.API_RETRY_COUNT || 2;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    // Use the provided signal if available, otherwise use the controller's signal
    const combinedSignal = signal || controller.signal;

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fn, payload }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // AbortError - don't retry, just propagate
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after ' + CONFIG.API_TIMEOUT + 'ms');
    }

    // Network error - retry if under maxRetries
    const isNetworkError = error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('network') ||
      error.message.includes('HTTP') ||
      error.message.includes('timeout');

    if (isNetworkError && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.API_RETRY_DELAY));
      return callApi(fn, payload, signal, retryCount + 1);
    }

    // Re-throw other errors or after max retries
    throw error;
  }
}

/**
 * Verify a user by LINE User ID.
 * @param {string} lineUserId - LINE User ID
 * @param {AbortSignal} signal - AbortSignal
 * @returns {Promise<Object>} { success, name?, employeeId?, message? }
 */
async function verifyUserApi(lineUserId, signal) {
  if (!lineUserId || !isValidString(lineUserId)) {
    throw new Error('LINE User ID is required');
  }
  return callApi('verifyUser', { lineUserId }, signal);
}

/**
 * Save a duty record.
 * @param {Object} data - { lineUserId, shift, dutyPoint, note }
 * @param {AbortSignal} signal - AbortSignal
 * @returns {Promise<Object>} { success, message? }
 */
async function saveDutyApi(data, signal) {
  const { lineUserId, shift, dutyPoint, note } = data;

  if (!lineUserId || !isValidString(lineUserId)) {
    throw new Error('LINE User ID is required');
  }
  if (!shift || !isValidString(shift)) {
    throw new Error('Shift is required');
  }
  if (!dutyPoint || !isValidString(dutyPoint)) {
    throw new Error('Duty point is required');
  }

  return callApi('saveDuty', {
    lineUserId: lineUserId.trim(),
    shift: shift.trim(),
    dutyPoint: dutyPoint.trim(),
    note: note ? note.trim() : ''
  }, signal);
}