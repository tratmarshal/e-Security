/**
 * e-Security - API Client
 * Uses Fetch API with application/x-www-form-urlencoded to avoid CORS preflight
 */

/**
 * Call the backend API with retry logic
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
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    // Use the provided signal or the controller's signal
    const combinedSignal = signal || controller.signal;

    // Convert to URLSearchParams to avoid preflight CORS
    const formData = new URLSearchParams();
    formData.append('fn', fn);
    formData.append('payload', JSON.stringify(payload));

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: combinedSignal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // AbortError - don't retry
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after ' + CONFIG.API_TIMEOUT + 'ms');
    }

    // Network error - retry if under maxRetries
    const isRetryable = error.message.includes('Failed to fetch') ||
                        error.message.includes('NetworkError') ||
                        error.message.includes('network') ||
                        error.message.includes('HTTP') ||
                        error.message.includes('timeout');

    if (isRetryable && retryCount < maxRetries) {
      console.log(`Retry ${retryCount + 1}/${maxRetries} for ${fn}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.API_RETRY_DELAY * (retryCount + 1)));
      return callApi(fn, payload, signal, retryCount + 1);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Verify a user by LINE User ID
 */
async function verifyUserApi(lineUserId, signal) {
  if (!lineUserId || !isValidString(lineUserId)) {
    throw new Error('LINE User ID is required');
  }
  return callApi('verifyUser', { lineUserId }, signal);
}

/**
 * Save a duty record
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