/**
 * e-Security - API Client
 * Uses google.script.run for direct communication with Google Apps Script
 * No CORS issues when used within the same project
 */

/**
 * Call backend function using google.script.run
 * @param {string} fn - Function name to call
 * @param {Object} payload - Payload data
 * @param {AbortController} controller - AbortController for timeout
 * @returns {Promise<Object>} API response
 */
function callApi(fn, payload, controller) {
  return new Promise((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
      reject(new Error('Request timed out after ' + CONFIG.API_TIMEOUT + 'ms'));
    }, CONFIG.API_TIMEOUT);

    // Handle abort signal
    if (controller && controller.signal) {
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Request aborted'));
      });
    }

    try {
      // Use google.script.run
      google.script.run
        .withSuccessHandler((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .withFailureHandler((error) => {
          clearTimeout(timeoutId);
          reject(new Error(error.message || 'Script execution failed'));
        })
        .withUserObject(null)
        [fn](payload);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(new Error('Failed to call script: ' + error.message));
    }
  });
}

/**
 * Call with retry logic
 */
async function callApiWithRetry(fn, payload, controller, retryCount) {
  retryCount = retryCount || 0;
  const maxRetries = CONFIG.API_RETRY_COUNT || 2;

  try {
    return await callApi(fn, payload, controller);
  } catch (error) {
    // Retry on network errors
    const isRetryable = error.message.includes('Failed to fetch') ||
                        error.message.includes('timeout') ||
                        error.message.includes('network');

    if (isRetryable && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.API_RETRY_DELAY));
      return callApiWithRetry(fn, payload, controller, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Verify a user by LINE User ID.
 */
async function verifyUserApi(lineUserId, controller) {
  if (!lineUserId || !isValidString(lineUserId)) {
    throw new Error('LINE User ID is required');
  }
  return callApiWithRetry('verifyUser', { lineUserId }, controller);
}

/**
 * Save a duty record.
 */
async function saveDutyApi(data, controller) {
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

  return callApiWithRetry('saveDuty', {
    lineUserId: lineUserId.trim(),
    shift: shift.trim(),
    dutyPoint: dutyPoint.trim(),
    note: note ? note.trim() : ''
  }, controller);
}