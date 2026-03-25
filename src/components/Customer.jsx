import React, { useState, useEffect } from "react";
import api from "./api";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

// Config Date
dayjs.extend(buddhistEra);
dayjs.locale("th");

// --- Material UI Imports ---
import {
  Container, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Box,
  FormControl, InputLabel, Select, MenuItem, Chip, InputAdornment,
  Stack, Tooltip, CircularProgress, Avatar, TablePagination,
} from "@mui/material";

// --- Icons Imports ---
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

const Customer = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_name: "",
    phone_number: "",
    points_balance: 0,
    member_level: "Standard",
  });
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- Filter & Search ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  // --- Pagination ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/customers");
      setCustomers(response.data);
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลลูกค้าได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: FILTER / SEARCH ---
  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (customer.customer_name || "").toLowerCase().includes(term) ||
      (customer.phone_number || "").toLowerCase().includes(term);

    const matchesLevel =
      filterLevel === "all" || customer.member_level === filterLevel;

    return matchesSearch && matchesLevel;
  });

  // --- HANDLERS: PAGINATION ---
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- HANDLERS: CRUD ---
  const handleChang = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      customer_name: "",
      phone_number: "",
      points_balance: 0,
      member_level: "Standard",
    });
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditId(customer.id);
    setForm({
      customer_name: customer.customer_name || "",
      phone_number: customer.phone_number || "",
      points_balance: customer.points_balance || 0,
      member_level: customer.member_level || "Standard",
    });
    setErrors({});
    setOpen(true);
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.customer_name) newErrors.customer_name = "กรุณากรอกชื่อลูกค้า";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
      } else {
        await api.post("/customers", form);
      }

      Swal.fire({
        icon: "success",
        title: editId ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มลูกค้าใหม่สำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      await fetchCustomers();
      setOpen(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
      Swal.fire("เกิดข้อผิดพลาด", errorMessage, "error");
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบลูกค้า "${name}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/customers/${id}`);
          Swal.fire("ลบสำเร็จ!", "ข้อมูลลูกค้าถูกลบแล้ว", "success");
          await fetchCustomers();
        } catch (err) {
          const errorMessage =
            err.response?.data?.message || "เกิดข้อผิดพลาดในการลบ";
          Swal.fire("เกิดข้อผิดพลาด", errorMessage, "error");
        }
      }
    });
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterLevel("all");
  };

  const renderLevelChip = (level) => {
    const styles = {
        Standard: { color: 'default', label: 'Standard' },
        Silver: { color: 'info', label: 'Silver' },
        Gold: { color: 'warning', label: 'Gold' },
        Platinum: { color: 'secondary', label: 'Platinum' },
    };
    const style = styles[level] || styles.Standard;
    return <Chip label={style.label} color={style.color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <style>{` .swal2-container { z-index: 20000 !important; } `}</style>
      {/* --- HEADER --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <PeopleIcon sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }} />
            จัดการข้อมูลลูกค้า
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            รายชื่อลูกค้าทั้งหมด ({customers.length} คน)
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
          เพิ่มลูกค้าใหม่
        </Button>
      </Box>

      {/* --- FILTER --- */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <TextField
            placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} fullWidth>
            <InputLabel>ระดับสมาชิก</InputLabel>
            <Select value={filterLevel} label="ระดับสมาชิก" onChange={(e) => setFilterLevel(e.target.value)}>
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Platinum">Platinum</MenuItem>
            </Select>
          </FormControl>
          {(searchTerm || filterLevel !== "all") && (
            <Button variant="outlined" color="inherit" startIcon={<RestartAltIcon />} onClick={handleResetFilter}>
              ล้างตัวกรอง
            </Button>
          )}
        </Stack>
      </Paper>

      {/* --- TABLE --- */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "primary.main" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ชื่อ-สกุล</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>เบอร์โทรศัพท์</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ระดับสมาชิก</TableCell>
              <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>แต้มสะสม</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>วันที่สมัคร</TableCell>
              <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{customer.customer_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{customer.phone_number || "-"}</Typography>
                </TableCell>
                <TableCell>{renderLevelChip(customer.member_level)}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">{Number(customer.points_balance || 0).toLocaleString()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(customer.registered_at).format("D MMM YYYY")}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="แก้ไขข้อมูล">
                      <IconButton size="small" onClick={() => handleOpenEdit(customer)} color="warning">
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบลูกค้า">
                      <IconButton size="small" onClick={() => handleDelete(customer.id, customer.customer_name)} color="error">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">ไม่พบข้อมูลลูกค้า</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="แสดง:"
        />
      </TableContainer>

      {/* --- DIALOG: ADD/EDIT CUSTOMER --- */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            {editId ? <EditOutlinedIcon /> : <AddCircleOutlineIcon />}
          </Avatar>
          {editId ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Stack spacing={3} mt={1}>
            <TextField
              autoFocus
              label="* ชื่อ-สกุล ลูกค้า"
              name="customer_name"
              fullWidth
              value={form.customer_name}
              onChange={handleChang}
              error={!!errors.customer_name}
              helperText={errors.customer_name}
            />
            <TextField
              label="เบอร์โทรศัพท์"
              name="phone_number"
              fullWidth
              value={form.phone_number}
              onChange={handleChang}
            />
            <FormControl fullWidth>
              <InputLabel>ระดับสมาชิก</InputLabel>
              <Select
                name="member_level"
                value={form.member_level}
                label="ระดับสมาชิก"
                onChange={handleChang}
                startAdornment={<InputAdornment position="start"><CardMembershipIcon /></InputAdornment>}
              >
                <MenuItem value="Standard">Standard</MenuItem>
                <MenuItem value="Silver">Silver</MenuItem>
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Platinum">Platinum</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="แต้มสะสม"
              name="points_balance"
              type="number"
              fullWidth
              value={form.points_balance}
              onChange={handleChang}
              InputProps={{
                startAdornment: <InputAdornment position="start"><StarBorderIcon /></InputAdornment>
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setOpen(false)} color="inherit">ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editId ? "บันทึกการแก้ไข" : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Customer;