// ========== auth.gs ==========
// ตรวจสอบสิทธิ์ผู้ใช้งาน

function isAuthorized(userId) {
  if (!userId) return false;
  return AUTHORIZED_USERS.indexOf(String(userId).trim()) !== -1;
}

function getAuthorizationStatus(userId) {
  return isAuthorized(userId) ? "authorized" : "unauthorized";
}
