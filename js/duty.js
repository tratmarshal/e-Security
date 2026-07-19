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
                return ['ป้อมหน้า', 'ชั้น 1', 'โรงรถ', 'ชั้น 4'].indexOf(p.name) !== -1;
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

    // โหลดจุดตรวจ (hardcode)
    async function loadPoints() {
        loadedPoints = getDefaultPointsFallback();
        populatePoints(getCurrentShift());
    }

    function getDefaultPointsFallback() {
        return [
            { name: 'ป้อมหน้า', maxPeople: 2 },
            { name: 'ชั้น 1', maxPeople: 2 },
            { name: 'โรงรถ', maxPeople: 1 },
            { name: 'ชั้น 4', maxPeople: 1 },
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

    // แปลงวันที่เป็น string YYYY-MM-DD เพื่อใช้เปรียบเทียบ
    function toDateKey(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // ตรวจสอบว่า log อยู่ในช่วงเวลาผลัดปัจจุบันหรือไม่
    function isInCurrentShiftPeriod(log) {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var totalMin = h * 60 + m;
        var logDate = toDateKey(log.date);
        var todayKey = toDateKey(now.toISOString());
        var yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayKey = toDateKey(yesterday.toISOString());

        if (totalMin >= 420 && totalMin < 1140) { // 07:00-19:00 = DAY
            // แสดงเฉพาะกลางวันของวันนี้
            return log.shift === 'กลางวัน' && logDate === todayKey;
        } else if (totalMin >= 1140) { // 19:00-23:59 = NIGHT (เริ่มวันนี้)
            // แสดงเฉพาะกลางคืนของวันนี้
            return log.shift === 'กลางคืน' && logDate === todayKey;
        } else { // 00:00-06:59 = NIGHT (เริ่มเมื่อวาน)
            // แสดงเฉพาะกลางคืนของเมื่อวาน
            return log.shift === 'กลางคืน' && logDate === yesterdayKey;
        }
    }

    // โหลดและแสดงประวัติเข้างานของทุกคน (กรองตามช่วงเวลาผลัด + จัดกลุ่มตามวันที่)
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
            var res = await api.getAllHistory();
            if (res && res.success && res.data) {
                var allHistory = res.data;
                if (allHistory.length === 0) {
                    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่พบประวัติ</p>';
                    return;
                }

                // กรองเฉพาะรายการที่อยู่ในช่วงเวลาผลัดปัจจุบัน
                var filtered = allHistory.filter(function (log) {
                    return isInCurrentShiftPeriod(log);
                });

                if (filtered.length === 0) {
                    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่มีผู้ลงชื่อในผลัดปัจจุบัน</p>';
                    return;
                }

                // Deduplicate: ถ้าชื่อ + วันที่ + ผลัด ซ้ำกัน เก็บเฉพาะรายการแรก (ล่าสุด)
                var seen = {};
                var unique = [];
                filtered.forEach(function (log) {
                    var key = (log.name || '') + '|' + toDateKey(log.date) + '|' + (log.shift || '');
                    if (!seen[key]) {
                        seen[key] = true;
                        unique.push(log);
                    }
                });

                // แยกเป็นกลางวัน / กลางคืน (จัดการ cross-midnight)
                var dayItems = [];
                var nightItems = [];
                var currentPeriod = getCurrentPeriod();

                unique.forEach(function (log) {
                    if (log.shift === 'กลางวัน') {
                        dayItems.push(log);
                    } else {
                        nightItems.push(log);
                    }
                });

                // จัดกลุ่มตามวันที่
                function groupByDate(items) {
                    var groups = {};
                    items.forEach(function (item) {
                        var key = toDateKey(item.date);
                        if (!groups[key]) {
                            groups[key] = { dateKey: key, displayDate: formatShortDate(item.date), items: [] };
                        }
                        groups[key].items.push(item);
                    });
                    // แปลงเป็น array เรียงวันที่ล่าสุดก่อน
                    var result = [];
                    for (var k in groups) {
                        if (groups.hasOwnProperty(k)) {
                            result.push(groups[k]);
                        }
                    }
                    result.sort(function (a, b) {
                        return b.dateKey.localeCompare(a.dateKey);
                    });
                    return result;
                }

                var primaryGroup, secondaryGroup;
                var primaryLabel, secondaryLabel;

                if (currentPeriod === 'กลางวัน') {
                    primaryGroup = groupByDate(dayItems);
                    secondaryGroup = groupByDate(nightItems);
                    primaryLabel = '☀️ กลางวัน';
                    secondaryLabel = '🌙 กลางคืน';
                } else {
                    primaryGroup = groupByDate(nightItems);
                    secondaryGroup = groupByDate(dayItems);
                    primaryLabel = '🌙 กลางคืน';
                    secondaryLabel = '☀️ กลางวัน';
                }

                historyContainer.innerHTML = '';

                // Render กลุ่มหลัก (ปัจจุบัน)
                if (primaryGroup.length > 0) {
                    var primaryHeader = document.createElement('div');
                    primaryHeader.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 mt-1';
                    primaryHeader.textContent = primaryLabel;
                    historyContainer.appendChild(primaryHeader);

                    primaryGroup.forEach(function (dateGroup) {
                        // หัวข้อวันที่
                        var dateHeader = document.createElement('div');
                        dateHeader.className = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 mt-1';
                        dateHeader.textContent = '📅 ' + dateGroup.displayDate;
                        historyContainer.appendChild(dateHeader);

                        // รายการของคนในวันนั้น
                        dateGroup.items.forEach(function (log) {
                            historyContainer.appendChild(createHistoryItem(log));
                        });
                    });
                }

                // Render กลุ่มรอง (ถ้ามี)
                if (secondaryGroup.length > 0) {
                    var secondaryHeader = document.createElement('div');
                    secondaryHeader.className = 'text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 mt-3';
                    secondaryHeader.textContent = secondaryLabel;
                    historyContainer.appendChild(secondaryHeader);

                    secondaryGroup.forEach(function (dateGroup) {
                        var dateHeader = document.createElement('div');
                        dateHeader.className = 'text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5 mt-1';
                        dateHeader.textContent = '📅 ' + dateGroup.displayDate;
                        historyContainer.appendChild(dateHeader);

                        dateGroup.items.forEach(function (log) {
                            historyContainer.appendChild(createHistoryItem(log));
                        });
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

    // สร้าง element ประวัติ (ไม่แสดงวันที่ซ้ำ เพราะจัดกลุ่มตามวันที่แล้ว)
    function createHistoryItem(log) {
        var classes = common.getHistoryItemClasses();
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
        var displayName = log.name || currentUser.name || '(ไม่ระบุชื่อ)';

        var logItem = document.createElement('div');
        logItem.className = 'p-2.5 border rounded-xl flex justify-between items-start text-xs transition shadow-sm ' + classes.itemBg;

        // ซ้าย: ชื่อ
        var leftCol = document.createElement('div');
        leftCol.className = 'flex flex-col space-y-0.5 flex-1 min-w-0';
        leftCol.innerHTML = [
            '<span class="font-bold text-sm ' + classes.mainText + ' truncate">' + escapeHtml(displayName) + '</span>'
        ].join('');

        // ขวา: เวลา + จุดตรวจ
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