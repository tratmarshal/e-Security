/**
 * e-Security - Main Application Logic
 */

// ============================================================================
// DOM References
// ============================================================================

function getDOM() {
  return {
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
}

// ============================================================================
// State
// ============================================================================

let state = {
  lineUserId: null,
  userName: null,
  employeeId: null,
  isVerified: false,
  isSubmitting: false,
  currentShift: 'กลางวัน',
  abortController: null,
  dom: null,
};

// ============================================================================
// UI Functions
// ============================================================================

function populateDutyPoints() {
  const select = state.dom.dutyPointSelect;
  if (!select) return;
  
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

function showUserInfo(name, employeeId) {
  const d = state.dom;
  if (!d) return;
  
  if (d.userName) d.userName.textContent = escapeHtml(name) || 'ไม่ระบุชื่อ';
  if (d.userEmployeeId) d.userEmployeeId.textContent = 'รหัส: ' + (escapeHtml(employeeId) || '-');
  if (d.userInfoSection) d.userInfoSection.style.display = 'block';
  if (d.unauthorizedSection) d.unauthorizedSection.style.display = 'none';
  if (d.dutyForm) d.dutyForm.style.display = 'block';
  
  state.isVerified = true;
}

function showUnauthorized() {
  const d = state.dom;
  if (!d) return;
  
  if (d.userInfoSection) d.userInfoSection.style.display = 'none';
  if (d.unauthorizedSection) d.unauthorizedSection.style.display = 'block';
  if (d.dutyForm) d.dutyForm.style.display = 'none';
  
  state.isVerified = false;
}

function resetForm() {
  const d = state.dom;
  if (!d) return;
  
  setShift('กลางวัน');
  if (d.dutyPointSelect) d.dutyPointSelect.value = '';
  if (d.noteInput) d.noteInput.value = '';
  if (d.dutyPointError) d.dutyPointError.textContent = '';
  if (d.submitBtn) {
    d.submitBtn.disabled = false;
    const btnText = d.submitBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'บันทึกข้อมูล';
    const spinner = d.submitBtn.querySelector('.btn-spinner');
    if (spinner) spinner.style.display = 'none';
  }
  state.isSubmitting = false;
}

function setShift(shift) {
  const d = state.dom;
  if (!d || !d.shiftToggle) return;
  
  const buttons = d.shiftToggle.querySelectorAll('.toggle-btn');
  buttons.forEach((btn) => {
    const value = btn.getAttribute('data-value');
    btn.classList.toggle('active', value === shift);
  });
  if (d.shiftInput) d.shiftInput.value = shift;
  state.currentShift = shift;
}

function showDutyPointError(message) {
  const d = state.dom;
  if (d && d.dutyPointError) {
    d.dutyPointError.textContent = message || '';
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function onShiftToggleClick(e) {
  const btn = e.target.closest('.toggle-btn');
  if (!btn || btn.classList.contains('active')) return;
  setShift(btn.getAttribute('data-value'));
}

async function onFormSubmit(e) {
  e.preventDefault();

  if (state.isSubmitting) return;

  const d = state.dom;
  if (!d || !d.dutyPointSelect) return;

  const dutyPoint = d.dutyPointSelect.value;
  if (!dutyPoint || dutyPoint === '') {
    showDutyPointError('กรุณาเลือกจุดประจำการ');
    d.dutyPointSelect.focus();
    return;
  }
  showDutyPointError('');

  const confirmed = await showConfirmDialog(
    'ยืนยันการบันทึกข้อมูล',
    'คุณต้องการบันทึกข้อมูลการลงเวลาปฏิบัติงานใช่หรือไม่?',
    'ยืนยัน',
    'ยกเลิก'
  );

  if (!confirmed) return;

  // Submit
  state.isSubmitting = true;
  if (d.submitBtn) {
    d.submitBtn.disabled = true;
    const btnText = d.submitBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'กำลังบันทึก...';
    const spinner = d.submitBtn.querySelector('.btn-spinner');
    if (spinner) spinner.style.display = 'inline-block';
  }

  if (state.abortController) {
    state.abortController.abort();
  }
  state.abortController = new AbortController();

  try {
    const note = d.noteInput ? d.noteInput.value : '';
    const result = await saveDutyApi({
      lineUserId: state.lineUserId,
      shift: state.currentShift,
      dutyPoint: dutyPoint,
      note: note,
    }, state.abortController.signal);

    if (result.success) {
      await showSuccessAlert('บันทึกข้อมูลเรียบร้อย', 'บันทึกการลงเวลาปฏิบัติงานสำเร็จ');
      resetForm();
    } else {
      await showErrorAlert('บันทึกไม่สำเร็จ', result.message || 'เกิดข้อผิดพลาด');
    }
  } catch (error) {
    console.error('Submit error:', error);
    if (error.name !== 'AbortError') {
      await showErrorAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  } finally {
    state.isSubmitting = false;
    if (d.submitBtn) {
      d.submitBtn.disabled = false;
      const btnText = d.submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'บันทึกข้อมูล';
      const spinner = d.submitBtn.querySelector('.btn-spinner');
      if (spinner) spinner.style.display = 'none';
    }
    state.abortController = null;
  }
}

// ============================================================================
// Main Initialization
// ============================================================================

async function initApp() {
  state.dom = getDOM();
  
  if (!state.dom.loadingOverlay) {
    console.error('Critical: loadingOverlay not found');
  }
  
  showLoading('กำลังเชื่อมต่อกับ LINE...');

  try {
    // 1. Initialize LIFF
    const liffResult = await initLiff();

    if (!liffResult) {
      hideLoading();
      return;
    }

    const { lineUserId } = liffResult;
    if (!lineUserId) {
      throw new Error('ไม่สามารถรับ LINE User ID');
    }

    state.lineUserId = lineUserId;

    // 2. Verify user
    showLoading('กำลังตรวจสอบผู้ใช้งาน...');

    if (state.abortController) {
      state.abortController.abort();
    }
    state.abortController = new AbortController();

    const verifyResult = await verifyUserApi(lineUserId, state.abortController.signal);

    if (verifyResult.success) {
      state.userName = verifyResult.name || '';
      state.employeeId = verifyResult.employeeId || '';
      showUserInfo(state.userName, state.employeeId);
    } else {
      showUnauthorized();
      await showErrorAlert('ไม่พบผู้ใช้งาน', verifyResult.message || 'ยังไม่ได้ลงทะเบียน');
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
    state.abortController = null;
  }
}

function setupEventListeners() {
  const d = state.dom;
  if (!d) return;

  if (d.shiftToggle) {
    d.shiftToggle.addEventListener('click', onShiftToggleClick);
  }

  if (d.dutyForm) {
    d.dutyForm.addEventListener('submit', onFormSubmit);
  }

  if (d.dutyPointSelect) {
    d.dutyPointSelect.addEventListener('change', function () {
      if (this.value && this.value !== '') {
        showDutyPointError('');
      }
    });
  }
}

// Export for debugging
window.initApp = initApp;