import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      // ถ้าไม่มี token, แสดง popup แจ้งเตือน
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเข้าถึงหน้านี้ได้',
        timer: 4000, // แสดงเป็นเวลา 4 วินาที
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        // หลังจาก popup ปิด, นำทางไปยังหน้า login
        navigate('/', { replace: true });
      });
      return; // หยุดการทำงานถ้าไม่มี token
    }

    // ถ้ามี token, ตรวจสอบสิทธิ์การเข้าถึงตาม Role
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userRole = user?.role;
      const currentPath = location.pathname;

      // กำหนดหน้าที่ "Staff" สามารถเข้าถึงได้
      const staffAllowedRoutes = ['/pos', '/dashboard'];

      if (userRole === 'Staff' && !staffAllowedRoutes.includes(currentPath)) {
        // ถ้าเป็น Staff และพยายามเข้าถึงหน้าที่ไม่มีสิทธิ์
        Swal.fire({
          icon: 'warning',
          title: 'ไม่มีสิทธิ์เข้าถึง',
          text: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
          timer: 3000,
          showConfirmButton: false,
          timerProgressBar: true,
        }).then(() => {
          navigate('/pos', { replace: true }); // ส่งกลับไปหน้าที่ได้รับอนุญาต
        });
      }
    } catch (error) {
      // กรณีข้อมูล user ใน localStorage ผิดพลาด, ให้ logout
      console.error("Error processing user role:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/', { replace: true });
    }
  }, [token, navigate, location.pathname]); // ตรวจสอบใหม่ทุกครั้งที่ path เปลี่ยน

  // ถ้ามี token, ให้แสดงหน้าเว็บตามปกติ, ถ้าไม่มี, ไม่ต้องแสดงอะไร (เพราะกำลังจะ redirect)
  return token ? <Outlet /> : null;
};

export default ProtectedRoute;