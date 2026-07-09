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
   * แสดง Modal ยืนยันข้อมูลก่อนบันทึก
   * @param {Object} data - { employeeId, name, shift, point, latitude, longitude, note, time }
   * @returns {Promise} - { isConfirmed: true/false }
   */
  function showConfirmSave(data) {
    var idEsc = escapeHtml(data.employeeId);
    var nameEsc = escapeHtml(data.name);
    var shiftEsc = escapeHtml(data.shift);
    var pointEsc = escapeHtml(data.point);
    var lat = data.latitude ? data.latitude.toFixed(5) : '-';
    var lng = data.longitude ? data.longitude.toFixed(5) : '-';
    var noteEsc = escapeHtml(data.note) || '-';
    var timeEsc = escapeHtml(data.time);

    var shiftBadgeClass = data.shift === 'กลางวัน'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-indigo-100 text-indigo-700';

    var html = `
      <div class="text-left space-y-3" style="font-family: 'Sarabun', sans-serif;">
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">รหัสพนักงาน</span>
          <span class="font-bold text-gray-800 text-sm">${idEsc}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">ชื่อ-นามสกุล</span>
          <span class="font-bold text-gray-800 text-sm">${nameEsc}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">ผลัดปฏิบัติงาน</span>
          <span class="font-bold px-2.5 py-0.5 rounded-full text-xs ${shiftBadgeClass}">${shiftEsc}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">จุดตรวจ</span>
          <span class="font-bold text-emerald-700 text-sm">${pointEsc}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">พิกัด GPS</span>
          <span class="font-mono text-xs text-gray-600">${lat}, ${lng}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-gray-500 font-medium text-sm">หมายเหตุ</span>
          <span class="text-sm text-gray-700 max-w-[180px] truncate">${noteEsc}</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-gray-500 font-medium text-sm">เวลาในระบบ</span>
          <span class="font-bold text-orange-600 text-sm">${timeEsc}</span>
        </div>
      </div>
    `;

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
    showSuccess: showSuccess,
    showError: showError
  };
})();