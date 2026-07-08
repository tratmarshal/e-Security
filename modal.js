/**
 * e-Security - Modal / Dialog Utilities
 * Uses SweetAlert2 for all modals and confirmations.
 */

/**
 * Show a success alert.
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise}
 */
function showSuccessAlert(title, message) {
  return Swal.fire({
    icon: 'success',
    title: title || 'สำเร็จ',
    text: message || 'ดำเนินการเรียบร้อย',
    confirmButtonText: 'ตกลง',
    timer: 3000,
    timerProgressBar: true,
  });
}

/**
 * Show an error alert.
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise}
 */
function showErrorAlert(title, message) {
  return Swal.fire({
    icon: 'error',
    title: title || 'เกิดข้อผิดพลาด',
    text: message || 'กรุณาลองใหม่อีกครั้ง',
    confirmButtonText: 'ตกลง',
  });
}

/**
 * Show a warning/info alert.
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise}
 */
function showInfoAlert(title, message) {
  return Swal.fire({
    icon: 'info',
    title: title || 'แจ้งเตือน',
    text: message || '',
    confirmButtonText: 'ตกลง',
  });
}

/**
 * Show a confirmation dialog.
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @returns {Promise<boolean>} True if confirmed
 */
async function showConfirmDialog(title, message, confirmText, cancelText) {
  const result = await Swal.fire({
    icon: 'question',
    title: title || 'ยืนยัน',
    text: message || 'คุณต้องการดำเนินการนี้ใช่หรือไม่?',
    showCancelButton: true,
    confirmButtonText: confirmText || 'ยืนยัน',
    cancelButtonText: cancelText || 'ยกเลิก',
    confirmButtonColor: '#1a73e8',
    cancelButtonColor: '#5f6368',
    reverseButtons: true,
  });
  return result.isConfirmed;
}

/**
 * Show a custom alert with HTML content.
 * @param {Object} options - SweetAlert2 options
 * @returns {Promise}
 */
function showCustomAlert(options) {
  return Swal.fire(options);
}