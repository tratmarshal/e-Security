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

  // ฟังก์ชันควบคุมการเปิด/ปิด Loading Overlay สไตล์ Tailwind
  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.remove('hidden');
      loadingOverlay.classList.add('flex');
    } else {
      loadingOverlay.classList.remove('flex');
      loadingOverlay.classList.add('hidden');
    }
  }

  // ดึงรายการจุดตรวจจาก CONFIG มาแสดงใน select
  function populatePoints() {
    dutyPointSelect.innerHTML = '';
    
    // สร้างตัวเลือกเริ่มต้น
    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    placeholderOpt.textContent = '-- เลือกจุดตรวจของ อผศ. --';
    dutyPointSelect.appendChild(placeholderOpt);

    CONFIG.DUTY_POINTS.forEach(function(point) {
      var opt = document.createElement('option');
      opt.value = point;
      opt.textContent = point;
      dutyPointSelect.appendChild(opt);
    });
  }

  // รีเซ็ตค่าในฟอร์มกลับเป็นค่าเริ่มต้น
  function resetForm() {
    document.querySelector('input[name="shift"][value="กลางวัน"]').checked = true;
    dutyPointSelect.selectedIndex = 0;
    document.getElementById('note').value = '';
  }

  // จัดการการเปลี่ยนธีม (สว่าง/มืด) และแอนิเมชันปุ่มเลื่อนผลัดทำงานแบบตอบสนอง
  function handleToggle() {
    var radios = document.querySelectorAll('input[name="shift"]');
    var isNight = false;
    
    radios.forEach(function(radio) {
      if (radio.checked && radio.value === 'กลางคืน') {
        isNight = true;
      }
    });

    // สลับคลาสธีมสีดำเพื่อประหยัดพลังงานในผลัดกลางคืน
    if (isNight) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    var toggleBg = document.getElementById('toggle-bg');
    var labelDay = document.getElementById('label-day');
    var labelNight = document.getElementById('label-night');
    var textDay = document.getElementById('text-day');
    var textNight = document.getElementById('text-night');
    var shiftTimeDesc = document.getElementById('shift-time-desc');

    if (!isNight) {
      if (toggleBg) toggleBg.style.left = '6px';
      if (labelDay) {
        var svg = labelDay.querySelector('svg');
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-wvo-orange-500');
      }
      if (textDay) textDay.className = 'text-sm font-bold text-wvo-green-700';
      if (labelNight) {
        var svg = labelNight.querySelector('svg');
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-slate-400');
      }
      if (textNight) textNight.className = 'text-sm font-semibold text-slate-500';

      if (shiftTimeDesc) {
        shiftTimeDesc.innerText = 'เวลาปฏิบัติงาน: 07:00 น. - 19:00 น.';
        shiftTimeDesc.className = 'text-xs text-wvo-orange-500 font-semibold bg-orange-50 px-2.5 py-1 rounded-md transition-colors';
      }
    } else {
      if (toggleBg) toggleBg.style.left = 'calc(50% - 6px)';
      if (labelDay) {
        var svg = labelDay.querySelector('svg');
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-slate-400');
      }
      if (textDay) textDay.className = 'text-sm font-semibold text-slate-500';
      if (labelNight) {
        var svg = labelNight.querySelector('svg');
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-wvo-gold-400');
      }
      if (textNight) textNight.className = 'text-sm font-bold text-white';

      if (shiftTimeDesc) {
        shiftTimeDesc.innerText = 'เวลาปฏิบัติงาน: 19:00 น. - 07:00 น.';
        shiftTimeDesc.className = 'text-xs text-wvo-gold-500 font-semibold bg-yellow-50 dark:bg-wvo-green-950 px-2.5 py-1 rounded-md transition-colors';
      }
    }
  }

  // อัปเดตเวลาและวันที่แบบเรียลไทม์
  function updateLiveTime() {
    var now = new Date();
    var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
    var timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    var liveDateEl = document.getElementById('live-date');
    var liveClockEl = document.getElementById('live-clock');
    if (liveDateEl) liveDateEl.innerText = now.toLocaleDateString('th-TH', dateOptions);
    if (liveClockEl) liveClockEl.innerText = "เวลาปัจจุบัน: " + now.toLocaleTimeString('th-TH', timeOptions) + " น.";
  }

  // ฟังก์ชันเริ่มต้นการทำงานของแอปพลิเคชัน
  async function initApp() {
    showLoading(true);
    
    // เริ่มต้นตัวบอกเวลาแบบเรียลไทม์
    setInterval(updateLiveTime, 1000);
    updateLiveTime();

    try {
      var profile = await liffApp.initLiff();
      currentUser.userId = profile.userId;
      currentUser.displayName = profile.displayName;
      currentUser.pictureUrl = profile.pictureUrl;

      // ส่งคำขอยืนยันตัวตนไปยัง Google Apps Script
      var verifyResult = await api.verifyUser(currentUser.userId);

      showLoading(false);

      if (verifyResult.success && verifyResult.data) {
        currentUser.name = verifyResult.data.name || '';
        currentUser.employeeId = verifyResult.data.employeeId || '';

        // นำเข้าข้อมูลผู้ใช้สู่หน้า UI โดยตรง
        document.getElementById('guard-id').value = currentUser.employeeId;
        document.getElementById('guard-name').value = currentUser.name;

        // อัปเดตชื่อโปรไฟล์และรูปภาพ LINE ของผู้ใช้บนแท็บข้อมูลด้านบน
        var welcomeText = document.getElementById('user-welcome');
        var userAvatar = document.getElementById('user-avatar');
        if (welcomeText) {
          welcomeText.textContent = 'เจ้าหน้าที่เวรยาม: ' + currentUser.name;
        }
        if (userAvatar && currentUser.pictureUrl) {
          userAvatar.src = currentUser.pictureUrl;
          userAvatar.classList.remove('hidden');
        }

        // แสดงผลหน้าหลัก
        appContainer.style.display = 'block';
        dutyForm.style.display = 'block';

        populatePoints();
        resetForm();

        // แนบ Event Listener สำหรับสวิตช์ผลัดเวรยาม
        document.querySelectorAll('input[name="shift"]').forEach(function(el) {
          el.addEventListener('change', handleToggle);
        });
        handleToggle();

        saveBtn.addEventListener('click', onSave);
      } else {
        await modal.showNotRegistered();
        appContainer.style.display = 'block';
        dutyForm.style.display = 'none';
        
        var welcomeText = document.getElementById('user-welcome');
        if (welcomeText) welcomeText.textContent = 'ยังไม่ได้ลงทะเบียน';
      }
    } catch (err) {
      console.error('initApp error:', err);
      showLoading(false);
      await modal.showError('เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ' + err.message);
    }
  }

  // ส่งผลการกรอกรายงานลงเวรยาม
  async function onSave() {
    var shift = document.querySelector('input[name="shift"]:checked').value;
    var point = dutyPointSelect.value;
    var note = document.getElementById('note').value.trim();

    if (!point) {
      await modal.showError('กรุณาเลือกจุดตรวจ/จุดประจำการก่อนบันทึก');
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

      showLoading(false);

      if (result.success) {
        await modal.showSuccess('บันทึกข้อมูลและรายงานตัวสำเร็จแล้ว');
        resetForm();
        handleToggle();
      } else {
        throw new Error(result.message || 'การส่งรายงานตัวผิดพลาด');
      }
    } catch (err) {
      showLoading(false);
      await modal.showError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();