(function() {
  var CONFIG = window.CONFIG;
  var api = window.api;
  var liffApp = window.liffApp;
  var modal = window.modal;

  var loadingOverlay = document.getElementById('loadingOverlay');
  var appContainer = document.getElementById('app');
  var userInfoDiv = document.getElementById('userInfo');
  var dutyForm = document.getElementById('dutyForm');
  var dutyPointSelect = document.getElementById('dutyPoint');
  var saveBtn = document.getElementById('saveBtn');

  var currentUser = {
    userId: null,
    displayName: null,
    pictureUrl: null,
    name: null,
    employeeId: null
  };

  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.add('show');
    } else {
      loadingOverlay.classList.remove('show');
    }
  }

  function populatePoints() {
    dutyPointSelect.innerHTML = '';
    CONFIG.DUTY_POINTS.forEach(function(point) {
      var opt = document.createElement('option');
      opt.value = point;
      opt.textContent = point;
      dutyPointSelect.appendChild(opt);
    });
  }

  function resetForm() {
    document.querySelector('input[name="shift"][value="กลางวัน"]').checked = true;
    dutyPointSelect.selectedIndex = 0;
    document.getElementById('note').value = '';
  }

  function handleToggle() {
    var radios = document.querySelectorAll('input[name="shift"]');
    radios.forEach(function(radio) {
      var parent = radio.closest('.toggle-option');
      if (radio.checked) {
        parent.classList.add('active');
      } else {
        parent.classList.remove('active');
      }
    });
  }

  async function initApp() {
    showLoading(true);
    try {
      var profile = await liffApp.initLiff();
      currentUser.userId = profile.userId;
      currentUser.displayName = profile.displayName;
      currentUser.pictureUrl = profile.pictureUrl;

      var verifyResult = await api.verifyUser(currentUser.userId);

      if (verifyResult.success && verifyResult.data) {
        currentUser.name = verifyResult.data.name || '';
        currentUser.employeeId = verifyResult.data.employeeId || '';

        await modal.showUserInfo(currentUser.name, currentUser.employeeId);
        userInfoDiv.textContent = currentUser.name + ' (' + currentUser.employeeId + ')';
        appContainer.style.display = 'block';
        dutyForm.style.display = 'block';

        populatePoints();
        resetForm();

        document.querySelectorAll('input[name="shift"]').forEach(function(el) {
          el.addEventListener('change', handleToggle);
        });
        handleToggle();

        saveBtn.addEventListener('click', onSave);
      } else {
        await modal.showNotRegistered();
        appContainer.style.display = 'block';
        dutyForm.style.display = 'none';
        userInfoDiv.textContent = 'ยังไม่ได้ลงทะเบียน';
      }
    } catch (err) {
      console.error('initApp error:', err);
      await modal.showError('เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ' + err.message);
    } finally {
      showLoading(false);
    }
  }

  async function onSave() {
    var shift = document.querySelector('input[name="shift"]:checked').value;
    var point = dutyPointSelect.value;
    var note = document.getElementById('note').value.trim();

    if (!point) {
      await modal.showError('กรุณาเลือกจุดประจำการ');
      return;
    }

    var confirmResult = await modal.showConfirmSave();
    if (!confirmResult.isConfirmed) return;

    showLoading(true);
    try {
      var payload = {
        lineUserId: currentUser.userId,
        shift: shift,
        point: point,
        note: note
      };
      var result = await api.saveDuty(payload);

      if (result.success) {
        await modal.showSuccess('บันทึกข้อมูลเรียบร้อย');
        resetForm();
        handleToggle();
      } else {
        throw new Error(result.message || 'บันทึกล้มเหลว');
      }
    } catch (err) {
      await modal.showError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      showLoading(false);
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();