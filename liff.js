/**
 * e-Security - LIFF Integration
 * Handles LIFF initialization, login, and user ID retrieval.
 */

/**
 * Initialize LIFF and get user profile.
 * @returns {Promise<Object>} { lineUserId, displayName?, pictureUrl? }
 */
async function initLiff() {
  try {
    // 1. Initialize LIFF
    await liff.init({
      liffId: CONFIG.LIFF_ID,
    });

    // 2. Check if logged in, if not, trigger login
    if (!liff.isLoggedIn()) {
      liff.login();
      // After login, page will reload, so this function won't continue
      return null;
    }

    // 3. Get profile (for display name, but we only need userId for verification)
    const profile = await liff.getProfile();
    const lineUserId = profile.userId;

    // 4. Get access token for additional info if needed (not required for this flow)
    // const accessToken = liff.getAccessToken();

    return {
      lineUserId: lineUserId,
      displayName: profile.displayName || '',
      pictureUrl: profile.pictureUrl || '',
    };
  } catch (error) {
    console.error('LIFF init error:', error);
    throw new Error('ไม่สามารถเชื่อมต่อกับ LINE: ' + error.message);
  }
}

/**
 * Log out from LIFF.
 */
function logoutLiff() {
  if (liff && liff.isLoggedIn()) {
    liff.logout();
  }
}

/**
 * Check if LIFF is initialized and ready.
 * @returns {boolean} True if ready
 */
function isLiffReady() {
  return liff && typeof liff.isLoggedIn === 'function';
}