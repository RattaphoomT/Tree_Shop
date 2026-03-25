import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ForestIcon from '@mui/icons-material/Forest'; // ไอคอนต้นไม้สื่อถึง Stock

// 1. สร้าง Theme ให้เข้ากับร้านต้นไม้ (โทนสีเขียวธรรมชาติ)
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // สีเขียวใบไม้ (Forest Green)
    },
    secondary: {
      main: '#81c784', // สีเขียวอ่อน
    },
    background: {
      default: '#f4f6f8', // สีพื้นหลังเทาอ่อน สบายตา
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const Copyright = (props) => {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="#">
        My Plant Stock System
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

const Pages_login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // เปลี่ยน state เป็น object เพื่อเก็บ error แยกช่อง
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({}); // Reset errors

    // --- ตรวจสอบข้อมูลฝั่ง Client ก่อนส่ง ---
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    }
    if (!password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // หยุดการทำงานถ้าข้อมูลไม่ครบ
    }

    try {
      // นี่คือส่วนที่ต้องเรียก API ไปยัง Backend ของคุณ
      const response = await fetch('/api/auth/login', { // แก้ไข Endpoint ให้ถูกต้อง
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // ถ้า Backend ตอบกลับว่า Login สำเร็จ
        const data = await response.json();
        // เก็บ Token ที่ได้จาก Backend ไว้ใน LocalStorage เพื่อใช้ยืนยันตัวตนในหน้าอื่นๆ
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // <-- เพิ่มบรรทัดนี้
        navigate('/pos');
      } else {
        // ถ้า Login ไม่สำเร็จ (เช่น ชื่อผู้ใช้/รหัสผ่านผิด)
        const errorData = await response.json(); // ดึงข้อมูล error จาก backend
        setErrors({ api: errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }); // แสดง error ที่ได้
      }
    } catch (err) {
      // กรณีที่ network error หรือ server ไม่ทำงาน
      setErrors({ api: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
      console.error('Login error:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        
        {/* ส่วนรูปภาพด้านซ้าย (จะซ่อนเมื่ออยู่บนมือถือ) */}
        <Grid
          item size={{ xs: false, sm: 4, md: 7 }}
          sx={{
            backgroundImage: 'url(https://www.chillpainai.com/src/wewakeup/scoop/images/01ee261f6aecc847d6a8945826b51f9d2ca854b1.jpg)', // รูปต้นไม้สวยๆ จาก Unsplash
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
            {/* Overlay เพื่อให้ข้อความบนภาพอ่านง่ายขึ้น (Optional) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // เงาดำจางๆ
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    display: { xs: 'none', sm: 'flex' }
                }}
            >
                <Typography variant="h3" component="h1" fontWeight="bold">
                    ร้านต้นไม้ป้าเช็ง
                </Typography>
                <Typography variant="h6">
                    Inventory Management System
                </Typography>
            </Box>
        </Grid>

        {/* ส่วนฟอร์ม Login ด้านขวา */}
        <Grid item size={{ xs: 12, sm: 8, md: 5 }} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '80%',
              justifyContent: 'center'
            }}
          >
            {/* Logo หรือ Icon ด้านบนฟอร์ม */}
            <Box sx={{ 
                m: 1, 
                bgcolor: 'primary.main', 
                borderRadius: '50%', 
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3
            }}>
              <ForestIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>

            <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#333' }}>
              เข้าสู่ระบบจัดการสต็อก
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ยินดีต้อนรับกลับ! กรุณากรอกข้อมูลเพื่อดำเนินการต่อ
            </Typography>

            {/* แสดงข้อความ Error ถ้ามี */}
            {errors.api && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>{errors.api}</Typography>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%', maxWidth: '400px' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="อีเมล หรือ ชื่อผู้ใช้"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username} // แสดงกรอบสีแดงถ้ามี error
                helperText={errors.username || ''} // แสดงข้อความ error ใต้ช่อง
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                        },
                    },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="รหัสผ่าน"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password} // แสดงกรอบสีแดงถ้ามี error
                helperText={errors.password || ''} // แสดงข้อความ error ใต้ช่อง
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                    control={<Checkbox value="remember" color="primary" />}
                    label="จดจำฉันไว้"
                />
                <Link href="#" variant="body2" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                    ลืมรหัสผ่าน?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                    mt: 3, 
                    mb: 2, 
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)', // เงาสีเขียวสวยๆ
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.6)',
                    }
                }}
              >
                เข้าสู่ระบบ
              </Button>

              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default Pages_login;