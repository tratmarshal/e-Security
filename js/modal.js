var modal = (function () {
  function showUserInfo(name, employeeId) {
    var nameEsc = escapeHtml(name);
    var idEsc = escapeHtml(employeeId);
    return Swal.fire({
      title: 'ข้อมูลเจ้าหน้าที่',
      html: '<p><strong>ชื่อ-สกุล:</strong> ' + nameEsc + '</p><p><strong>รหัสประจำตัว:</strong> ' + idEsc + '</p>',
      icon: 'info',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false
    });
  }

  function showNotRegistered() {
    return Swal.fire({
      title: 'ยังไม่ได้ลงทะเบียน',
      text: 'กรุณาติดต่อผู้ดูแลระบบ',
      icon: 'error',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false
    });
  }

  /**
   * แสดง Modal ยืนยันข้อมูลก่อนบันทึก (ระบบลงเวลา)
   * @param {Object} data - { employeeId, name, shift, point, note }
   * @returns {Promise} - { isConfirmed: true/false }
   */
  function showConfirmSave(data) {
    var nameEsc = escapeHtml(data.name);
    var idEsc = escapeHtml(data.employeeId);
    var shiftEsc = escapeHtml(data.shift);
    var pointEsc = escapeHtml(data.point);
    var noteEsc = escapeHtml(data.note) || '-';

    var shiftBadgeClass = data.shift === 'กลางวัน'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-indigo-100 text-indigo-700';

    var html = [
      '<div class="text-left space-y-2" style="font-family: \'Sarabun\', sans-serif;">',
      '<div class="flex items-center py-1.5">',
      '<span class="font-bold text-gray-800 text-sm">' + nameEsc + ' (' + idEsc + ')</span>',
      '</div>',
      '<div class="flex items-center space-x-2 py-1.5 border-t border-gray-100">',
      '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + shiftBadgeClass + '">' + shiftEsc + '</span>',
      '<span class="font-semibold text-emerald-700 text-sm">' + pointEsc + '</span>',
      '</div>',
      '<div class="flex items-center py-1.5 border-t border-gray-100">',
      '<span class="text-gray-500 text-sm">หมายเหตุ: </span>',
      '<span class="text-sm text-gray-700 ml-1">' + noteEsc + '</span>',
      '</div>',
      '</div>'
    ].join('');

    return Swal.fire({
      title: 'ตรวจสอบข้อมูล',
      html: html,
      icon: null,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'กลับไปแก้ไข',
      reverseButtons: true,
      confirmButtonColor: '#2ECC71',
      cancelButtonColor: '#94a3b8',
      allowOutsideClick: false,
      customClass: {
        popup: 'rounded-2xl p-4',
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition',
        cancelButton: 'px-6 py-2.5 rounded-xl font-semibold text-sm transition'
      }
    });
  }

  /**
   * แสดง Modal ยืนยันการลา/แทนเวร
   * @param {Object} data - { swapDate, requesterName, substituteName }
   * @returns {Promise} - { isConfirmed: true/false }
   */
  function confirmSwap(data) {
    var displayDate = common.formatDateTH(data.swapDate);
    var dateEsc = escapeHtml(displayDate);
    var nameEsc = escapeHtml(data.requesterName);
    var subEsc = escapeHtml(data.substituteName);

    var html = [
      '<div class="text-left space-y-2" style="font-family: \'Sarabun\', sans-serif;">',
      '<div class="flex items-center py-1.5">',
      '<span class="font-semibold text-gray-600 text-sm">วันที่ลา: </span>',
      '<span class="font-bold text-gray-800 text-sm ml-1">' + dateEsc + '</span>',
      '</div>',
      '<div class="flex items-center py-1.5 border-t border-gray-100">',
      '<span class="font-semibold text-gray-600 text-sm">ผู้ลา: </span>',
      '<span class="font-bold text-gray-800 text-sm ml-1">' + nameEsc + '</span>',
      '</div>',
      '<div class="flex items-center py-1.5 border-t border-gray-100">',
      '<span class="font-semibold text-gray-600 text-sm">ผู้แทนเวร: </span>',
      '<span class="font-bold text-emerald-700 text-sm ml-1">' + subEsc + '</span>',
      '</div>',
      '</div>'
    ].join('');

    return Swal.fire({
      title: 'ยืนยันการลา',
      html: html,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      confirmButtonColor: '#2ECC71',
      cancelButtonColor: '#94a3b8',
      allowOutsideClick: false,
      customClass: {
        popup: 'rounded-2xl p-4',
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition',
        cancelButton: 'px-6 py-2.5 rounded-xl font-semibold text-sm transition'
      }
    });
  }

  function showSuccess(message) {
    return Swal.fire({
      title: 'สำเร็จ ✅',
      text: message || 'บันทึกสำเร็จ',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#2ECC71'
    });
  }

  function showError(message) {
    return Swal.fire({
      title: 'ไม่สำเร็จ',
      text: message || 'กรุณาลองใหม่',
      icon: 'error',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#ef4444'
    });
  }

  return {
    showUserInfo: showUserInfo,
    showNotRegistered: showNotRegistered,
    showConfirmSave: showConfirmSave,
    confirmSwap: confirmSwap,
    showSuccess: showSuccess,
    showError: showError
  };
})();