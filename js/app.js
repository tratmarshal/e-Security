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

  // ควบคุมการเปิด/ปิด Loading Overlay
  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.remove('hidden');
      loadingOverlay.classList.add('flex');
    } else {
      loadingOverlay.classList.remove('flex');
      loadingOverlay.classList.add('hidden');
    }
  }

  // ดึงจุดตรวจมาแสดงใน select
  function populatePoints() {
    dutyPointSelect.innerHTML = '';

    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    placeholderOpt.textContent = '-- เลือกจุดตรวจ --';
    dutyPointSelect.appendChild(placeholderOpt);

    loadedPoints.forEach(function (point) {
      var opt = document.createElement('option');
      opt.value = point.name;
      opt.textContent = point.name;
      dutyPointSelect.appendChild(opt);
    });
  }

  // โหลดจุดตรวจจาก Google Sheets
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

  // เริ่มจับสัญญาณ GPS
  function startGpsTracking() {
    var gpsIndicator = document.getElementById('gps-indicator');
    if (gpsIndicator) gpsIndicator.classList.remove('hidden');

    if (!navigator.geolocation) {
      updateGpsUI(false);
      return;
    }

    navigator.geolocation.watchPosition(
      function (position) {
        userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        updateGpsUI(true);
      },
      function (error) {
        userCoords = null;
        updateGpsUI(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function updateGpsUI(success) {
    var gpsDot = document.getElementById('gps-dot');
    if (!gpsDot) return;

    if (success) {
      gpsDot.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      `;
    } else {
      gpsDot.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      `;
    }
  }

  // โหลดและแสดงประวัติย้อนหลัง
  async function updateHistoryUI() {
    var historySection = document.getElementById('history-section');
    var historyContainer = document.getElementById('history-container');
    if (!historySection || !historyContainer) return;

    historySection.classList.remove('hidden');
    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">กำลังโหลดประวัติ...</p>';

    try {
      var res = await api.getHistory(currentUser.userId);
      if (res && res.success && res.data) {
        var history = res.data;
        if (history.length === 0) {
          historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่พบประวัติ</p>';
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
        historyContainer.innerHTML = `<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ: ${escapeHtml(res ? res.message : '')}</p>`;
      }
    } catch (err) {
      console.error('History load error:', err);
      historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ</p>';
    }
  }

  // รีเซ็ตฟอร์ม
  function resetForm() {
    document.querySelector('input[name="shift"][value="กลางวัน"]').checked = true;
    dutyPointSelect.selectedIndex = 0;
    document.getElementById('note').value = '';
  }

  /**
   * จัดการ toggle ผลัดกลางวัน/กลางคืน
   * หมายเหตุ: การเปลี่ยนธีมสี (dark mode) ถูกลบออกตามคำขอ - คงไว้เฉพาะการแสดงข้อความเวลาและสี label
   */
  function handleToggle() {
    var radios = document.querySelectorAll('input[name="shift"]');
    var isNight = false;

    radios.forEach(function (radio) {
      if (radio.checked && radio.value === 'กลางคืน') {
        isNight = true;
      }
    });

    // *** ไม่เปลี่ยนธีมสี (dark mode) แล้ว - คงไว้เฉพาะข้อความบอกเวลา ***

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
      if (textDay) textDay.className = 'text-sm font-bold text-emerald-700';
      if (labelNight) {
        var svg = labelNight.querySelector('svg');
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-slate-400');
      }
      if (textNight) textNight.className = 'text-sm font-semibold text-slate-500';

      if (shiftTimeDesc) {
        shiftTimeDesc.innerText = '07:00 - 19:00 น.';
        shiftTimeDesc.className = 'text-xs text-orange-600 font-semibold bg-orange-50 px-2.5 py-1 rounded-md transition-colors';
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
        if (svg) svg.setAttribute('class', 'h-5 w-5 mr-1.5 text-indigo-500');
      }
      if (textNight) textNight.className = 'text-sm font-bold text-indigo-700';

      if (shiftTimeDesc) {
        shiftTimeDesc.innerText = '19:00 - 07:00 น.';
        shiftTimeDesc.className = 'text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md transition-colors';
      }
    }
  }

  // อัปเดตเวลาแบบเรียลไทม์
  function updateLiveTime() {
    var now = new Date();
    var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
    var timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

    var liveDateEl = document.getElementById('live-date');
    var liveClockEl = document.getElementById('live-clock');
    if (liveDateEl) liveDateEl.innerText = now.toLocaleDateString('th-TH', dateOptions);
    if (liveClockEl) liveClockEl.innerText = "เวลาปัจจุบัน: " + now.toLocaleTimeString('th-TH', timeOptions) + " น.";
  }

  // เริ่มต้นแอปพลิเคชัน
  async function initApp() {
    showLoading(true);

    setInterval(updateLiveTime, 1000);
    updateLiveTime();

    try {
      var profile = await liffApp.initLiff();
      currentUser.userId = profile.userId;
      currentUser.displayName = profile.displayName;
      currentUser.pictureUrl = profile.pictureUrl;

      var verifyResult = await api.verifyUser(currentUser.userId);

      showLoading(false);

      if (verifyResult.success && verifyResult.data) {
        currentUser.name = verifyResult.data.name || '';
        currentUser.employeeId = verifyResult.data.employeeId || '';

        var welcomeText = document.getElementById('user-welcome');
        var userAvatar = document.getElementById('user-avatar');
        if (welcomeText) {
          welcomeText.textContent = currentUser.name + ' (' + currentUser.employeeId + ')';
        }
        if (userAvatar && currentUser.pictureUrl) {
          userAvatar.src = currentUser.pictureUrl;
          userAvatar.classList.remove('hidden');
        }

        appContainer.style.display = 'block';
        dutyForm.style.display = 'block';

        await loadPoints();
        await updateHistoryUI();
        resetForm();

        document.querySelectorAll('input[name="shift"]').forEach(function (el) {
          el.addEventListener('change', handleToggle);
        });
        handleToggle();

        saveBtn.addEventListener('click', onSave);

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
      await modal.showError('ระบบขัดข้อง: ' + err.message);
    }
  }

  // ส่งรายงานลงเวลา
  async function onSave() {
    var shift = document.querySelector('input[name="shift"]:checked').value;
    var point = dutyPointSelect.value;
    var note = document.getElementById('note').value.trim();

    if (!point) {
      await modal.showError('กรุณาเลือกจุดตรวจ');
      return;
    }

    if (!userCoords) {
      await modal.showError('ไม่พบสัญญาณ GPS กรุณาเปิดสิทธิ์ตำแหน่ง');
      return;
    }

    var now = new Date();
    var timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';

    var confirmResult = await modal.showConfirmSave({
      employeeId: currentUser.employeeId,
      name: currentUser.name,
      shift: shift,
      point: point,
      note: note
    });
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
        await modal.showSuccess('บันทึกสำเร็จ ✅');
        resetForm();
        handleToggle();
        await updateHistoryUI();
      } else {
        throw new Error(result ? result.message : 'ส่งรายงานไม่สำเร็จ');
      }
    } catch (err) {
      showLoading(false);
      await modal.showError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();