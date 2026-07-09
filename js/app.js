(function () {
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

  var loadedPoints = [];
  var userCoords = null;

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

  // ดึงรายการจุดตรวจที่โหลดแบบ dynamic มาแสดงใน select
  function populatePoints() {
    dutyPointSelect.innerHTML = '';

    // สร้างตัวเลือกเริ่มต้น
    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    placeholderOpt.textContent = '-- เลือกจุดตรวจของ อผศ. --';
    dutyPointSelect.appendChild(placeholderOpt);

    loadedPoints.forEach(function (point) {
      var opt = document.createElement('option');
      opt.value = point.name;
      opt.textContent = point.name;
      dutyPointSelect.appendChild(opt);
    });
  }

  // โหลดรายการจุดตรวจจาก Google Sheets
  async function loadPoints() {
    try {
      var res = await api.getPoints();
      if (res && res.success && res.data) {
        loadedPoints = res.data;
      } else {
        console.warn('Fallback to default points:', res ? res.message : 'no response');
        loadedPoints = getDefaultPointsFallback();
      }
    } catch (err) {
      console.error('Failed to load points:', err);
      loadedPoints = getDefaultPointsFallback();
    }
    populatePoints();
  }

  function getDefaultPointsFallback() {
    return [
      { name: 'ประตูหน้า' },
      { name: 'ประตูหลัง' },
      { name: 'อาคาร A' },
      { name: 'อาคาร B' }
    ];
  }

  // คำนวณระยะทางแบบ Haversine (หน่วยเมตร)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // รัศมีโลกในหน่วยเมตร
    var phi1 = lat1 * Math.PI / 180;
    var phi2 = lat2 * Math.PI / 180;
    var deltaPhi = (lat2 - lat1) * Math.PI / 180;
    var deltaLambda = (lon2 - lon1) * Math.PI / 180;

    var a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // เริ่มระบุตำแหน่ง GPS
  function startGpsTracking() {
    var gpsStatusContainer = document.getElementById('gps-status-container');
    var gpsCoords = document.getElementById('gps-coords');

    if (gpsStatusContainer) gpsStatusContainer.classList.remove('hidden');

    if (!navigator.geolocation) {
      updateGpsUI(false, 'เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }

    navigator.geolocation.watchPosition(
      function (position) {
        userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        updateGpsUI(true, 'สัญญาณตำแหน่งสมบูรณ์');
        if (gpsCoords) {
          gpsCoords.textContent = userCoords.latitude.toFixed(5) + ', ' + userCoords.longitude.toFixed(5);
        }
        checkDistanceToSelectedPoint();
      },
      function (error) {
        userCoords = null;
        var msg = 'ไม่สามารถดึงตำแหน่งพิกัดได้';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'ปฏิเสธการเข้าถึงตำแหน่ง GPS';
        }
        updateGpsUI(false, msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function updateGpsUI(success, text) {
    var gpsIcon = document.getElementById('gps-icon');
    var gpsText = document.getElementById('gps-text');
    if (!gpsText) return;
    gpsText.textContent = text;

    if (success) {
      gpsIcon.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      `;
    } else {
      gpsIcon.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      `;
    }
  }

  function checkDistanceToSelectedPoint() {
    var pointName = dutyPointSelect.value;
    var distanceInfo = document.getElementById('gps-distance-info');
    var distanceText = document.getElementById('gps-distance-text');
    if (!distanceInfo || !distanceText) return;

    if (!pointName || !userCoords) {
      distanceInfo.classList.add('hidden');
      return;
    }

    var targetLat = 12.273788;
    var targetLng = 102.516731;
    var allowedRadius = 100;

    var dist = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      targetLat,
      targetLng
    );

    distanceInfo.classList.remove('hidden');
    distanceText.textContent = 'ระยะห่างจากพิกัดอ้างอิง: ' + dist.toFixed(1) + ' เมตร (รัศมีที่อนุญาต: ' + allowedRadius + ' เมตร)';

    if (dist <= allowedRadius) {
      distanceText.className = 'text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300';
    } else {
      distanceText.className = 'text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300';
    }
  }

  // โหลดและแสดงประวัติย้อนหลังของผู้ใช้ปัจจุบัน
  async function updateHistoryUI() {
    var historySection = document.getElementById('history-section');
    var historyContainer = document.getElementById('history-container');
    if (!historySection || !historyContainer) return;

    historySection.classList.remove('hidden');
    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">กำลังโหลดประวัติย้อนหลัง...</p>';

    try {
      var res = await api.getHistory(currentUser.userId);
      if (res && res.success && res.data) {
        var history = res.data;
        if (history.length === 0) {
          historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่พบประวัติการลงเวลาในระบบ</p>';
          return;
        }
        historyContainer.innerHTML = '';
        var isNightMode = document.documentElement.classList.contains('dark');
        var logItemBg = isNightMode ? 'bg-[#173b1b] border-wvo-green-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800';
        var mainTextColor = isNightMode ? 'text-white' : 'text-slate-800';
        var subTextColor = isNightMode ? 'text-wvo-green-100' : 'text-slate-500';
        var accentTextColor = isNightMode ? 'text-wvo-gold-400' : 'text-slate-400';
        var timeTextColor = isNightMode ? 'text-wvo-green-100' : 'text-slate-700';

        history.forEach(function (log) {
          var shiftColor = log.shift === 'กลางวัน' ? 'bg-wvo-orange-50 text-wvo-orange-600 border border-wvo-orange-100' : 'bg-wvo-green-100 text-wvo-green-800 border border-wvo-green-200';
          var noteBlock = log.note ? `<p class="mt-1 font-medium text-[11px] ${subTextColor}">หมายเหตุ: ${escapeHtml(log.note)}</p>` : '';
          var gpsBlock = (log.latitude && log.longitude) ? `<span class="block text-[10px] ${accentTextColor}">พิกัด: ${parseFloat(log.latitude).toFixed(4)}, ${parseFloat(log.longitude).toFixed(4)}</span>` : '';

          var logItem = document.createElement('div');
          logItem.className = `p-3 border rounded-xl flex justify-between items-start text-xs transition shadow-sm ${logItemBg}`;
          logItem.innerHTML = `
            <div class="space-y-1">
              <div class="flex items-center space-x-1.5">
                <span class="font-bold ${mainTextColor}">จุดตรวจ: ${escapeHtml(log.point)}</span>
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${shiftColor}">${escapeHtml(log.shift)}</span>
              </div>
              <p class="font-medium ${subTextColor}">วันที่: ${escapeHtml(log.date)}</p>
              ${noteBlock}
            </div>
            <div class="text-right">
              ${gpsBlock}
              <span class="font-bold ${timeTextColor}">${escapeHtml(log.time)} น.</span>
            </div>
          `;
          historyContainer.appendChild(logItem);
        });
      } else {
        historyContainer.innerHTML = `<p class="text-xs text-red-500 text-center py-4">ไม่สามารถโหลดประวัติได้: ${escapeHtml(res ? res.message : '')}</p>`;
      }
    } catch (err) {
      console.error('History load error:', err);
      historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">ไม่สามารถดึงข้อมูลประวัติได้ชั่วคราว</p>';
    }
  }

  // รีเซ็ตค่าในฟอร์มกลับเป็นค่าเริ่มต้น
  function resetForm() {
    document.querySelector('input[name="shift"][value="กลางวัน"]').checked = true;
    dutyPointSelect.selectedIndex = 0;
    document.getElementById('note').value = '';
    var distanceInfo = document.getElementById('gps-distance-info');
    if (distanceInfo) distanceInfo.classList.add('hidden');
  }

  // จัดการการเปลี่ยนธีม (สว่าง/มืด) และแอนิเมชันปุ่มเลื่อนผลัดทำงานแบบตอบสนอง
  function handleToggle() {
    var radios = document.querySelectorAll('input[name="shift"]');
    var isNight = false;

    radios.forEach(function (radio) {
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

        // โหลดข้อมูลจุดตรวจแบบ Dynamic และประวัติย้อนหลัง
        await loadPoints();
        await updateHistoryUI();
        resetForm();

        // แนบ Event Listener สำหรับสวิตช์ผลัดเวรยาม
        document.querySelectorAll('input[name="shift"]').forEach(function (el) {
          el.addEventListener('change', handleToggle);
        });
        handleToggle();

        dutyPointSelect.addEventListener('change', checkDistanceToSelectedPoint);
        saveBtn.addEventListener('click', onSave);

        // เริ่มจับพิกัด GPS
        startGpsTracking();
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

    if (!userCoords) {
      await modal.showError('ไม่สามารถอ่านพิกัด GPS ปัจจุบันได้ กรุณาเปิดสิทธิ์ระบุตำแหน่งและลองใหม่อีกครั้ง');
      return;
    }

    var targetLat = 12.273788;
    var targetLng = 102.516731;
    var allowedRadius = 100;

    var dist = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      targetLat,
      targetLng
    );
    if (dist > allowedRadius) {
      await modal.showError('ไม่อนุญาตให้บันทึก: คุณอยู่ห่างจากจุดตรวจมากเกินไป (' + dist.toFixed(1) + ' เมตร)');
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
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        note: note
      };

      var result = await api.saveDuty(payload);

      showLoading(false);

      if (result && result.success) {
        await modal.showSuccess('บันทึกข้อมูลและรายงานตัวสำเร็จแล้ว');
        resetForm();
        handleToggle();
        await updateHistoryUI();
      } else {
        throw new Error(result ? result.message : 'การส่งรายงานตัวผิดพลาด');
      }
    } catch (err) {
      showLoading(false);
      await modal.showError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
