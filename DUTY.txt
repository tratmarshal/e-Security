// ========== DUTY.gs ==========
// เฉพาะ Business Logic ระบบลงเวลา
// ใช้ฟังก์ชันจาก CENTRAL.gs และ VAR.gs
// ================================

// ===== VERIFY USER =====

function verifyUser(payload) {
  try {
    var validation = validatePayload(payload, ['lineUserId']);
    if (!validation.valid) return jsonResponse(false, validation.message);

    var rows = SheetService.getCachedOrFetch(SHEETS.USER, 'A:C', 'cache_users');
    if (rows.length < 2) return jsonResponse(false, 'ไม่พบข้อมูลผู้ใช้งาน');

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][COL.USER.LINE_USER_ID] && rows[i][COL.USER.LINE_USER_ID].toString().trim() === payload.lineUserId) {
        return jsonResponse(true, '', {
          name: rows[i][COL.USER.NAME] || '',
          employeeId: rows[i][COL.USER.EMPLOYEE_ID] || ''
        });
      }
    }
    return jsonResponse(false, 'ไม่พบผู้ใช้งาน');
  } catch (err) {
    return handleError(err);
  }
}

// ===== SAVE DUTY (ลงเวลา) =====

function saveDuty(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var validation = validatePayload(payload, ['lineUserId', 'shift', 'point', 'latitude', 'longitude']);
    if (!validation.valid) return jsonResponse(false, validation.message);

    var values = [[
      nowDate(),
      nowTime(),
      payload.lineUserId,
      payload.shift,
      payload.point,
      payload.latitude,
      payload.longitude,
      payload.note || ''
    ]];
    SheetService.appendRow(SHEETS.DUTY, values[0]);

    return jsonResponse(true, 'บันทึกข้อมูลเรียบร้อย');
  } catch (err) {
    return handleError(err);
  } finally {
    lock.releaseLock();
  }
}

// ===== GET POINTS (จุดตรวจ) =====

function getDefaultPoints() {
  return [
    { name: 'ประตูหน้า' },
    { name: 'ประตูหลัง' },
    { name: 'อาคาร A' },
    { name: 'อาคาร B' }
  ];
}

function getPoints() {
  try {
    var rows = SheetService.getCachedOrFetch(SHEETS.POINTS, 'A:D', 'cache_points');
    if (rows.length < 2) return jsonResponse(true, 'ใช้จุดตรวจเริ่มต้น (ไม่มีข้อมูลในชีท)', getDefaultPoints());

    var points = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        points.push({
          name: rows[i][0].toString().trim(),
          lat: parseFloat(rows[i][1]) || 0,
          lng: parseFloat(rows[i][2]) || 0,
          radius: parseFloat(rows[i][3]) || 100
        });
      }
    }
    return jsonResponse(true, '', points);
  } catch (err) {
    return jsonResponse(true, 'ใช้จุดตรวจเริ่มต้น: ' + err.message, getDefaultPoints());
  }
}

// ===== GET DUTY HISTORY =====

function getHistory(payload) {
  try {
    var validation = validatePayload(payload, ['lineUserId']);
    if (!validation.valid) return jsonResponse(false, validation.message);

    var rows = SheetService.getValues(SHEETS.DUTY, 'A:H'); // ไม่ cache — ข้อมูล实时
    var history = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][COL.DUTY.LINE_USER_ID] && rows[i][COL.DUTY.LINE_USER_ID].toString().trim() === payload.lineUserId.trim()) {
        history.push({
          date: rows[i][COL.DUTY.DATE] || '',
          time: rows[i][COL.DUTY.TIME] || '',
          shift: rows[i][COL.DUTY.SHIFT] || '',
          point: rows[i][COL.DUTY.POINT] || '',
          latitude: rows[i][COL.DUTY.LAT] || '',
          longitude: rows[i][COL.DUTY.LNG] || '',
          note: rows[i][COL.DUTY.NOTE] || ''
        });
        if (history.length >= MAX_HISTORY) break;
      }
    }
    return jsonResponse(true, '', history);
  } catch (err) {
    return handleError(err);
  }
}