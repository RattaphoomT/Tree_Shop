import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// --- Charts ---
import api from "./api"; // ✅ Fix: Corrected import path
import { useReactToPrint } from "react-to-print";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

// --- MUI Imports ---
import {
  Box, Container, Grid, Typography, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Stack, Card, CardHeader, useTheme, alpha, Divider, IconButton,
  List, ListItem, ListItemAvatar, ListItemText, Button, TextField,
  TablePagination, InputAdornment, Dialog, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup
} from "@mui/material";

// --- MUI X Date Pickers ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// Config Dayjs
dayjs.locale('th');

// --- Icons ---
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
// --- Colors for Pie Chart ---
const COLORS = ['#00AB55', '#2D99FF', '#FFC107', '#FF5630', '#9E58FF', '#00B8D9', '#FFAB00', '#36B37E'];

// ================= SUB-COMPONENT: KPI CARD =================
const KpiCard = ({ title, value, icon, color, trend, trendColor, trendIcon }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid',
      borderColor: alpha(color, 0.2),
      bgcolor: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
         boxShadow: `0 10px 40px -10px ${alpha(color, 0.2)}`,
         transform: 'translateY(-4px)'
      }
    }}
  >
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.1), color: color, width: 50, height: 50, borderRadius: 2, mb: 2 }}>
              {icon}
          </Avatar>
          {trend && (
              <Chip 
                label={trend} 
                size="small" 
                sx={{ 
                    bgcolor: alpha(trendColor || color, 0.1), 
                    color: trendColor || color, 
                    fontWeight: 'bold', 
                    borderRadius: 1 
                }} 
                icon={trendIcon || <ArrowUpwardIcon style={{color: trendColor || color, width: 14}} />} 
              />
          )}
      </Stack>
      <Typography variant="h4" fontWeight="800" sx={{ color: '#2d3436', mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="600">{title}</Typography>
    </Box>
    <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08, transform: 'rotate(-15deg) scale(2.5)', color: color, zIndex: 0 }}>
      {icon}
    </Box>
  </Card>
);

// ================= MAIN COMPONENT =================
const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- Print Ref ---
  const smallReceiptRef = useRef();
  const handlePrintSmallReceipt = useReactToPrint({
    content: () => smallReceiptRef.current,
  });
  
  // --- KPI Filter State ---
  const [kpiFilter, setKpiFilter] = useState("today"); 
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // --- Table State ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // --- View Order Dialog State ---
  const [viewOpen, setViewOpen] = useState(false);
  const [openReceiptPreview, setOpenReceiptPreview] = useState(false); // For 50mm receipt preview
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Calculated States
  const [dashboardData, setDashboardData] = useState({
      kpi: {
          periodSales: 0,
          periodOrders: 0,
          totalProducts: 0,
          lowStockCount: 0,
          periodProfit: 0,
      },
      salesData: [],
      topProducts: [],
      recentOrders: [],
      categorySales: []
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      // NEW: Build URL based on filter type
      let url = '/dashboard/summary';
      if (kpiFilter === 'custom' && startDate && endDate) {
        const start = dayjs(startDate).format('YYYY-MM-DD');
        const end = dayjs(endDate).format('YYYY-MM-DD');
        url += `?startDate=${start}&endDate=${end}`;
      } else if (kpiFilter !== 'custom') {
        url += `?period=${kpiFilter}`;
      } else {
        // Don't fetch if it's 'custom' but dates are not set, just show current data
        setLoading(false);
        return;
      }
      const response = await api.get(url);
      const data = response.data;
      setDashboardData(prevData => ({
        ...prevData,
        ...data,
      }));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kpiFilter, startDate, endDate]); // Refetch when filter or dates change

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // --- Helpers ---
  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  const handleViewOrder = async (order) => {
    // The order object from the table already has most details.
    // We will now fetch the full order details to ensure all data is present.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedOrder({
      ...order,
      items: [] // Clear items to show loading state
    }); // Set initial data
    setViewOpen(true);
    try {
        const response = await api.get(`/history/${order.order_id}`);
        // The response from this endpoint is an array of items for the order.
        setSelectedOrder(prev => ({ ...prev, items: response.data }));
    } catch (error) {
        console.error("Could not fetch order items:", error);
    }
  };
  const handleOpenReceiptPreview = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setOpenReceiptPreview(true);
  };

  const filteredTableData = (dashboardData.recentOrders || []).filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderNo = (order.receipt_no || "").toLowerCase();
    const customer = (order.customer_name || 'ลูกค้าทั่วไป').toLowerCase();
    const status = (order.status || "").toLowerCase();
    const payment = (order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน').toLowerCase();
    return orderNo.includes(term) || status.includes(term) || payment.includes(term) || customer.includes(term);
  });

  const paginatedData = filteredTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
    if (percent <= 0) return null;
    return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">{`${payload.percent}%`}</text>;
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'completed': return <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: '18px !important', color: theme.palette.success.dark }} />} label="สำเร็จ" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.16), color: theme.palette.success.dark, fontWeight: 'bold', borderRadius: '8px', border: '1px solid transparent' }} />;
      case 'pending': return <Chip icon={<HourglassEmptyIcon sx={{ fontSize: '18px !important', color: theme.palette.warning.dark }} />} label="รอชำระ" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.16), color: theme.palette.warning.dark, fontWeight: 'bold', borderRadius: '8px', border: '1px solid transparent' }} />;
      case 'cancelled': return <Chip icon={<CancelOutlinedIcon sx={{ fontSize: '18px !important', color: theme.palette.error.dark }} />} label="ยกเลิก" size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.16), color: theme.palette.error.dark, fontWeight: 'bold', borderRadius: '8px', border: '1px solid transparent' }} />;
      default: return <Chip label={status} size="small" />;
    }
  };

  const getPeriodLabel = (filter) => {
      if (filter === 'custom' && startDate && endDate) {
          return `(${dayjs(startDate).format('D MMM YY')} - ${dayjs(endDate).format('D MMM YY')})`;
      }
      switch(filter) {
          case 'today': return '(วันนี้)';
          case 'this_week': return '(สัปดาห์นี้)';
          case 'last_week': return '(สัปดาห์ก่อน)';
          case 'this_month': return '(เดือนนี้)';
          case 'last_month': return '(เดือนก่อน)';
          default: return '';
      }
  }

  const handleKpiFilterChange = (event, newAlignment) => {
    if (newAlignment !== null) {
      setKpiFilter(newAlignment);
      // NEW: Clear custom dates when a preset is selected
      setStartDate(null);
      setEndDate(null);
    }
  };

  // NEW: Handlers for date pickers
  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
    // If both dates are set, switch filter to 'custom'
    if (newValue && endDate) {
        setKpiFilter('custom');
    }
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
    if (startDate && newValue) {
        setKpiFilter('custom');
    }
  };

  if (loading) return <Box height="100vh" display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
        <Box sx={{  minHeight: '100vh', pb: 6 }}>
        <Container maxWidth={false} sx={{ pt: 4, px: { xs: 2, md: 4 } }}> 
            
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', letterSpacing: '-0.5px' }}>รายงานภาพรวมของระบบ</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>ภาพรวมธุรกิจและการวิเคราะห์ยอดขาย</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    {/* <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}>ส่งออกรายงาน</Button> */}
                    <Chip icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label={dayjs().format('D MMMM YYYY')} variant="outlined" sx={{ borderRadius: 3, px: 1, py: 2.5, fontWeight: 600, bgcolor: 'white' }} />
                </Stack>
            </Stack>

            {/* --- Filter Button Group (Left Aligned) --- */}
            <Box mb={3} display="flex" justifyContent="flex-start" alignItems="center" flexWrap="wrap" gap={2}>
                <ToggleButtonGroup
                    // Deselect if custom date range is active
                    value={kpiFilter === 'custom' ? null : kpiFilter}
                    exclusive
                    onChange={handleKpiFilterChange}
                    aria-label="kpi filter"
                    size="small"
                    sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2, 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        '& .MuiToggleButton-root': { 
                            border: 'none', 
                            borderRadius: 2, 
                            mx: 0.5, 
                            py: 0.8,
                            px: 2,
                            fontWeight: 600,
                            color: 'text.secondary',
                            '&.Mui-selected': { 
                                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                color: theme.palette.primary.main,
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            },
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                        }
                    }}
                >
                    <ToggleButton value="today">วันนี้</ToggleButton>
                    <ToggleButton value="this_week">สัปดาห์นี้</ToggleButton>
                    <ToggleButton value="this_month">เดือนนี้</ToggleButton>
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} alignItems="center">
                    <DatePicker
                        label="วันที่เริ่มต้น"
                        value={startDate}
                        onChange={handleStartDateChange}
                        maxDate={endDate}
                        slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', minWidth: 160 } } }}
                    />
                    <Typography color="text.secondary">-</Typography>
                    <DatePicker
                        label="วันที่สิ้นสุด"
                        value={endDate}
                        onChange={handleEndDateChange}
                        minDate={startDate}
                        slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', minWidth: 160 } } }}
                    />
                </Stack>
            </Box>

            <Grid container spacing={3} mb={4}>
                {/* 1. ยอดขาย (Dynamic) */}
                <Grid item size={{ xs: 12, sm: 6, lg: 3 }} >
                    <KpiCard 
                        title={`ยอดขาย ${getPeriodLabel(kpiFilter)}`} 
                        value={`฿${(dashboardData.kpi.periodSales || 0).toLocaleString()}`} 
                        icon={<MonetizationOnIcon sx={{ fontSize: 60 }} />} 
                        color={theme.palette.success.main} 
                        // trend={`${summary.salesGrowth > 0 ? '+' : ''}${summary.salesGrowth.toFixed(1)}%`}
                        // trendColor={summary.salesGrowth >= 0 ? theme.palette.success.main : theme.palette.error.main}
                        // trendIcon={summary.salesGrowth >= 0 ? <ArrowUpwardIcon sx={{ width: 14, color: theme.palette.success.main }} /> : <ArrowDownwardIcon sx={{ width: 14, color: theme.palette.error.main }} />}
                    />
                </Grid>

                {/* 2. กำไร/ขาดทุน (Dynamic) */}
                <Grid item size={{ xs: 12, sm: 6, lg: 3 }} >
                    <KpiCard 
                        title={`กำไร/ขาดทุน ${getPeriodLabel(kpiFilter)}`}
                        value={`฿${(dashboardData.kpi.periodProfit || 0).toLocaleString()}`}
                        icon={<TrendingUpIcon sx={{ fontSize: 60 }} />}
                        color={dashboardData.kpi.periodProfit >= 0 ? theme.palette.info.main : theme.palette.error.main}
                    />
                </Grid>

                {/* 3. จำนวนออเดอร์ (Dynamic) */}
                <Grid item size={{ xs: 12, sm: 6, lg: 3 }} >
                    <KpiCard 
                        title={`จำนวนออเดอร์ ${getPeriodLabel(kpiFilter)}`} 
                        value={(dashboardData.kpi.periodOrders || 0).toLocaleString()} 
                        icon={<ReceiptLongIcon sx={{ fontSize: 60 }} />} 
                        color={theme.palette.secondary.main} 
                    />
                </Grid>

                {/* 4. สินค้าใกล้หมด */}
                <Grid item size={{ xs: 12, sm: 6, lg: 3 }} >
                    <KpiCard 
                        title={`สินค้าใกล้หมด`} 
                        value={(dashboardData.kpi.lowStockCount || 0).toLocaleString()} 
                        icon={<WarningAmberIcon sx={{ fontSize: 60 }} />} 
                        color={theme.palette.warning.main} 
                    />
                </Grid>
            </Grid>

            {/* --- Chart Section --- */}
            <Grid container spacing={3} mb={4}>
                <Grid item size={{ xs: 12, lg: 8 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                            <Box><Typography variant="h6" fontWeight="800">แนวโน้มยอดขาย</Typography><Typography variant="caption" color="text.secondary">กราฟแสดงยอดขายตามช่วงเวลาที่เลือก</Typography></Box>
                        </Box>
                        <Box sx={{ flex: 1, px: 2, pb: 2, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardData.salesData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00AB55" stopOpacity={0.2}/><stop offset="95%" stopColor="#00AB55" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D99FF" stopOpacity={0.2}/><stop offset="95%" stopColor="#2D99FF" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#637381', fontSize: 12 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#637381', fontSize: 12 }} width={40} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#2D99FF', fontSize: 12 }} width={40} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} 
                                        formatter={(value, name) => {
                                            if(name === 'ยอดขาย') return `฿${Number(value).toLocaleString()}`;
                                            if(name === 'จำนวนออเดอร์') return `${value} บิล`;
                                            return value;
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Area yAxisId="left" type="monotone" dataKey="ยอดขาย" stroke="#00AB55" strokeWidth={3} fill="url(#colorSales)" />
                                    <Area yAxisId="right" type="monotone" dataKey="จำนวนออเดอร์" stroke="#2D99FF" strokeWidth={3} fill="url(#colorOrders)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 12, lg: 4 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}><DonutSmallIcon sx={{ color: theme.palette.secondary.main }} /><Box><Typography variant="h6" fontWeight="800">สัดส่วนสินค้าที่ขายได้</Typography><Typography variant="caption" color="text.secondary">แยกตามหมวดหมู่ (%)</Typography></Box></Box>
                        <Box sx={{ flex: 1, position: 'relative', width: '100%', minHeight: 0, p: 2 }}>
                            {dashboardData.categorySales && dashboardData.categorySales.length > 0 ? (
                                <ResponsiveContainer width="90%" height="100%">
                                    <PieChart>
                                        <Pie data={dashboardData.categorySales} cx="50%" cy="45%" labelLine={false} outerRadius={110} innerRadius={50} dataKey="sold" nameKey="name" paddingAngle={2}>
                                            {dashboardData.categorySales.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} ชิ้น`, name]} contentStyle={{ borderRadius: 12 }} />
                                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', bottom: 0 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <Box display="flex" alignItems="center" justifyContent="center" height="100%"><Typography color="text.secondary">ไม่มีข้อมูล</Typography></Box>}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* --- Data & Lists --- */}
            <Grid container spacing={3} justifyContent="center">
                <Grid item size={{ xs: 12, md: 7 ,lg: 8 }} >
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: {xs: 'flex-start', sm: 'center'}, gap: 2 }}>
                            <Box><Typography variant="h6" fontWeight="800">รายการขายล่าสุด</Typography><Typography variant="caption" color="text.secondary">ข้อมูลตารางยอดขาย</Typography></Box>
                            <TextField size="small" placeholder="ค้นหา..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), sx: { borderRadius: 2, bgcolor: 'white', maxWidth: 200 } }} />
                        </Box>
                        <Divider />
                        <TableContainer sx={{ flex: 1, maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead sx={{ '& th': { bgcolor: '#F9FAFB' } }}><TableRow><TableCell sx={{ pl: 3, fontWeight: 700 }}>เลขที่บิล</TableCell><TableCell sx={{ fontWeight: 700 }}>ลูกค้า</TableCell><TableCell sx={{ fontWeight: 700 }}>เวลาทำรายการ</TableCell><TableCell sx={{ fontWeight: 700 }}>ยอดสุทธิ</TableCell><TableCell sx={{ fontWeight: 700 }}>ชำระโดย</TableCell><TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {paginatedData.map((order) => (
                                        <TableRow key={order.order_id} hover sx={{ '& td': { borderBottom: '1px solid #F2F4F7' } }}>
                                            <TableCell sx={{ pl: 3 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontFamily="monospace"
                                                    fontWeight="700"
                                                    color="primary.main"
                                                    onClick={() => handleViewOrder(order)}
                                                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                >{order.receipt_no}</Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2" noWrap>{order.customer_name || 'ลูกค้าทั่วไป'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{order.order_date ? dayjs(order.order_date).format('D MMM BBBB HH:mm') : '-'}</Typography></TableCell>
                                            <TableCell><Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00AB55' }}>฿{Number(order.net_amount).toLocaleString()}</Typography></TableCell>
                                            <TableCell><Chip label={order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'} size="small" sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 'bold' }} /></TableCell>
                                            <TableCell>{renderStatus(order.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedData.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination rowsPerPageOptions={[5, 10]} component="div" count={filteredTableData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} labelRowsPerPage="แถว:" />
                    </Card>
                </Grid>

                <Grid item size={{ xs: 12, md: 5, lg: 4 }}>
                     <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}><EmojiEventsIcon sx={{ color: '#FFC107' }} /><Typography variant="h6" fontWeight="800">5 สินค้าขายดี</Typography></Box>
                        <List sx={{ py: 0, overflowY: 'auto', maxHeight: 400, '& .MuiListItem-root:last-child': { borderBottom: 'none' } }}>
                            {dashboardData.topProducts.map((product, index) => (
                                <React.Fragment key={product.id}>
                                    <ListItem alignItems="center" sx={{ py: 1.5 }}>
                                        <ListItemAvatar><Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 36, height: 36 }}>{index + 1}</Avatar></ListItemAvatar>
                                        <ListItemText primary={<Typography variant="subtitle2" fontWeight="bold" noWrap>{product.name}</Typography>} />
                                        <Box textAlign="right"><Typography variant="subtitle2" fontWeight="800" color="success.main">ขายแล้ว {product.sold.toLocaleString()}</Typography></Box>
                                    </ListItem>
                                    {index < dashboardData.topProducts.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                            {dashboardData.topProducts.length === 0 && <Box p={3} textAlign="center"><Typography variant="caption">ไม่มีข้อมูล</Typography></Box>}
                        </List>
                    </Card>
                </Grid>
            </Grid>

        </Container>

        {/* --- VIEW ORDER DIALOG (from History page) --- */}
        <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
            <Box sx={{ bgcolor: '#0288d1', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'white', color: '#0288d1' }}><ReceiptLongIcon /></Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">รายละเอียดคำสั่งซื้อ</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedOrder?.receipt_no}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>

            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    {selectedOrder && (
                        <Stack spacing={3}>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">วันที่ทำรายการ</Typography><Typography variant="body2" fontWeight="bold">{selectedOrder.order_date ? dayjs(selectedOrder.order_date).format('D MMMM BBBB HH:mm') : '-'}</Typography></Grid>
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
                                <TableContainer component={Card} variant="outlined">
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
                                <Box display="flex" justifyContent="center" alignItems="center" p={3}><CircularProgress size={24} /></Box>
                            )}
                        </Box>

                        <Stack spacing={1} sx={{ pt: 2, borderTop: '2px dashed #ccc' }}>
                            <Box display="flex" justifyContent="space-between"><Typography variant="body2">ยอดรวม</Typography><Typography variant="body2">฿{Number(selectedOrder.total_amount || 0).toLocaleString()}</Typography></Box>
                            {(selectedOrder.discount_amount || 0) > 0 && (
                                <Box display="flex" justifyContent="space-between" color="error.main">
                                    <Typography variant="body2">ส่วนลด</Typography>
                                    <Typography variant="body2">-฿{Number(selectedOrder.discount_amount).toLocaleString()}</Typography>
                                </Box>
                            )}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="subtitle1" fontWeight="bold">ยอดรวมสุทธิ</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">฿{Number(selectedOrder.net_amount || 0).toLocaleString()}</Typography>
                            </Box>
                        </Stack>
                        </Stack>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
                <Button onClick={() => setViewOpen(false)} sx={{ color: 'text.secondary' }}>ปิด</Button>
                <Button onClick={handleOpenReceiptPreview} variant="contained" startIcon={<ReceiptLongIcon />}>ดูใบเสร็จ (50mm)</Button>
            </DialogActions>
        </Dialog>

        {/* --- RECEIPT PREVIEW DIALOG (50mm) --- */}
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
                                    <Typography variant="caption" fontWeight="bold">{Number(item.total_price).toLocaleString()}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                        <Box display="flex" justifyContent="space-between"><Typography variant="caption">รวมเป็นเงิน</Typography><Typography variant="caption">{Number(selectedOrder.total_amount).toLocaleString()}</Typography></Box>
                        {selectedOrder.discount_amount > 0 && (<Box display="flex" justifyContent="space-between" color="error.main"><Typography variant="caption">ส่วนลด</Typography><Typography variant="caption">-{Number(selectedOrder.discount_amount).toLocaleString()}</Typography></Box>)}
                        <Box display="flex" justifyContent="space-between" mt={1}><Typography variant="subtitle2" fontWeight="bold">ยอดสุทธิ</Typography><Typography variant="subtitle2" fontWeight="bold">{Number(selectedOrder.net_amount).toLocaleString()}</Typography></Box>
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        <Box display="flex" justifyContent="space-between"><Typography variant="caption">ชำระโดย ({selectedOrder.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'})</Typography></Box>
                        <Box textAlign="center" mt={3}><Typography variant="caption" color="text.secondary">ขอบคุณที่ใช้บริการ</Typography></Box>
                    </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
                <Button onClick={() => setOpenReceiptPreview(false)} variant="outlined" fullWidth color="inherit">ปิด</Button>
                <Button onClick={handlePrintSmallReceipt} variant="contained" fullWidth startIcon={<PrintIcon />} color="primary">พิมพ์ใบเสร็จ</Button>
            </DialogActions>
        </Dialog>
        </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;