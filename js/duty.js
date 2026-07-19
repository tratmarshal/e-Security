// ========== duty.js ==========
// เฉพาะ Business Logic ระบบลงเวลา
// ใช้ App Pattern: init(), load(), bindEvents(), destroy()
// ================================

var App = (function () {
    var currentUser = {
        userId: null,
        displayName: null,
        pictureUrl: null,
        name: null,
        employeeId: null
    };

    var loadedPoints = [];
    var userCoords = null;
    var liveTimeInterval = null;

    // ===== INIT =====
    function init() {
        document.addEventListener('DOMContentLoaded', initApp);
    }

    // ===== LOAD =====
    async function load() {
        await loadPoints();
        await updateHistoryUI();
        resetForm();
    }

    // ===== BIND EVENTS =====
    function bindEvents() {
        document.querySelectorAll('input[name="shift"]').forEach(function (el) {
            el.addEventListener('change', handleToggle);
        });
        handleToggle();

        document.getElementById('saveBtn').addEventListener('click', onSave);

        // Live time
        liveTimeInterval = setInterval(common.updateLiveTime, 1000);
        common.updateLiveTime();
    }

    // ===== DESTROY =====
    function destroy() {
        if (liveTimeInterval) {
            clearInterval(liveTimeInterval);
            liveTimeInterval = null;
        }
        loadedPoints = [];
        userCoords = null;
    }

    // ===== PRIVATE FUNCTIONS =====

    // กรองจุดตรวจตามผลัด
    function getPointsByShift(shift) {
        if (shift === 'กลางวัน') {
            return loadedPoints.filter(function (p) {
                return ['ป้อมหน้า', 'ชั้น1', 'โรงรถ', 'ชั้น'].indexOf(p.name) !== -1;
            });
        } else { // กลางคืน
            return loadedPoints.filter(function (p) {
                return ['ป้อมหน้า', 'ป้อมบ้านพัก'].indexOf(p.name) !== -1;
            });
        }
    }

    // หาผลัดปัจจุบัน
    function getCurrentShift() {
        var checked = document.querySelector('input[name="shift"]:checked');
        return checked ? checked.value : 'กลางวัน';
    }

    // ดึงจุดตรวจมาแสดงใน select (รองรับการกรองตามผลัด)
    function populatePoints(shift) {
        var select = document.getElementById('dutyPoint');
        select.innerHTML = '';

        var filtered = getPointsByShift(shift || getCurrentShift());

        var placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        placeholderOpt.textContent = '-- เลือกจุดตรวจ --';
        select.appendChild(placeholderOpt);

        filtered.forEach(function (point) {
            var opt = document.createElement('option');
            opt.value = point.name;
            opt.textContent = point.name; // ไม่ต้องใส่ (N คน)
            select.appendChild(opt);
        });
    }

    // โหลดจุดตรวจจาก Google Sheets
    async function loadPoints() {
        // แสดง skeleton ขณะโหลด
        var select = document.getElementById('dutyPoint');
        select.innerHTML = '';
        var skeletonOpt = document.createElement('option');
        skeletonOpt.disabled = true;
        skeletonOpt.selected = true;
        skeletonOpt.textContent = '⏳ กำลังโหลด...';
        select.appendChild(skeletonOpt);

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
        populatePoints(getCurrentShift());
    }

    function getDefaultPointsFallback() {
        return [
            { name: 'ป้อมหน้า', maxPeople: 2 },
            { name: 'ชั้น1', maxPeople: 2 },
            { name: 'โรงรถ', maxPeople: 1 },
            { name: 'ชั้น', maxPeople: 1 },
            { name: 'ป้อมบ้านพัก', maxPeople: 1 }
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
            function () {
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
            gpsDot.innerHTML = [
                '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>',
                '<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>'
            ].join('');
        } else {
            gpsDot.innerHTML = [
                '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>',
                '<span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>'
            ].join('');
        }
    }

    // รูปแบบวันที่สั้น เช่น "19 ก.ค. 69"
    function formatShortDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        });
    }

    // เช็คว่าช่วงเวลาปัจจุบันเป็นกลางวันหรือกลางคืน
    function getCurrentPeriod() {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var totalMin = h * 60 + m;
        // 07:00 - 19:00 = กลางวัน (420 - 1140)
        // 19:00 - 07:00 = กลางคืน
        if (totalMin >= 420 && totalMin < 1140) {
            return 'กลางวัน';
        } else {
            return 'กลางคืน';
        }
    }

    // โหลดและแสดงประวัติย้อนหลัง (2 คอลัมน์ + จัดกลุ่มตามผลัด)
    async function updateHistoryUI() {
        var historySection = document.getElementById('history-section');
        var historyContainer = document.getElementById('history-container');
        if (!historySection || !historyContainer) return;

        historySection.classList.remove('hidden');

        // แสดง skeleton ขณะโหลด
        historyContainer.innerHTML = '';
        for (var s = 0; s < 3; s++) {
            historyContainer.appendChild(common.createSkeletonItem());
        }

        try {
            var res = await api.getHistory(currentUser.userId);
            if (res && res.success && res.data) {
                var history = res.data;
                if (history.length === 0) {
                    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่พบประวัติ</p>';
                    return;
                }

                // แยกเป็นกลางวัน / กลางคืน
                var dayItems = [];
                var nightItems = [];
                history.forEach(function (log) {
                    // หาผลัดจาก log.shift หรือเดาจากเวลา
                    if (log.shift === 'กลางวัน') {
                        dayItems.push(log);
                    } else {
                        nightItems.push(log);
                    }
                });

                // เรียงลำดับ: กลุ่มหลักตามช่วงเวลาปัจจุบันขึ้นก่อน
                var currentPeriod = getCurrentPeriod();
                var primaryGroup, secondaryGroup;
                var primaryLabel, secondaryLabel;

                if (currentPeriod === 'กลางวัน') {
                    primaryGroup = dayItems;
                    secondaryGroup = nightItems;
                    primaryLabel = '☀️ กลางวัน';
                    secondaryLabel = '🌙 กลางคืน';
                } else {
                    primaryGroup = nightItems;
                    secondaryGroup = dayItems;
                    primaryLabel = '🌙 กลางคืน';
                    secondaryLabel = '☀️ กลางวัน';
                }

                historyContainer.innerHTML = '';

                // Render กลุ่มหลัก
                if (primaryGroup.length > 0) {
                    var primaryHeader = document.createElement('div');
                    primaryHeader.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 mt-1';
                    primaryHeader.textContent = primaryLabel;
                    historyContainer.appendChild(primaryHeader);

                    primaryGroup.forEach(function (log) {
                        historyContainer.appendChild(createHistoryItem(log));
                    });
                }

                // Render กลุ่มรอง (ถ้ามี)
                if (secondaryGroup.length > 0) {
                    var secondaryHeader = document.createElement('div');
                    secondaryHeader.className = 'text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 mt-2';
                    secondaryHeader.textContent = secondaryLabel;
                    historyContainer.appendChild(secondaryHeader);

                    secondaryGroup.forEach(function (log) {
                        historyContainer.appendChild(createHistoryItem(log));
                    });
                }
            } else {
                historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ: ' + escapeHtml(res ? res.message : '') + '</p>';
            }
        } catch (err) {
            console.error('History load error:', err);
            historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ</p>';
        }
    }

    // สร้าง element ประวัติ 2 คอลัมน์
    function createHistoryItem(log) {
        var classes = common.getHistoryItemClasses();
        var displayDate = formatShortDate(log.date);
        // ดึงเวลาเฉพาะ hh:mm (24 ชม.)
        var timeOnly = log.time || '';
        if (timeOnly.indexOf('T') !== -1) {
            // ISO datetime string เช่น "1899-12-30T12:46:06.000Z"
            var d = new Date(timeOnly);
            if (!isNaN(d.getTime())) {
                timeOnly = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
            }
        } else if (timeOnly.length >= 5) {
            timeOnly = timeOnly.substring(0, 5);
        }
        // ใช้ชื่อจาก log ที่บันทึกไว้ ถ้าไม่มีใช้ currentUser.name
        var displayName = log.name || currentUser.name;

        var logItem = document.createElement('div');
        logItem.className = 'p-2.5 border rounded-xl flex justify-between items-start text-xs transition shadow-sm ' + classes.itemBg;

        // ซ้าย: วันที่เล็ก + ชื่อใหญ่
        var leftCol = document.createElement('div');
        leftCol.className = 'flex flex-col space-y-0.5 flex-1 min-w-0';
        leftCol.innerHTML = [
            '<span class="text-[9px] ' + classes.accentText + '">' + escapeHtml(displayDate) + '</span>',
            '<span class="font-bold text-sm ' + classes.mainText + ' truncate">' + escapeHtml(displayName) + '</span>'
        ].join('');

        // ขวา: เวลาเล็ก + จุดตรวจใหญ่
        var rightCol = document.createElement('div');
        rightCol.className = 'flex flex-col space-y-0.5 items-end flex-shrink-0 ml-2';
        rightCol.innerHTML = [
            '<span class="text-[9px] ' + classes.accentText + '">' + escapeHtml(timeOnly) + ' น.</span>',
            '<span class="font-bold text-sm ' + classes.mainText + '">' + escapeHtml(log.point) + '</span>'
        ].join('');

        logItem.appendChild(leftCol);
        logItem.appendChild(rightCol);

        return logItem;
    }

    // รีเซ็ตฟอร์ม
    function resetForm() {
        document.querySelector('input[name="shift"][value="กลางวัน"]').checked = true;
        populatePoints('กลางวัน');
        document.getElementById('note').value = '';
    }

    // จัดการ toggle ผลัดกลางวัน/กลางคืน
    function handleToggle() {
        var radios = document.querySelectorAll('input[name="shift"]');
        var isNight = false;

        radios.forEach(function (radio) {
            if (radio.checked && radio.value === 'กลางคืน') {
                isNight = true;
            }
        });

        // อัปเดตจุดตรวจตามผลัด
        populatePoints(isNight ? 'กลางคืน' : 'กลางวัน');

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

    // เริ่มต้นแอปพลิเคชัน
    async function initApp() {
        common.showLoading(true);

        try {
            var profile = await liffApp.initLiff(CONFIG.LIFF_ID_DUTY);
            currentUser.userId = profile.userId;
            currentUser.displayName = profile.displayName;
            currentUser.pictureUrl = profile.pictureUrl;

            var verifyResult = await api.verifyUser(currentUser.userId);

            common.showLoading(false);

            if (verifyResult.success && verifyResult.data) {
                currentUser.name = verifyResult.data.name || '';
                currentUser.employeeId = verifyResult.data.employeeId || '';

                // แสดงชื่อ 2 บรรทัด
                var nameDisplay = document.getElementById('user-name-display');
                var idDisplay = document.getElementById('user-id-display');
                var userAvatar = document.getElementById('user-avatar');
                if (nameDisplay) {
                    nameDisplay.textContent = currentUser.name;
                }
                if (idDisplay) {
                    idDisplay.textContent = 'รหัส: ' + currentUser.employeeId;
                }
                if (userAvatar && currentUser.pictureUrl) {
                    userAvatar.src = currentUser.pictureUrl;
                    userAvatar.classList.remove('hidden');
                }

                document.getElementById('app').style.display = 'block';
                document.getElementById('dutyForm').style.display = 'block';

                await load();
                bindEvents();
                startGpsTracking();
            } else {
                common.showLoading(false);
                await modal.showNotRegistered();
                document.getElementById('app').style.display = 'block';
                document.getElementById('dutyForm').style.display = 'none';

                var nameDisplay = document.getElementById('user-name-display');
                if (nameDisplay) nameDisplay.textContent = 'ยังไม่ได้ลงทะเบียน';
            }
        } catch (err) {
            common.showLoading(false);
            if (err.message && err.message.includes('redirecting')) return;
            common.handleError(err);
        }
    }

    // ส่งรายงานลงเวลา
    async function onSave() {
        var shift = document.querySelector('input[name="shift"]:checked').value;
        var point = document.getElementById('dutyPoint').value;
        var note = document.getElementById('note').value.trim();

        if (!point) {
            await modal.showError('กรุณาเลือกจุดตรวจ');
            return;
        }

        if (!userCoords) {
            await modal.showError('ไม่พบสัญญาณ GPS กรุณาเปิดสิทธิ์ตำแหน่ง');
            return;
        }

        var confirmResult = await modal.showConfirmSave({
            employeeId: currentUser.employeeId,
            name: currentUser.name,
            shift: shift,
            point: point,
            note: note
        });
        if (!confirmResult.isConfirmed) return;

        common.showLoading(true);
        try {
            var payload = {
                lineUserId: currentUser.userId,
                name: currentUser.name,
                employeeId: currentUser.employeeId,
                shift: shift,
                point: point,
                latitude: userCoords.latitude,
                longitude: userCoords.longitude,
                note: note
            };

            var result = await api.saveDuty(payload);

            common.showLoading(false);

            if (result && result.success) {
                await modal.showSuccess('บันทึกสำเร็จ ✅');
                resetForm();
                handleToggle();
                await updateHistoryUI();
            } else {
                throw new Error(result ? result.message : 'ส่งรายงานไม่สำเร็จ');
            }
        } catch (err) {
            common.showLoading(false);
            await modal.showError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
        }
    }

    return {
        init: init,
        load: load,
        bindEvents: bindEvents,
        destroy: destroy
    };
})();

// Auto-start
App.init();