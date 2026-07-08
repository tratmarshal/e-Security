/**
 * e-Security - Main Application Logic
 * Orchestrates LIFF, API, UI, and user flow.
 */

// ============================================================================
// DOM References
// ============================================================================

const DOM = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  userInfoSection: document.getElementById('userInfoSection'),
  unauthorizedSection: document.getElementById('unauthorizedSection'),
  dutyForm: document.getElementById('dutyForm'),
  userName: document.getElementById('userName'),
  userEmployeeId: document.getElementById('userEmployeeId'),
  shiftToggle: document.getElementById('shiftToggle'),
  shiftInput: document.getElementById('shiftInput'),
  dutyPointSelect: document.getElementById('dutyPointSelect'),
  noteInput: document.getElementById('noteInput'),
  submitBtn: document.getElementById('submitBtn'),
  dutyPointError: document.getElementById('dutyPointError'),
};

// ============================================================================
// State
// ============================================================================

let appState = {
  lineUserId: null,
  userName: null,
  employeeId: null,
  isVerified: false,
  isSubmitting: false,
  currentShift: 'กลางวัน',
  abortController: null,
};

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Populate duty points dropdown from config.
 */
function populateDutyPoints() {
  const select = DOM.dutyPointSelect;
  // Clear existing options except the first placeholder
  while (select.options.length > 1) {
    select.remove(1);
  }

  CONFIG.DUTY_POINTS.forEach((point) => {
    const option = document.createElement('option');
    option.value = point;
    option.textContent = point;
    select.appendChild(option);
  });
}

/**
 * Show user info in the UI.
 * @param {string} name - User's full name
 * @param {string} employeeId - User's employee ID
 */
function showUserInfo(name, employeeId) {
  DOM.userName.textContent = escapeHtml(name) || 'ไม่ระบุชื่อ';
  DOM.userEmployeeId.textContent = 'รหัส: ' + (escapeHtml(employeeId) || '-');
  DOM.userInfoSection.style.display = 'block';
  DOM.unauthorizedSection.style.display = 'none';
  DOM.dutyForm.style.display = 'block';
  appState.isVerified = true;
}

/**
 * Show unauthorized message.
 */
function showUnauthorized() {
  DOM.userInfoSection.style.display = 'none';
  DOM.unauthorizedSection.style.display = 'block';
  DOM.dutyForm.style.display = 'none';
  appState.isVerified = false;
}

/**
 * Reset the form to default state.
 */
function resetForm() {
  // Reset shift to default (กลางวัน)
  setShift('กลางวัน');
  DOM.dutyPointSelect.value = '';
  DOM.noteInput.value = '';
  DOM.dutyPointError.textContent = '';
  DOM.submitBtn.disabled = false;
  DOM.submitBtn.querySelector('.btn-text').textContent = 'บันทึกข้อมูล';
  DOM.submitBtn.querySelector('.btn-spinner').style.display = 'none';
  appState.isSubmitting = false;
}

/**
 * Set the shift toggle state.
 * @param {string} shift - 'กลางวัน' or 'กลางคืน'
 */
function setShift(shift) {
  const buttons = DOM.shiftToggle.querySelectorAll('.toggle-btn');
  buttons.forEach((btn) => {
    const value = btn.getAttribute('data-value');
    if (value === shift) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  DOM.shiftInput.value = shift;
  appState.currentShift = shift;
}

/**
 * Show form validation error for duty point.
 * @param {string} message - Error message
 */
function showDutyPointError(message) {
  DOM.dutyPointError.textContent = message || '';
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle shift toggle click.
 */
function onShiftToggleClick(e) {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  if (btn.classList.contains('active')) return;

  const shift = btn.getAttribute('data-value');
  setShift(shift);
}

/**
 * Handle form submission.
 */
async function onFormSubmit(e) {
  e.preventDefault();

  // Prevent double submission
  if (appState.isSubmitting) return;

  // Validate: duty point selected
  const dutyPoint = DOM.dutyPointSelect.value;
  if (!dutyPoint || dutyPoint === '') {
    showDutyPointError('กรุณาเลือกจุดประจำการ');
    DOM.dutyPointSelect.focus();
    return;
  }
  showDutyPointError('');

  // Show confirmation dialog
  const confirmed = await showConfirmDialog(
    'ยืนยันการบันทึกข้อมูล',
    'คุณต้องการบันทึกข้อมูลการลงเวลาปฏิบัติงานใช่หรือไม่?',
    'ยืนยัน',
    'ยกเลิก'
  );

  if (!confirmed) return;

  // --- Submit ---
  appState.isSubmitting = true;
  DOM.submitBtn.disabled = true;
  DOM.submitBtn.querySelector('.btn-text').textContent = 'กำลังบันทึก...';
  DOM.submitBtn.querySelector('.btn-spinner').style.display = 'inline-block';

  // Cancel any pending request
  if (appState.abortController) {
    appState.abortController.abort();
  }
  appState.abortController = new AbortController();

  try {
    const result = await saveDutyApi({
      lineUserId: appState.lineUserId,
      shift: appState.currentShift,
      dutyPoint: dutyPoint,
      note: DOM.noteInput.value,
    }, appState.abortController.signal);

    if (result.success) {
      await showSuccessAlert('บันทึกข้อมูลเรียบร้อย', 'บันทึกการลงเวลาปฏิบัติงานสำเร็จ');
      resetForm();
    } else {
      await showErrorAlert('บันทึกไม่สำเร็จ', result.message || 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
    }
  } catch (error) {
    console.error('Submit error:', error);
    // Don't show error if it was aborted
    if (error.name !== 'AbortError') {
      await showErrorAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  } finally {
    appState.isSubmitting = false;
    DOM.submitBtn.disabled = false;
    DOM.submitBtn.querySelector('.btn-text').textContent = 'บันทึกข้อมูล';
    DOM.submitBtn.querySelector('.btn-spinner').style.display = 'none';
    appState.abortController = null;
  }
}

// ============================================================================
// Main Initialization
// ============================================================================

/**
 * Main app initialization.
 */
async function initApp() {
  // Show loading
  showLoading('กำลังเชื่อมต่อกับ LINE...');

  try {
    // 1. Initialize LIFF
    const liffResult = await initLiff();

    // If login was triggered, page will reload
    if (!liffResult) {
      hideLoading();
      return;
    }

    const { lineUserId } = liffResult;
    if (!lineUserId) {
      throw new Error('ไม่สามารถรับ LINE User ID');
    }

    appState.lineUserId = lineUserId;

    // 2. Verify user with backend
    showLoading('กำลังตรวจสอบผู้ใช้งาน...');

    // Cancel any pending request
    if (appState.abortController) {
      appState.abortController.abort();
    }
    appState.abortController = new AbortController();

    const verifyResult = await verifyUserApi(lineUserId, appState.abortController.signal);

    if (verifyResult.success) {
      appState.userName = verifyResult.name || '';
      appState.employeeId = verifyResult.employeeId || '';
      showUserInfo(appState.userName, appState.employeeId);
    } else {
      showUnauthorized();
      await showErrorAlert('ไม่พบผู้ใช้งาน', verifyResult.message || 'ยังไม่ได้ลงทะเบียนในระบบ');
    }

    // 3. Populate duty points
    populateDutyPoints();

    // 4. Setup event listeners
    setupEventListeners();

  } catch (error) {
    console.error('App init error:', error);
    if (error.name !== 'AbortError') {
      await showErrorAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถเริ่มต้นระบบได้');
    }
  } finally {
    hideLoading();
    appState.abortController = null;
  }
}

/**
 * Setup all event listeners.
 */
function setupEventListeners() {
  // Shift toggle
  DOM.shiftToggle.addEventListener('click', onShiftToggleClick);

  // Form submit
  DOM.dutyForm.addEventListener('submit', onFormSubmit);

  // Clear error on select change
  DOM.dutyPointSelect.addEventListener('change', function () {
    if (this.value && this.value !== '') {
      showDutyPointError('');
    }
  });
}

// ============================================================================
// Start the app when DOM is ready
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Check if LIFF SDK is loaded
  if (typeof liff === 'undefined') {
    console.error('LIFF SDK not loaded');
    document.querySelector('.app-header h1').textContent = '⚠️ ข้อผิดพลาด';
    return;
  }

  // Start the app
  initApp().catch((err) => {
    console.error('Unhandled error in initApp:', err);
    hideLoading();
    showErrorAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ' + err.message);
  });
});