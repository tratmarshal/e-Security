/**
 * บันทึกประวัติการใช้งานของเจ้าหน้าที่ตำรวจศาลลงแท็บ log
 * @param {string} action ชื่อฟังก์ชันหรือการกระทำ
 * @param {string} details รายละเอียดการกระทำเชิงลึก
 * @param {string} page หน้าจอระบบต้นทางที่กดสั่งงาน
 */
function logActivity(action, details, page) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_UPDATE_ID);
    const logSheet = spreadsheet.getSheetByName(CONFIG.SHEET_LOG_NAME);
    
    const timestamp = new Date();
    const userEmail = Session.getActiveUser().getEmail();
    
    // โครงสร้างแถวล็อก: [เวลาบันทึก, ผู้ใช้งาน, การกระทำ, รายละเอียด, หน้าจอต้นทาง]
    logSheet.appendRow([
      timestamp,
      userEmail,
      action,
      details,
      page
    ]);
  } catch (error) {
    console.error("ไม่สามารถบันทึก Log ได้: " + error.toString());
  }
}