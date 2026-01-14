import React, { useState, useEffect } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

// --- Libraries ---
import Swal from "sweetalert2";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from "dayjs/plugin/buddhistEra"; // ✅ เพิ่ม Plugin ปี พ.ศ.

// --- Config Date ---
dayjs.extend(buddhistEra);
dayjs.locale('th'); // ✅ ตั้งค่าภาษาไทย

// --- MUI Imports ---
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Stack, TextField,
  InputAdornment, TablePagination, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid, Divider, FormControl, InputLabel, Select, MenuItem,
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

const History = () => {
  const theme = useTheme();
  
  // --- States ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  // 1. Search Filter
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderNo = (order.order_number || "").toLowerCase();
    const status = (order.status || "").toLowerCase();
    const payment = (order.payment_method || "").toLowerCase();
    return orderNo.includes(term) || status.includes(term) || payment.includes(term);
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

  // ✅ Helper: Status Render (สีเหมือน Dashboard)
  const renderStatus = (status) => {
    switch (status) {
      case 'completed': 
        return (
          <Chip 
            icon={<CheckCircleOutlineIcon sx={{ fontSize: '18px !important', color: theme.palette.success.dark }} />} 
            label="สำเร็จ" 
            size="small" 
            sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.16), 
              color: theme.palette.success.dark, 
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '1px solid transparent'
            }} 
          />
        );
      case 'pending': 
        return (
          <Chip 
            icon={<HourglassEmptyIcon sx={{ fontSize: '18px !important', color: theme.palette.warning.dark }} />} 
            label="รอชำระ" 
            size="small" 
            sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.16), 
              color: theme.palette.warning.dark, 
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '1px solid transparent'
            }} 
          />
        );
      case 'cancelled': 
        return (
          <Chip 
            icon={<CancelOutlinedIcon sx={{ fontSize: '18px !important', color: theme.palette.error.dark }} />} 
            label="ยกเลิก" 
            size="small" 
            sx={{ 
              bgcolor: alpha(theme.palette.error.main, 0.16), 
              color: theme.palette.error.dark, 
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '1px solid transparent'
            }} 
          />
        );
      default: 
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) return <Box height="100vh" display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', pb: 6 }}>
      <Container maxWidth={false} sx={{ pt: 4, px: { xs: 2, md: 4 } }}>
        
        {/* --- Header Section --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', letterSpacing: '-0.5px' }}>ประวัติการขาย</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>ตรวจสอบและจัดการรายการคำสั่งซื้อย้อนหลัง</Typography>
            </Box>
            
            <TextField
                size="small"
                placeholder="ค้นหาเลขบิล, สถานะ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                    sx: { bgcolor: 'white', borderRadius: 2, minWidth: 300, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
                }}
            />
        </Stack>

        {/* --- Data Table Card --- */}
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ pl: 3, py: 2, fontWeight: 700, color: 'text.secondary' }}>วันที่/เวลา</TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>เลขที่บิล</TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>ยอดสุทธิ</TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>ชำระโดย</TableCell>
                  <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary' }}>สถานะ</TableCell>
                  <TableCell align="center" sx={{ pr: 3, py: 2, fontWeight: 700, color: 'text.secondary' }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                  <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #F2F4F7' } }}>
                    {/* ✅ วันที่แบบไทย: 13 ม.ค. 2569 15:30 */}
                    <TableCell sx={{ pl: 3 }}>
                        <Typography variant="body2" fontWeight="500">
                            {order.transaction_date?.seconds 
                                ? dayjs(order.transaction_date.seconds * 1000).format('D MMM BBBB HH:mm') 
                                : '-'}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="subtitle2" fontFamily="monospace" fontWeight="700" color="primary.main">
                            {order.order_number}
                        </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00AB55' }}>
                        ฿{Number(order.grand_total).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'} 
                        size="small" 
                        sx={{ borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 'bold' }} 
                      />
                    </TableCell>
                    <TableCell>
                      {renderStatus(order.status)}
                    </TableCell>
                    <TableCell align="center" sx={{ pr: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="ดูรายละเอียด">
                                <IconButton size="small" onClick={() => handleView(order)} sx={{ color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) } }}>
                                    <VisibilityIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="แก้ไข">
                                <IconButton size="small" onClick={() => handleEdit(order)} sx={{ color: theme.palette.warning.main, bgcolor: alpha(theme.palette.warning.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) } }}>
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="ลบรายการ">
                                <IconButton size="small" onClick={() => handleDeleteClick(order)} sx={{ color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography color="text.secondary">ไม่พบประวัติการขาย</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
        </Card>

        {/* --- 1. View Details Dialog --- */}
        <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
             <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><ReceiptLongIcon /></Avatar>
                <Typography variant="h6" fontWeight="bold">รายละเอียดคำสั่งซื้อ</Typography>
             </Stack>
             <IconButton onClick={() => setViewOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            {selectedOrder && (
              <Stack spacing={2.5}>
                <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #eee' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">เลขที่บิล</Typography><Typography variant="subtitle2" fontWeight="bold">{selectedOrder.order_number}</Typography></Grid>
                        {/* ✅ วันที่แบบไทยใน Dialog */}
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">วันที่</Typography><Typography variant="subtitle2">{selectedOrder.transaction_date?.seconds ? dayjs(selectedOrder.transaction_date.seconds * 1000).format('D MMMM BBBB HH:mm') : '-'}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">สถานะ</Typography><Box mt={0.5}>{renderStatus(selectedOrder.status)}</Box></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">ชำระโดย</Typography><Typography variant="subtitle2">{selectedOrder.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}</Typography></Grid>
                    </Grid>
                </Box>
                
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1}>รายการสินค้า ({selectedOrder.items?.length || 0})</Typography>
                    <Box sx={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>สินค้า</TableCell><TableCell align="right">ราคา</TableCell><TableCell align="right">รวม</TableCell></TableRow></TableHead>
                            <TableBody>
                                {selectedOrder.items?.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">{item.product_name || item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">x{item.qty || item.quantity}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{Number(item.selling_price || item.price).toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{((item.qty || item.quantity) * (item.selling_price || item.price)).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '2px dashed #eee' }}>
                    <Typography variant="subtitle1" fontWeight="bold">ยอดรวมสุทธิ</Typography>
                    <Typography variant="h5" fontWeight="800" color="primary">฿{Number(selectedOrder.grand_total).toLocaleString()}</Typography>
                </Stack>
              </Stack>
            )}
          </DialogContent>
        </Dialog>

        {/* --- 2. Edit Dialog --- */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>แก้ไขคำสั่งซื้อ</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={3} mt={1}>
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5, bgcolor: '#fff4e5', color: '#663c00', borderRadius: 1 }}>
                    กำลังแก้ไขบิลเลขที่: <b>{selectedOrder?.order_number}</b>
                </Typography>
                
                <FormControl fullWidth size="small">
                    <InputLabel>สถานะออเดอร์</InputLabel>
                    <Select value={editStatus} label="สถานะออเดอร์" onChange={(e) => setEditStatus(e.target.value)}>
                        <MenuItem value="completed"><Stack direction="row" alignItems="center" spacing={1}><CheckCircleOutlineIcon color="success" fontSize="small"/><span>สำเร็จ (Completed)</span></Stack></MenuItem>
                        <MenuItem value="pending"><Stack direction="row" alignItems="center" spacing={1}><HourglassEmptyIcon color="warning" fontSize="small"/><span>รอชำระ (Pending)</span></Stack></MenuItem>
                        <MenuItem value="cancelled"><Stack direction="row" alignItems="center" spacing={1}><CancelOutlinedIcon color="error" fontSize="small"/><span>ยกเลิก (Cancelled)</span></Stack></MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>วิธีการชำระเงิน</InputLabel>
                    <Select value={editPayment} label="วิธีการชำระเงิน" onChange={(e) => setEditPayment(e.target.value)}>
                        <MenuItem value="cash">เงินสด (Cash)</MenuItem>
                        <MenuItem value="transfer">โอนเงิน (Transfer)</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit" variant="outlined" sx={{ borderRadius: 2 }}>ยกเลิก</Button>
            <Button onClick={handleSaveEdit} variant="contained" color="primary" startIcon={<SaveIcon />} sx={{ borderRadius: 2, boxShadow: 'none' }}>บันทึกการแก้ไข</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default History;