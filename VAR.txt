// ========== VAR.gs ==========
// ตัวแปรกลางทั้งหมด — ห้ามแก้ไขค่านอกไฟล์นี้
// ================================

const SPREADSHEET_ID = '1sIjBOBNMN7eJlgaDhRnOctZ0-clAgbm7IwuHZQOsVQc';

const SHEETS = {
  USER: 'USER',
  DUTY: 'DUTY',
  POINTS: 'POINTS',
  LIST: 'LIST',
  SWAP: 'SWAP'
};

const HEADERS = {
  USER: ['LineUserId', 'Name', 'EmployeeId'],
  DUTY: ['Date', 'Time', 'LineUserId', 'Shift', 'Point', 'Latitude', 'Longitude', 'Note'],
  POINTS: ['Name', 'Lat', 'Lng', 'Radius'],
  LIST: ['LineUserId', 'Name', 'EmployeeId'],
  SWAP: ['Date', 'LineUserId', 'Name', 'SubstituteUserId', 'SubstituteName', 'Timestamp']
};

const COL = {
  USER:     { LINE_USER_ID: 0, NAME: 1, EMPLOYEE_ID: 2 },
  DUTY:    { DATE: 0, TIME: 1, LINE_USER_ID: 2, SHIFT: 3, POINT: 4, LAT: 5, LNG: 6, NOTE: 7 },
  LIST:    { LINE_USER_ID: 0, NAME: 1, EMPLOYEE_ID: 2 },
  SWAP:    { DATE: 0, LINE_USER_ID: 1, NAME: 2, SUB_USER_ID: 3, SUB_NAME: 4, TIMESTAMP: 5 }
};

const CACHE_TTL = 300; // 5 นาที สำหรับข้อมูลที่เปลี่ยนไม่บ่อย
const MAX_HISTORY = 10;
const TIMEZONE = 'Asia/Bangkok';