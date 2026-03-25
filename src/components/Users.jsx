import React, { useState, useEffect } from 'react';
import api from './api';
import Swal from 'sweetalert2';

// --- Material UI Imports ---
import {
  Box, Container, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, Tooltip, CircularProgress, Switch, FormControlLabel,
  Select, MenuItem, InputLabel, FormControl, Chip
} from '@mui/material';

// --- Icons Imports ---
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';

const Users = () => {
    // --- STATE MANAGEMENT ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'Staff',
        is_active: true,
    });
    const [errors, setErrors] = useState({});

    // --- DATA FETCHING ---
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS: FORM & DIALOG ---
    const handleChang = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setForm({
            username: '',
            password: '',
            confirmPassword: '',
            role: 'Staff',
            is_active: true,
        });
        setErrors({});
        setOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditId(user.id);
        setForm({
            username: user.username,
            password: '', // Password is not fetched, should be entered if needs to be changed
            confirmPassword: '',
            role: user.role,
            is_active: user.is_active === 1,
        });
        setErrors({});
        setOpen(true);
    };

    // --- HANDLERS: CRUD ---
    const handleSave = async () => {
        const newErrors = {};
        if (!form.username.trim()) newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
        if (!form.role) newErrors.role = 'กรุณาเลือกบทบาท';

        // Password validation
        if (!editId && !form.password) { // Require password for new user
            newErrors.password = 'กรุณากรอกรหัสผ่าน';
        }
        if (form.password && form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
        }
        if (form.password && form.password.length < 6) {
            newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Prepare payload, don't send empty password
        const payload = {
            username: form.username,
            role: form.role,
            is_active: form.is_active,
        };
        if (form.password) {
            payload.password = form.password;
        }

        try {
            if (editId) {
                await api.put(`/users/${editId}`, payload);
            } else {
                await api.post('/users', payload);
            }

            Swal.fire({
                icon: 'success',
                title: editId ? 'อัปเดตข้อมูลสำเร็จ' : 'เพิ่มผู้ใช้ใหม่สำเร็จ',
                timer: 1500,
                showConfirmButton: false,
            });

            await fetchUsers();
            setOpen(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
            Swal.fire('เกิดข้อผิดพลาด', errorMessage, 'error');
        }
    };

    const handleDelete = (id, name) => {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณต้องการลบผู้ใช้ "${name}" ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'ยกเลิก',
            confirmButtonText: 'ใช่, ลบเลย',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/users/${id}`);
                    Swal.fire('ลบสำเร็จ!', 'ข้อมูลผู้ใช้ถูกลบแล้ว', 'success');
                    await fetchUsers();
                } catch (err) {
                    const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ';
                    Swal.fire('เกิดข้อผิดพลาด', errorMessage, 'error');
                }
            }
        });
    };

    // --- RENDER HELPERS ---
    const renderRoleChip = (role) => {
        const styles = {
            Owner: { color: 'error', icon: <AdminPanelSettingsIcon />, label: 'เจ้าของร้าน' },
            Manager: { color: 'warning', icon: <SupervisorAccountIcon />, label: 'ผู้จัดการ' },
            Staff: { color: 'info', icon: <PersonIcon />, label: 'พนักงาน' },
        };
        const style = styles[role] || { color: 'default', icon: <PersonIcon />, label: role };
        return <Chip icon={style.icon} label={style.label} color={style.color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
            <style>{`.swal2-container { z-index: 20000 !important; }`}</style>
            
            {/* --- HEADER --- */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        <ManageAccountsIcon sx={{ fontSize: 35, verticalAlign: 'middle', mr: 1 }} />
                        จัดการผู้ใช้งาน
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mt={0.5}>
                        รายชื่อผู้ใช้งานในระบบ ({users.length} คน)
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleOpenAdd}
                    sx={{ borderRadius: 2, px: 3, py: 1.5 }}
                >
                    เพิ่มผู้ใช้ใหม่
                </Button>
            </Box>

            {/* --- TABLE --- */}
            <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#4caf50' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ชื่อผู้ใช้ (Username)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>บทบาท (Role)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>สถานะ (Status)</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>จัดการ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{user.username}</Typography>
                                </TableCell>
                                <TableCell>{renderRoleChip(user.role)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                        color={user.is_active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Tooltip title="แก้ไขข้อมูล">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(user)}
                                                sx={{
                                                    color: "#ff9800",
                                                    bgcolor: "#fff3e0",
                                                    "&:hover": { bgcolor: "#ffe0b2" },
                                                }}
                                            >
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="ลบผู้ใช้">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(user.id, user.username)}
                                                sx={{
                                                    color: "#d33",
                                                    bgcolor: "#ffebee",
                                                    "&:hover": { bgcolor: "#ffcdd2" },
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">ไม่พบข้อมูลผู้ใช้งาน</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- DIALOG: ADD/EDIT USER --- */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: editId ? 'warning.main' : 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {editId ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                    <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 4 }}>
                    <Stack spacing={3} mt={1}>
                        <TextField
                            autoFocus
                            label="* ชื่อผู้ใช้ (Username)"
                            name="username"
                            fullWidth
                            value={form.username}
                            onChange={handleChang}
                            error={!!errors.username}
                            helperText={errors.username}
                        />
                        <TextField
                            label={editId ? "รหัสผ่านใหม่ (หากต้องการเปลี่ยน)" : "* รหัสผ่าน"}
                            name="password"
                            type="password"
                            fullWidth
                            value={form.password}
                            onChange={handleChang}
                            error={!!errors.password}
                            helperText={errors.password}
                        />
                        <TextField
                            label={editId ? "ยืนยันรหัสผ่านใหม่" : "* ยืนยันรหัสผ่าน"}
                            name="confirmPassword"
                            type="password"
                            fullWidth
                            value={form.confirmPassword}
                            onChange={handleChang}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            disabled={!form.password}
                        />
                        <FormControl fullWidth error={!!errors.role}>
                            <InputLabel>* บทบาท (Role)</InputLabel>
                            <Select
                                name="role"
                                value={form.role}
                                label="* บทบาท (Role)"
                                onChange={handleChang}
                            >
                                <MenuItem value="Staff">พนักงาน (Staff)</MenuItem>
                                <MenuItem value="Manager">ผู้จัดการ (Manager)</MenuItem>
                                <MenuItem value="Owner">เจ้าของร้าน (Owner)</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.is_active}
                                    onChange={handleChang}
                                    name="is_active"
                                    color="success"
                                />
                            }
                            label="สถานะเปิดใช้งาน"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Button onClick={() => setOpen(false)} color="inherit">ยกเลิก</Button>
                    <Button onClick={handleSave} variant="contained" color={editId ? "warning" : "primary"}>
                        {editId ? 'บันทึกการแก้ไข' : 'บันทึก'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Users;