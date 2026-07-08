/**
 * e-Security - Configuration
 * All environment-specific settings in one place.
 */

const CONFIG = {
  // Backend API URL (Google Apps Script Web App)
  // เปลี่ยนเป็น URL ของ Web App ที่ deploy แล้ว
  API_URL: 'https://script.google.com/macros/s/AKfycbyrigshyMUC6u3cJeWBseJW1GAYGfzeyb5MjEgj995xX4BZXgkX2UghQUrkGMXvVkBh/exec',

  // LIFF App ID (จาก LINE Developers)
  LIFF_ID: '2010616678-GGszdIBe',

  // Duty points
  DUTY_POINTS: [
    'ประตูหน้า',
    'ประตูหลัง',
    'อาคาร A',
    'อาคาร B',
    'อาคาร C',
    'ลานจอดรถ',
    'ศูนย์ควบคุม',
    'รอบนอก'
  ],

  API_TIMEOUT: 15000,
  API_RETRY_COUNT: 2,
  API_RETRY_DELAY: 1000,
};

Object.freeze(CONFIG);