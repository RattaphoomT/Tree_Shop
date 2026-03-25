import axios from 'axios';
import Swal from 'sweetalert2';

// สร้าง instance ของ axios
const api = axios.create({
  // กำหนด URL พื้นฐานของ Backend API ของคุณ
  baseURL: '/api' 
});

// ใช้ Interceptor เพื่อดักจับทุก Request และเพิ่ม Token เข้าไปโดยอัตโนมัติ
api.interceptors.request.use(
  (config) => {
    // ดึง token ที่เก็บไว้ใน localStorage ตอน Login สำเร็จ
    const token = localStorage.getItem('token');

    // ถ้ามี token ให้ใส่ใน Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ใช้ Interceptor เพื่อจัดการกับ Response ที่มีปัญหา (เช่น Token หมดอายุ)
api.interceptors.response.use(
  (response) => response, // ถ้าสำเร็จ ก็ส่ง response กลับไปปกติ
  (error) => {
    // ตรวจสอบถ้า Error เป็น 401 (Unauthorized) หรือ 403 (Forbidden)
    if (error.response && [401, 403].includes(error.response.status)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      Swal.fire({ icon: 'error', title: 'เซสชันหมดอายุ', text: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง', timer: 3000, showConfirmButton: false, timerProgressBar: true })
        .then(() => { window.location.href = '/'; });
    }
    return Promise.reject(error);
  }
);

export default api;