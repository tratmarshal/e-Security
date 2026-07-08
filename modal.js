var modal = (function() {
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

  function showConfirmSave() {
    return Swal.fire({
      title: 'ยืนยันการบันทึก',
      text: 'ยืนยันการบันทึกข้อมูลใช่หรือไม่',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });
  }

  function showSuccess(message) {
    return Swal.fire({
      title: 'สำเร็จ',
      text: message || 'บันทึกข้อมูลเรียบร้อย',
      icon: 'success',
      confirmButtonText: 'ตกลง'
    });
  }

  function showError(message) {
    return Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: message || 'กรุณาลองใหม่อีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
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