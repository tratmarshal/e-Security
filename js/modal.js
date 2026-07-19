var modal = (function () {
  // Shared customClass for consistent styling - Emerald theme
  var sharedPopupClass = 'rounded-2xl p-5 shadow-2xl border border-emerald-100 dark:border-emerald-800';
  var sharedConfirmBtnClass = 'px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-2 focus:ring-emerald-300';
  var sharedCancelBtnClass = 'px-6 py-2.5 rounded-xl font-semibold text-sm transition bg-slate-100 dark:bg-emerald-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-800 focus:ring-2 focus:ring-slate-300';

  function showUserInfo(name, employeeId) {
    var nameEsc = escapeHtml(name);
    var idEsc = escapeHtml(employeeId);
    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#1b5e20;">เจ้าหน้าที่</span>',
      html: '<div style="font-family: \'Sarabun\', sans-serif; text-align: left; padding: 0 4px;">' +
        '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e2e8f0;">' +
        '<span style="background:#d4edda;color:#1b5e20;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">' + nameEsc.charAt(0) + '</span>' +
        '<div><div style="font-weight:600;font-size:14px;color:#1e293b;">' + nameEsc + '</div>' +
        '<div style="font-size:12px;color:#64748b;">รหัส: ' + idEsc + '</div></div></div>',
      icon: null,
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#1b5e20',
      allowOutsideClick: false,
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass
      }
    });
  }

  function showNotRegistered() {
    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#b91c1c;">ยังไม่ได้ลงทะเบียน</span>',
      html: '<div style="font-family: \'Sarabun\', sans-serif; text-align: center; padding: 8px 4px;">' +
        '<div style="font-size:40px;margin-bottom:8px;">🚫</div>' +
        '<div style="font-size:14px;color:#475569;">กรุณาติดต่อผู้ดูแลระบบ</div></div>',
      icon: null,
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#1b5e20',
      allowOutsideClick: false,
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass
      }
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

    var shiftIcon = data.shift === 'กลางวัน' ? '☀️' : '🌙';
    var shiftBadgeClass = data.shift === 'กลางวัน'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-indigo-100 text-indigo-700';

    var html = [
      '<div style="font-family: \'Sarabun\', sans-serif;" class="text-left space-y-3">',
      // User info card
      '<div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">',
      '<div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">' + nameEsc.charAt(0) + '</div>',
      '<div>',
      '<div class="font-bold text-sm text-slate-800 dark:text-white">' + nameEsc + '</div>',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/70">รหัส: ' + idEsc + '</div>',
      '</div>',
      '</div>',
      // Shift + Point
      '<div class="flex items-center justify-between p-3 bg-white dark:bg-emerald-900/30 rounded-xl border border-slate-100 dark:border-emerald-800/50">',
      '<div class="flex items-center gap-2">',
      '<span class="text-sm">' + shiftIcon + '</span>',
      '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold ' + shiftBadgeClass + '">' + shiftEsc + '</span>',
      '</div>',
      '<div class="font-bold text-sm text-emerald-700 dark:text-emerald-300">' + pointEsc + '</div>',
      '</div>',
      // Note
      '<div class="p-3 bg-slate-50 dark:bg-emerald-900/20 rounded-xl border border-slate-100 dark:border-emerald-800/30">',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/60 mb-0.5">📝 หมายเหตุ</div>',
      '<div class="text-sm text-slate-700 dark:text-emerald-100">' + noteEsc + '</div>',
      '</div>',
      '</div>'
    ].join('');

    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#1b5e20;">ตรวจสอบข้อมูล</span>',
      html: html,
      icon: null,
      showCancelButton: true,
      confirmButtonText: '✅ ยืนยัน',
      cancelButtonText: '✏️ แก้ไข',
      reverseButtons: true,
      confirmButtonColor: '#1b5e20',
      cancelButtonColor: '#94a3b8',
      allowOutsideClick: false,
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass,
        cancelButton: sharedCancelBtnClass
      }
    });
  }

  /**
   * แสดง Modal ยืนยันการลา/แทนเวร
   * @param {Object} data - { swapDateStart, swapDateEnd, shift, requesterName, substituteName }
   * @returns {Promise} - { isConfirmed: true/false }
   */
  function confirmSwap(data) {
    var displayDateStart = common.formatDateTH(data.swapDateStart);
    var displayDateEnd = common.formatDateTH(data.swapDateEnd);
    var dateStartEsc = escapeHtml(displayDateStart);
    var dateEndEsc = escapeHtml(displayDateEnd);
    var nameEsc = escapeHtml(data.requesterName);
    var subEsc = escapeHtml(data.substituteName);
    var shiftEsc = escapeHtml(data.shift || '');
    var shiftIcon = data.shift === 'กลางวัน' ? '☀️' : '🌙';
    var shiftBadgeClass = data.shift === 'กลางวัน'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-indigo-100 text-indigo-700';

    var dateRangeText = dateStartEsc + ' → ' + dateEndEsc;

    var html = [
      '<div style="font-family: \'Sarabun\', sans-serif;" class="text-left space-y-3">',
      // Requestor
      '<div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-xl">',
      '<div class="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">' + nameEsc.charAt(0) + '</div>',
      '<div>',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/60">ผู้ลา</div>',
      '<div class="font-bold text-sm text-slate-800 dark:text-white">' + nameEsc + '</div>',
      '</div>',
      '</div>',
      // Date range
      '<div class="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/30 rounded-xl border border-slate-100 dark:border-emerald-800/50">',
      '<span class="text-lg">📅</span>',
      '<div>',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/60">วันที่ลา</div>',
      '<div class="font-bold text-sm text-slate-800 dark:text-white">' + dateRangeText + '</div>',
      '</div>',
      '</div>',
      // Shift
      '<div class="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/30 rounded-xl border border-slate-100 dark:border-emerald-800/50">',
      '<span class="text-lg">' + shiftIcon + '</span>',
      '<div>',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/60">ผลัด</div>',
      '<div class="font-bold text-sm"><span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold ' + shiftBadgeClass + '">' + shiftEsc + '</span></div>',
      '</div>',
      '</div>',
      // Substitute
      '<div class="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/30 rounded-xl border border-slate-100 dark:border-emerald-800/50">',
      '<div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">' + subEsc.charAt(0) + '</div>',
      '<div>',
      '<div class="text-[11px] text-slate-500 dark:text-emerald-200/60">ผู้แทนเวร</div>',
      '<div class="font-bold text-sm text-emerald-700 dark:text-emerald-300">' + subEsc + '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join('');

    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#1b5e20;">ยืนยันการลา</span>',
      html: html,
      icon: null,
      showCancelButton: true,
      confirmButtonText: '✅ ยืนยัน',
      cancelButtonText: '↩️ ยกเลิก',
      reverseButtons: true,
      confirmButtonColor: '#1b5e20',
      cancelButtonColor: '#94a3b8',
      allowOutsideClick: false,
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass,
        cancelButton: sharedCancelBtnClass
      }
    });
  }

  function showSuccess(message) {
    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#1b5e20;">สำเร็จ</span>',
      html: '<div style="font-family: \'Sarabun\', sans-serif; text-align: center; padding: 8px 4px;">' +
        '<div style="font-size:48px;margin-bottom:8px;">✅</div>' +
        '<div style="font-size:14px;color:#475569;">' + escapeHtml(message || 'บันทึกสำเร็จ') + '</div></div>',
      icon: null,
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#1b5e20',
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass
      }
    });
  }

  function showError(message) {
    return Swal.fire({
      title: '<span style="font-size:1.1rem;color:#b91c1c;">ไม่สำเร็จ</span>',
      html: '<div style="font-family: \'Sarabun\', sans-serif; text-align: center; padding: 8px 4px;">' +
        '<div style="font-size:48px;margin-bottom:8px;">❌</div>' +
        '<div style="font-size:14px;color:#475569;">' + escapeHtml(message || 'กรุณาลองใหม่') + '</div></div>',
      icon: null,
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#1b5e20',
      customClass: {
        popup: sharedPopupClass,
        confirmButton: sharedConfirmBtnClass
      }
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