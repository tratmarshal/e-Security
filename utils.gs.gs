/**
 * ฟังก์ชันช่วยจัดการปรับแต่งข้อความ คลีนข้อมูล และจัดการเวลาทั่วไป
 */
function normalizeText(text) {
  if (!text) return "";
  return String(text).trim();
}

function formatThaiDateTime(date) {
  return Utilities.formatDate(date, "GMT+7", "yyyy-MM-dd HH:mm:ss");
}