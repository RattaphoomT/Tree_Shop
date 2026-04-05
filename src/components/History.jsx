import React, { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
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
  Autocomplete, Divider,
  InputAdornment, TablePagination, Dialog, DialogContent,
  DialogActions, Button, Grid, FormControl, InputLabel, Select, MenuItem, FormHelperText,
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
import PersonIcon from '@mui/icons-material/Person'; // NEW
import PrintIcon from '@mui/icons-material/Print';

import { visuallyHidden } from "@mui/utils"; // เผื่อใช้ sorting ในอนาคต
import api from "./api"; // ✅ Fix: Corrected import path

const History = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // --- Print Refs ---
  const smallReceiptRef = useRef();
  const handlePrintSmallReceipt = useReactToPrint({
    content: () => smallReceiptRef.current,
  });

  // --- States ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState(null); // NEW
  const [customerSearchText, setCustomerSearchText] = useState(""); // NEW
  const [customerOptions, setCustomerOptions] = useState([]); // NEW

  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog States
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openReceiptPreview, setOpenReceiptPreview] = useState(false); // For 50mm receipt preview

  // Edit Form State
  const [editStatus, setEditStatus] = useState("");

  // --- Fetch Data ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/history');
      const data = response.data;
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Customer Search Debouncing ---
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (customerSearchText.length > 1) {
        try {
          const response = await api.get(`/customers/search?q=${customerSearchText}`);
          const data = response.data;
          setCustomerOptions(data);
        } catch (error) {
          console.error("Customer search failed:", error);
        }
      } else {
        setCustomerOptions([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [customerSearchText]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- Handlers ---

  // 1. Search & Filter (Updated)
  const filteredOrders = orders.filter((order) => {
    // Search Term
    const term = searchTerm.toLowerCase();
    const orderNo = (order.receipt_no || order.order_number || "").toLowerCase(); // Search by receipt number
    const customerName = (order.customer_name || "").toLowerCase(); // Search by customer name
    
    // Filter by Search Term
    const matchesSearch = orderNo.includes(term) || customerName.includes(term);

    // Filter by Status Dropdown
    const matchesStatus = filterStatus === "all" || (order.status || 'completed') === filterStatus;
    
    // Filter by Customer (NEW)
    const matchesCustomer = !filterCustomer || order.customer_id === filterCustomer.id;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // 2. Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 3. View Details
  const handleView = async (order) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedOrder(order);
    setViewOpen(true);
    // NEW: Fetch items for this specific order
    try {
        const response = await api.get(`/history/${order.id}`);
        const items = response.data;
        setSelectedOrder(prev => ({ ...prev, items: items })); // Update state with fetched items
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "ไม่สามารถดึงรายการสินค้าในบิลได้", "error");
    }
  };

  // 4. Edit Order
  const handleEdit = (order) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      await api.put(`/history/${selectedOrder.id}`, { 
        status: editStatus 
      });
      
      await fetchOrders();
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
      const errorMessage = error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไข";
      Swal.fire("Error", errorMessage, "error");
    }
  };

  // 5. Delete Order
  const handleDeleteClick = (order) => {
    Swal.fire({
      title: `ยกเลิกบิล ${order.receipt_no || order.order_number}`,
      input: 'text',
      inputLabel: 'เหตุผลในการยกเลิก',
      inputPlaceholder: 'กรอกเหตุผลที่นี่ (เช่น ลูกค้าเปลี่ยนใจ, สินค้าชำรุด)...',
      inputValidator: (value) => {
        if (!value) {
          return 'คุณต้องระบุเหตุผลในการยกเลิก!'
        }
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ยกเลิกเลย',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      // ✅ ตรวจสอบว่าผู้ใช้กดยืนยันและมีค่าที่กรอกเข้ามา
      if (result.isConfirmed && result.value) {
        const reason = result.value;
        try {
          // ✅ ส่งเหตุผล (note) ไปใน body ของ request
          await api.delete(`/history/${order.id}`, { data: { note: reason } });
          await fetchOrders(); // Refetch after delete
          Swal.fire('ยกเลิกสำเร็จ!', 'รายการถูกยกเลิก และสต็อกสินค้าได้ถูกคืนเข้าระบบแล้ว', 'success');
        } catch (error) {
          console.error("Delete error:", error);
          const errorMessage = error.response?.data?.message || "ไม่สามารถยกเลิกรายการได้";
          Swal.fire("Error", errorMessage, "error");
        }
      }
    });
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCustomer(null); // NEW
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
            placeholder="ค้นหาเลขบิล หรือ ชื่อลูกค้า..."
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
          <Autocomplete // NEW: Customer Filter
            id="customer-filter-autocomplete"
            options={customerOptions}
            getOptionLabel={(option) => `${option.customer_name} (${option.phone_number || 'N/A'})`}
            value={filterCustomer}
            onChange={(event, newValue) => {
                setFilterCustomer(newValue);
            }}
            inputValue={customerSearchText}
            onInputChange={(event, newInputValue) => {
                setCustomerSearchText(newInputValue);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="พิมพ์เพื่อค้นหาลูกค้า..."
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <PersonIcon sx={{ fontSize: 16 }} /> ลูกค้า
                        </Box>
                    }
                    size="small"
                    fullWidth
                    sx={{ flex: 1, minWidth: 200 }}
                />
            )}
            sx={{ flex: 1, minWidth: 200 }}
          />
          
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
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ลูกค้า</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>สถานะ</TableCell>
              <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="500" noWrap>
                    {(order.order_date || order.transaction_date)
                      ? dayjs(order.order_date || order.transaction_date).format('D MMM BBBB HH:mm')
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight="700" color="primary">
                    {order.receipt_no || order.order_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                    ฿{Number(order.net_amount || order.grand_total || 0).toLocaleString()}
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
                    <Typography variant="body2" noWrap>{order.customer_name || 'ลูกค้าทั่วไป'}</Typography>
                </TableCell>
                <TableCell>
                  {renderStatus(order.status || 'completed')}
                </TableCell>
                <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="ดูรายละเอียด">
                            <IconButton size="small" onClick={() => handleView(order)} sx={{ color: "#1976d2", bgcolor: "#e3f2fd", '&:hover': { bgcolor: "#bbdefb" } }}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={order.status === 'cancelled' ? "ไม่สามารถแก้ไขรายการที่ยกเลิกแล้ว" : "แก้ไข"}>
                            <span>
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit(order)} 
                                    sx={{ color: "#ed6c02", bgcolor: "#fff3e0", '&:hover': { bgcolor: "#ffe0b2" } }}
                                    disabled={order.status === 'cancelled'}
                                >
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={order.status === 'cancelled' ? "รายการนี้ถูกยกเลิกแล้ว" : "ยกเลิกรายการ"}>
                            <span>
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteClick(order)} 
                                    sx={{ color: "#ef5350", bgcolor: "#ffebee", '&:hover': { bgcolor: "#ffcdd2" } }} 
                                    disabled={order.status === 'cancelled'}>
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบรายการคำสั่งซื้อ</Typography></TableCell></TableRow>
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
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedOrder?.receipt_no || selectedOrder?.order_number}</Typography>
                </Box>
             </Box>
             <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {selectedOrder ? (
              <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">วันที่ทำรายการ</Typography><Typography variant="body2" fontWeight="bold">{(selectedOrder.order_date || selectedOrder.transaction_date) ? dayjs(selectedOrder.order_date || selectedOrder.transaction_date).format('D MMMM BBBB HH:mm') : '-'}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">สถานะ</Typography><Box>{renderStatus(selectedOrder.status || 'completed')}</Box></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">วิธีชำระเงิน</Typography><Typography variant="body2">{selectedOrder.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">ลูกค้า</Typography><Typography variant="body2" fontWeight="bold">{selectedOrder.customer_name || 'ลูกค้าทั่วไป'}</Typography></Grid>
                        {/* ✅ แสดงเหตุผลการยกเลิก ถ้ามี */}
                        {selectedOrder.status === 'cancelled' && selectedOrder.note && (
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">เหตุผลที่ยกเลิก</Typography>
                                <Typography variant="body2" color="error.main" fontWeight="bold">{selectedOrder.note}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </Box>
                
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">รายการสินค้า ({selectedOrder.items?.length || 0})</Typography>
                    {selectedOrder.items ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                              <TableHead sx={{ bgcolor: '#eee' }}><TableRow><TableCell>สินค้า</TableCell><TableCell align="right">ราคา</TableCell><TableCell align="right">รวม</TableCell></TableRow></TableHead>
                              <TableBody>
                                  {selectedOrder.items.map((item, idx) => (
                                      <TableRow key={idx}>
                                          <TableCell sx={{ borderBottom: 'none' }}>
                                              <Typography variant="body2" fontWeight="500">{item.product_name}</Typography>
                                              <Typography variant="caption" color="text.secondary">x{item.quantity} {item.sold_unit_name || ''}</Typography>
                                          </TableCell>
                                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{Number(item.unit_price || 0).toLocaleString()}</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>{Number(item.total_price || 0).toLocaleString()}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                        </TableContainer>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" p={3} border="1px dashed #ccc" borderRadius={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                </Box>

                <Stack spacing={1} sx={{ pt: 2, borderTop: '2px dashed #ccc' }}>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">ยอดรวม</Typography><Typography variant="body2">฿{Number(selectedOrder.total_amount || selectedOrder.subtotal || 0).toLocaleString()}</Typography></Box>
                    {(Number(selectedOrder.discount_amount || selectedOrder.discount || 0)) > 0 && (
                      <Box display="flex" justifyContent="space-between" color="error.main">
                          <Typography variant="body2">ส่วนลด</Typography>
                          <Typography variant="body2">-฿{Number(selectedOrder.discount_amount || selectedOrder.discount).toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Typography variant="subtitle1" fontWeight="bold">ยอดรวมสุทธิ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">฿{Number(selectedOrder.net_amount || selectedOrder.grand_total || 0).toLocaleString()}</Typography>
                    </Box>
                </Stack>
              </Stack>
            ) : <CircularProgress sx={{ m: 4 }} />}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
            <Button onClick={() => setViewOpen(false)} sx={{ color: 'text.secondary' }}>ปิด</Button>
            <Button onClick={() => {
              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
              setOpenReceiptPreview(true);
            }} variant="contained" startIcon={<ReceiptLongIcon />}>ดูใบเสร็จ (50mm)</Button>
        </DialogActions>
      </Dialog>

      {/* --- 2. EDIT DIALOG (Professional Style) --- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
         <Box sx={{ bgcolor: '#ed6c02', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: '#ed6c02' }}><EditOutlinedIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">แก้ไขคำสั่งซื้อ</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedOrder?.receipt_no || selectedOrder?.order_number}</Typography>
                </Box>
             </Box>
             <IconButton onClick={() => setEditOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 4 }}>
          <Stack spacing={3}>
              <FormControl fullWidth>
                  <InputLabel>สถานะออเดอร์</InputLabel>
                  <Select value={editStatus} label="สถานะออเดอร์" onChange={(e) => setEditStatus(e.target.value)}>
                      <MenuItem value="pending">⚠️ รอชำระ</MenuItem>
                      <MenuItem value="completed">✅ สำเร็จ</MenuItem>
                      {/* การยกเลิกควรทำผ่านปุ่ม Delete เพื่อคืนสต็อก */}
                  </Select>
                  <FormHelperText>หากต้องการยกเลิกออเดอร์ กรุณาใช้ปุ่ม "ยกเลิกรายการ" ในหน้าหลัก</FormHelperText>
              </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary' }}>ยกเลิก</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="warning" startIcon={<SaveIcon />}>บันทึกการแก้ไข</Button>
        </DialogActions>
      </Dialog>

      {/* --- 3. RECEIPT PREVIEW DIALOG (50mm) --- */}
      <Dialog
        open={openReceiptPreview}
        onClose={() => setOpenReceiptPreview(false)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, width: 350 } }}
      >
        <DialogContent sx={{ p: 0 }}>
            <Box ref={smallReceiptRef} sx={{ p: 3, bgcolor: 'white', color: 'black', fontFamily: 'monospace' }}>
                {selectedOrder && (
                  <>
                    <Box textAlign="center" mb={2}>
                        <Typography fontWeight="bold" variant="subtitle1">Three Shop</Typography>
                        <Typography variant="caption" display="block">เลขที่ใบเสร็จ: {selectedOrder.receipt_no}</Typography>
                        <Typography variant="caption" display="block">พนักงาน: {selectedOrder.user_name || 'N/A'}</Typography>
                        <Typography variant="caption" display="block">ลูกค้า: {selectedOrder.customer_name || 'ลูกค้าทั่วไป'}</Typography>
                        <Typography variant="caption" display="block">
                            {dayjs(selectedOrder.order_date).format('D/M/BBBB HH:mm')}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Box>
                        {(selectedOrder.items || []).map((item, index) => (
                            <Box key={index} display="flex" justifyContent="space-between" mb={0.5}>
                                <Box sx={{ width: '60%' }}>
                                    <Typography variant="caption" fontWeight="bold">{item.product_name}</Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        {item.quantity} {item.sold_unit_name || ''} x {Number(item.unit_price).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" fontWeight="bold">
                                    {Number(item.total_price).toLocaleString()}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Box display="flex" justifyContent="space-between"><Typography variant="caption">รวมเป็นเงิน</Typography><Typography variant="caption">{Number(selectedOrder.total_amount).toLocaleString()}</Typography></Box>
                    {selectedOrder.discount_amount > 0 && (
                        <Box display="flex" justifyContent="space-between" color="error.main"><Typography variant="caption">ส่วนลด</Typography><Typography variant="caption">-{Number(selectedOrder.discount_amount).toLocaleString()}</Typography></Box>
                    )}
                    <Box display="flex" justifyContent="space-between" mt={1}><Typography variant="subtitle2" fontWeight="bold">ยอดสุทธิ</Typography><Typography variant="subtitle2" fontWeight="bold">{Number(selectedOrder.net_amount).toLocaleString()}</Typography></Box>
                    
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption">ชำระโดย ({selectedOrder.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'})</Typography>
                    </Box>

                    <Box textAlign="center" mt={3}>
                        <Typography variant="caption" color="text.secondary">ขอบคุณที่ใช้บริการ</Typography>
                    </Box>
                  </>
                )}
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
            <Button onClick={() => setOpenReceiptPreview(false)} variant="outlined" fullWidth color="inherit">ปิด</Button>
            <Button onClick={handlePrintSmallReceipt} variant="contained" fullWidth startIcon={<PrintIcon />} color="primary">พิมพ์ใบเสร็จ</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default History;