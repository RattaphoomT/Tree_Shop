import React, { useState, useEffect } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

// --- Libraries ---
import Swal from "sweetalert2";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from "dayjs/plugin/buddhistEra";

// --- Config Date ---
dayjs.extend(buddhistEra);
dayjs.locale('th');

// --- MUI Imports ---
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Stack, TextField,
  InputAdornment, TablePagination, Dialog, DialogContent,
  DialogActions, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Card, Avatar, Tooltip, CircularProgress, alpha, useTheme
} from "@mui/material";

// --- Icons ---
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HistoryIcon from "@mui/icons-material/History"; // ใช้ไอคอนนี้สำหรับ Header
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import { visuallyHidden } from "@mui/utils"; // เผื่อใช้ sorting ในอนาคต

const History = () => {
  const theme = useTheme();
  
  // --- States ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // เพิ่ม Filter Status
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog States
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Edit Form State
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");

  // --- Fetch Data ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "Orders"), orderBy("transaction_date", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- Handlers ---

  // 1. Search & Filter
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderNo = (order.order_number || "").toLowerCase();
    
    // Filter by Search Term
    const matchesSearch = orderNo.includes(term);

    // Filter by Status Dropdown
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // 2. Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 3. View Details
  const handleView = (order) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  // 4. Edit Order
  const handleEdit = (order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPayment(order.payment_method);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const orderRef = doc(db, "Orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: editStatus,
        payment_method: editPayment
      });
      
      const updatedOrders = orders.map(o => 
        o.id === selectedOrder.id ? { ...o, status: editStatus, payment_method: editPayment } : o
      );
      setOrders(updatedOrders);
      setEditOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลคำสั่งซื้อถูกแก้ไขเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Update error:", error);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการแก้ไข", "error");
    }
  };

  // 5. Delete Order
  const handleDeleteClick = (order) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบรายการ ${order.order_number} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "Orders", order.id));
          setOrders(orders.filter(o => o.id !== order.id));
          Swal.fire('ลบสำเร็จ!', 'รายการถูกลบเรียบร้อยแล้ว.', 'success');
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire("Error", "ไม่สามารถลบข้อมูลได้", "error");
        }
      }
    });
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  // ✅ Helper: Status Render (ปรับสไตล์ Chip)
  const renderStatus = (status) => {
    switch (status) {
      case 'completed': 
        return <Chip icon={<CheckCircleOutlineIcon />} label="สำเร็จ" color="success" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'pending': 
        return <Chip icon={<HourglassEmptyIcon />} label="รอชำระ" color="warning" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'cancelled': 
        return <Chip icon={<CancelOutlinedIcon />} label="ยกเลิก" color="error" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      default: 
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f5f5f5">
            <CircularProgress size={60} color="primary" />
            <Typography variant="h6" color="textSecondary" mt={3} fontWeight="bold">กำลังโหลดประวัติการขาย...</Typography>
        </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5, fontFamily: "Sarabun, sans-serif" }}>
      <style>{` .swal2-container { z-index: 20000 !important; } `}</style>

      {/* --- HEADER --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexDirection={{ xs: "column", md: "row" }} gap={2}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <HistoryIcon sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }} />
            จัดการประวัติการขาย
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            รายการคำสั่งซื้อทั้งหมด ({orders.length} รายการ)
          </Typography>
        </Box>
      </Box>

      {/* --- FILTER SECTION (เหมือนหน้า Product) --- */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "white", border: "1px solid #e0e0e0" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <TextField
            placeholder="ค้นหาเลขบิล..."
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
            <InputLabel>
              <FilterAltIcon sx={{ fontSize: 16, verticalAlign: "text-top", mr: 0.5 }} />
              สถานะ
            </InputLabel>
            <Select
              value={filterStatus}
              label="สถานะ"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="completed">✅ สำเร็จ</MenuItem>
              <MenuItem value="pending">⚠️ รอชำระ</MenuItem>
              <MenuItem value="cancelled">❌ ยกเลิก</MenuItem>
            </Select>
          </FormControl>
          
          {(searchTerm || filterStatus !== "all") && (
            <Button variant="outlined" color="inherit" startIcon={<RestartAltIcon />} onClick={handleResetFilter} sx={{ borderColor: "#ddd", color: "#666", whiteSpace: "nowrap" }}>
              ล้างตัวกรอง
            </Button>
          )}
        </Stack>
      </Paper>

      {/* --- TABLE --- */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table sx={{ minWidth: 700 }}>
          {/* ✅ Table Head สีเขียวเหมือน Product */}
          <TableHead sx={{ bgcolor: "#4caf50" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>วันที่/เวลา</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>เลขที่บิล</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ยอดสุทธิ</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ชำระโดย</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>สถานะ</TableCell>
              <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                    <Typography variant="body2" fontWeight="500">
                        {order.transaction_date?.seconds 
                            ? dayjs(order.transaction_date.seconds * 1000).format('D MMM BBBB HH:mm') 
                            : '-'}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontWeight="700" color="primary">
                        {order.order_number}
                    </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                    ฿{Number(order.grand_total).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'} 
                    size="small" 
                    sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 'bold' }} 
                  />
                </TableCell>
                <TableCell>
                  {renderStatus(order.status)}
                </TableCell>
                <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="ดูรายละเอียด">
                            <IconButton size="small" onClick={() => handleView(order)} sx={{ color: "#1976d2", bgcolor: "#e3f2fd", '&:hover': { bgcolor: "#bbdefb" } }}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไข">
                            <IconButton size="small" onClick={() => handleEdit(order)} sx={{ color: "#ed6c02", bgcolor: "#fff3e0", '&:hover': { bgcolor: "#ffe0b2" } }}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบรายการ">
                            <IconButton size="small" onClick={() => handleDeleteClick(order)} sx={{ color: "#ef5350", bgcolor: "#ffebee", '&:hover': { bgcolor: "#ffcdd2" } }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบรายการคำสั่งซื้อ</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Section */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2, borderTop: "1px solid #eee" }}>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredOrders.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="แสดงแถว:"
            />
        </Box>
      </TableContainer>

      {/* --- 1. VIEW DIALOG (Professional Style) --- */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: '#0288d1', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: '#0288d1' }}><ReceiptLongIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">รายละเอียดคำสั่งซื้อ</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedOrder?.order_number}</Typography>
                </Box>
             </Box>
             <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedOrder && (
            <Stack spacing={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Grid container spacing={2}>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">วันที่ทำรายการ</Typography><Typography variant="body2" fontWeight="bold">{selectedOrder.transaction_date?.seconds ? dayjs(selectedOrder.transaction_date.seconds * 1000).format('D MMMM BBBB HH:mm') : '-'}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">สถานะ</Typography><Box>{renderStatus(selectedOrder.status)}</Box></Grid>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">วิธีชำระเงิน</Typography><Typography variant="body2">{selectedOrder.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}</Typography></Grid>
                  </Grid>
              </Box>
              
              <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">รายการสินค้า ({selectedOrder.items?.length || 0})</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#eee' }}><TableRow><TableCell>สินค้า</TableCell><TableCell align="right">ราคา</TableCell><TableCell align="right">รวม</TableCell></TableRow></TableHead>
                        <TableBody>
                            {selectedOrder.items?.map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="500">{item.product_name || item.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">x{item.qty || item.quantity}</Typography>
                                    </TableCell>
                                    <TableCell align="right">{Number(item.selling_price || item.price).toLocaleString()}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{((item.qty || item.quantity) * (item.selling_price || item.price)).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </TableContainer>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '2px dashed #ccc' }}>
                  <Typography variant="subtitle1" fontWeight="bold">ยอดรวมสุทธิ</Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">฿{Number(selectedOrder.grand_total).toLocaleString()}</Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setViewOpen(false)} sx={{ color: 'text.secondary' }}>ปิดหน้าต่าง</Button>
            {/* Optional: Add Print Button here */}
        </DialogActions>
      </Dialog>

      {/* --- 2. EDIT DIALOG (Professional Style) --- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
         <Box sx={{ bgcolor: '#ed6c02', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: '#ed6c02' }}><EditOutlinedIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">แก้ไขคำสั่งซื้อ</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedOrder?.order_number}</Typography>
                </Box>
             </Box>
             <IconButton onClick={() => setEditOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 4 }}>
          <Stack spacing={3}>
              <FormControl fullWidth>
                  <InputLabel>สถานะออเดอร์</InputLabel>
                  <Select value={editStatus} label="สถานะออเดอร์" onChange={(e) => setEditStatus(e.target.value)}>
                      <MenuItem value="completed"><Stack direction="row" alignItems="center" spacing={1}><CheckCircleOutlineIcon color="success" fontSize="small"/><span>สำเร็จ (Completed)</span></Stack></MenuItem>
                      <MenuItem value="pending"><Stack direction="row" alignItems="center" spacing={1}><HourglassEmptyIcon color="warning" fontSize="small"/><span>รอชำระ (Pending)</span></Stack></MenuItem>
                      <MenuItem value="cancelled"><Stack direction="row" alignItems="center" spacing={1}><CancelOutlinedIcon color="error" fontSize="small"/><span>ยกเลิก (Cancelled)</span></Stack></MenuItem>
                  </Select>
              </FormControl>

              <FormControl fullWidth>
                  <InputLabel>วิธีการชำระเงิน</InputLabel>
                  <Select value={editPayment} label="วิธีการชำระเงิน" onChange={(e) => setEditPayment(e.target.value)}>
                      <MenuItem value="cash">เงินสด (Cash)</MenuItem>
                      <MenuItem value="transfer">โอนเงิน (Transfer)</MenuItem>
                  </Select>
              </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary' }}>ยกเลิก</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="warning" startIcon={<SaveIcon />}>บันทึกการแก้ไข</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default History;