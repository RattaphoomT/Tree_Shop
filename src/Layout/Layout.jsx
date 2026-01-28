import React from "react";
import { Box, AppBar, Toolbar, IconButton, Typography, useTheme, useMediaQuery, Button, Avatar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const theme = useTheme();
  // ตรวจสอบว่าเป็นมือถือหรือไม่ (breakpoint 'md' ลงไปถือเป็น mobile/tablet)
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // ถ้าเป็นมือถือ เริ่มต้นให้ปิด (false), ถ้า Desktop เริ่มต้นให้เปิด (true)
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); // กลับไปหน้า Login
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "linear-gradient(135deg, #2d5a3d 0%, #1a472a 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleToggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ระบบจัดการร้านต้นไม้
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <AccountCircleIcon fontSize="small" />
                </Avatar>
                <Typography variant="body1">
                  {user.username}
                </Typography>
              </Box>
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>ออกจากระบบ</Typography>
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile} // ส่งค่า isMobile ไปบอก Sidebar
      />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: 8, 
          // ถ้าไม่ใช่ Mobile ให้เว้นที่ซ้ายสำหรับ Sidebar (แบบย่อหรือขยาย)
          // แต่เนื่องจาก Logic Sidebar เดิมของคุณซับซ้อน เราให้ Box ขยับเองตาม Flow ปกติ
          // หรือถ้าใช้ Permanent Drawer บน Desktop ต้องจัดการ Margin ตรงนี้
          ml: isMobile ? 0 : (sidebarOpen ? "260px" : "80px"),
          transition: "margin 0.5s ease",
          width: isMobile ? "100%" : `calc(100% - ${sidebarOpen ? 260 : 80}px)`
        }}
      >
        {children}
      </Box>
    </Box>
  );
}