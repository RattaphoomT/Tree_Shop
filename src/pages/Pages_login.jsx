import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider, keyframes } from '@mui/material/styles';
import ForestIcon from '@mui/icons-material/Forest';
import Alert from '@mui/material/Alert';

// 1. สร้าง Theme ให้เข้ากับร้านต้นไม้ (โทนสีเขียวธรรมชาติ)
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', 
    },
    secondary: {
      main: '#ff9800', 
    },
    background: {
      default: '#f4f6f8', 
    },
  },
  typography: {
    fontFamily: 'Sarabun, sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
  },
});

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Copyright = (props) => {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="#">GreenStock</Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

const Pages_login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // --- เพิ่ม useEffect เพื่อเช็คว่ามี Token อยู่แล้วหรือไม่ ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // ถ้ามี Token อยู่แล้ว ให้เด้งไปหน้า /pos ทันที
      navigate('/pos', { replace: true });
    }
  }, [navigate]);

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
      return; 
    }

    try {
      const response = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); 
        navigate('/pos');
      } else {
        const errorData = await response.json(); 
        setErrors({ api: errorData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }); 
      }
    } catch (err) {
      setErrors({ api: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
      console.error('Login error:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="main"
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundImage: 'url(https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1373)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': { 
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <CssBaseline />
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4 },
            zIndex: 2,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
            maxWidth: 450,
            width: '100%',
            mx: 2,
            animation: `${fadeIn} 0.8s ease-out`,
          }}
        >
          <Box sx={{
            m: 1,
            background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 3
          }}>
            <ForestIcon sx={{ color: 'white', fontSize: 40 }} />
          </Box>

          <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 1, color: '#333' }}>
            เข้าสู่ระบบจัดการสต็อก
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            ยินดีต้อนรับกลับ! กรุณากรอกข้อมูลเพื่อดำเนินการต่อ
          </Typography>

          {errors.api && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {errors.api}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="อีเมล หรือ ชื่อผู้ใช้"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username} 
              helperText={errors.username || ''} 
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
              error={!!errors.password} 
              helperText={errors.password || ''} 
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
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)', 
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.6)',
                }
              }}
            >
              เข้าสู่ระบบ
            </Button>

            <Copyright sx={{ mt: 5 }} />
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Pages_login;
