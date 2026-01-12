import React, { useState, useEffect, useRef } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config"; 
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- Charts ---
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// --- MUI Imports ---
import {
  Box, Container, Grid, Typography, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Stack, Card, CardHeader, useTheme, alpha, Divider,
  List, ListItem, ListItemAvatar, ListItemText, Button, TextField,
  TablePagination, InputAdornment, Dialog, DialogContent, DialogActions
} from "@mui/material";

// --- MUI X Date Pickers ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; 

// --- Print Library ---
import { useReactToPrint } from "react-to-print";

// --- Icons ---
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- Colors for Pie Chart ---
const COLORS = ['#00AB55', '#2D99FF', '#FFC107', '#FF5630', '#9E58FF', '#00B8D9', '#FFAB00', '#36B37E'];

// ================= SUB-COMPONENT: KPI CARD =================
const KpiCard = ({ title, value, icon, color, trend }) => (
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
              <Chip label={trend} size="small" sx={{ bgcolor: alpha(color, 0.1), color: color, fontWeight: 'bold', borderRadius: 1 }} icon={<ArrowUpwardIcon style={{color: color, width: 14}} />} />
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
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [rawOrders, setRawOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  
  // --- Date Range State ---
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState(dayjs());

  // --- Table State ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Receipt Modal State ---
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // ใช้ ref เพื่อจับ element ที่ต้องการพิมพ์
  const receiptRef = useRef(null);

  // Calculated States
  const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, lowStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [filteredList, setFilteredList] = useState([]); 
  const [lowStockItems, setLowStockItems] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const productsSnapshot = await getDocs(collection(db, "Products"));
      const productsList = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productsList);

      const categoriesSnapshot = await getDocs(collection(db, "Categories"));
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesList);

      const ordersRef = collection(db, "Orders");
      const qOrders = query(ordersRef, orderBy("transaction_date", "desc"), limit(500)); 
      const ordersSnapshot = await getDocs(qOrders);
      const ordersList = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRawOrders(ordersList);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (rawOrders.length > 0 || products.length > 0) {
        calculateDashboard(rawOrders, products, categories, startDate, endDate);
    }
  }, [startDate, endDate, rawOrders, products, categories]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // --- Logic Calculation ---
  const calculateDashboard = (orders, allProducts, allCategories, startDayjs, endDayjs) => {
    const startObj = startDayjs ? startDayjs.toDate() : new Date();
    startObj.setHours(0,0,0,0);
    const endObj = endDayjs ? endDayjs.toDate() : new Date();
    endObj.setHours(23,59,59,999);

    const filteredOrders = orders.filter(order => {
        if (!order.transaction_date) return false;
        const orderDate = order.transaction_date.seconds 
            ? new Date(order.transaction_date.seconds * 1000)
            : new Date(order.transaction_date);
        return orderDate >= startObj && orderDate <= endObj;
    });

    const totalSales = filteredOrders.reduce((sum, order) => sum + (Number(order.grand_total) || 0), 0);
    const lowStock = allProducts.filter((p) => (parseInt(p.stock_quantity) || 0) < 10);

    const productSalesCount = {};
    filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const pid = item.id || item.product_id; 
                const qty = Number(item.qty || item.quantity || 1);
                if (pid) productSalesCount[pid] = (productSalesCount[pid] || 0) + qty;
            });
        }
    });

    const rankedProducts = Object.keys(productSalesCount).map(pid => {
        const productInfo = allProducts.find(p => p.id === pid);
        return {
            id: pid,
            name: productInfo ? productInfo.product_name : 'สินค้าที่ถูกลบ',
            image: productInfo ? productInfo.image_url : '',
            sold: productSalesCount[pid],
            stock: productInfo ? productInfo.stock_quantity : 0
        };
    }).sort((a, b) => b.sold - a.sold).slice(0, 5);

    const displayTopProducts = rankedProducts.length > 0 ? rankedProducts : allProducts.slice(0, 5).map(p => ({
        id: p.id, name: p.product_name, image: p.image_url, sold: 0, stock: p.stock_quantity
    }));

    const categoryNameMap = {};
    allCategories.forEach(cat => categoryNameMap[cat.id] = cat.category_name);
    const catCountMap = {};
    allProducts.forEach(p => {
        let catName = 'ไม่ระบุหมวดหมู่';
        if (p.Categories_category_id && categoryNameMap[p.Categories_category_id]) catName = categoryNameMap[p.Categories_category_id];
        else if (p.category) catName = p.category;
        catCountMap[catName] = (catCountMap[catName] || 0) + 1;
    });
    const totalProds = allProducts.length || 1;
    const chartData = Object.keys(catCountMap).map(key => ({
        name: key, value: catCountMap[key], percent: ((catCountMap[key] / totalProds) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value);
    
    const graphData = processSalesData(filteredOrders, startObj, endObj);

    setSummary({ totalSales, totalOrders: filteredOrders.length, totalProducts: allProducts.length, lowStockCount: lowStock.length });
    setRecentOrders(filteredOrders); 
    setFilteredList(filteredOrders); 
    setLowStockItems(lowStock.slice(0, 10));
    setTopProducts(displayTopProducts);
    setSalesData(graphData);
    setCategoryData(chartData);
  };

  const processSalesData = (orders, startObj, endObj) => {
    const salesMap = {};
    const current = new Date(startObj);
    while (current <= endObj) {
        const dateStr = current.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        salesMap[dateStr] = 0;
        current.setDate(current.getDate() + 1);
    }
    orders.forEach((order) => {
      if (order.transaction_date) {
        const date = order.transaction_date.seconds ? new Date(order.transaction_date.seconds * 1000) : new Date(order.transaction_date);
        const dateStr = date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        if (salesMap[dateStr] !== undefined) salesMap[dateStr] += (Number(order.grand_total) || 0);
      }
    });
    return Object.keys(salesMap).map((key) => ({ name: key, ยอดขาย: salesMap[key] }));
  };

  // --- Table Filtering & Pagination ---
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredTableData = recentOrders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderNo = (order.order_number || "").toLowerCase();
    const status = (order.status || "").toLowerCase();
    const payment = (order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน').toLowerCase();
    return orderNo.includes(term) || status.includes(term) || payment.includes(term);
  });

  const paginatedData = filteredTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // --- Receipt Logic ---
  const handleOpenReceipt = (order) => {
    setSelectedOrder(order);
    setOpenReceipt(true);
  };

  const handleCloseReceipt = () => {
    setOpenReceipt(false);
    setSelectedOrder(null);
  };

  // ✅ ฟังก์ชันพิมพ์ที่ถูกต้อง
  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt_${selectedOrder?.order_number || 'Print'}`,
  });

  const handleExportCSV = () => {
    if (filteredList.length === 0) { alert("ไม่มีข้อมูลสำหรับส่งออก"); return; }
    const headers = ["วันที่,เวลา,เลขที่บิล,ลูกค้า,ยอดสุทธิ,ชำระโดย,สถานะ"];
    const rows = filteredList.map(order => {
        const dateObj = order.transaction_date.seconds ? new Date(order.transaction_date.seconds * 1000) : new Date(order.transaction_date);
        return `"${dateObj.toLocaleDateString('th-TH')}","${dateObj.toLocaleTimeString('th-TH')}","${order.order_number || order.id}","ลูกค้าทั่วไป","${order.grand_total}","${order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}","${order.status}"`;
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", `ยอดขาย_${dayjs(startDate).format('DD-MM-YYYY')}_ถึง_${dayjs(endDate).format('DD-MM-YYYY')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
    if (percent <= 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${payload.percent}%`}
      </text>
    );
  };

  if (loading) return <Box height="100vh" display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', m: -3, pb: 6 }}>
        <Container maxWidth={false} sx={{ pt: 4, px: { xs: 2, md: 4 } }}> 
            
            {/* --- 1. Header --- */}
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={4} spacing={2}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', letterSpacing: '-0.5px' }}>Dashboard</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>ภาพรวมธุรกิจและการวิเคราะห์ยอดขาย</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}>ส่งออกรายงาน</Button>
                    <Chip icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label={dayjs().format('D MMMM YYYY')} variant="outlined" sx={{ borderRadius: 3, px: 1, py: 2.5, fontWeight: 600, bgcolor: 'white' }} />
                </Stack>
            </Stack>

            {/* --- 2. KPI Cards --- */}
            <Grid container spacing={3} mb={4}>
                <Grid item size={{ xs:12, sm:6, lg:3}} ><KpiCard title="ยอดขายรวม" value={`฿${summary.totalSales.toLocaleString()}`} icon={<MonetizationOnIcon sx={{ fontSize: 28 }} />} color={theme.palette.success.main} trend="รายได้" /></Grid>
                <Grid item size={{ xs:12, sm:6, lg:3 }} ><KpiCard title="จำนวนออเดอร์" value={summary.totalOrders} icon={<ReceiptLongIcon sx={{ fontSize: 28 }} />} color={theme.palette.info.main} /></Grid>
                <Grid item size={{ xs:12, sm:6, lg:3 }} ><KpiCard title="สินค้าในคลัง" value={summary.totalProducts} icon={<Inventory2Icon sx={{ fontSize: 28 }} />} color={theme.palette.primary.main} /></Grid>
                <Grid item size={{ xs:12, sm:6, lg:3 }} ><KpiCard title="สินค้าใกล้หมด" value={summary.lowStockCount} icon={<WarningAmberIcon sx={{ fontSize: 28 }} />} color={theme.palette.warning.main} trend={summary.lowStockCount > 0 ? "Alert" : null} /></Grid>
            </Grid>

            {/* --- 3. Grid Row 2: Charts --- */}
            <Grid container spacing={3} mb={4}>
                
                {/* Sales Chart */}
                <Grid item size={{ xs:12, lg:8 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="800">แนวโน้มยอดขาย</Typography>
                                <Typography variant="caption" color="text.secondary">กราฟแสดงยอดขายตามช่วงเวลา</Typography>
                            </Box>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <DatePicker label="ตั้งแต่วันที่" value={startDate} onChange={setStartDate} slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', borderRadius: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                                <Typography color="text.secondary">-</Typography>
                                <DatePicker label="ถึงวันที่" value={endDate} onChange={setEndDate} slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', borderRadius: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                            </Stack>
                        </Box>
                        <Box sx={{ flex: 1, px: 2, pb: 2, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData}>
                                    <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00AB55" stopOpacity={0.2}/><stop offset="95%" stopColor="#00AB55" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#637381', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#637381', fontSize: 12 }} width={40} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                                    <Area type="monotone" dataKey="ยอดขาย" stroke="#00AB55" strokeWidth={3} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                {/* Pie Chart */}
                <Grid item size={{ xs:12, lg:4 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DonutSmallIcon sx={{ color: theme.palette.secondary.main }} />
                            <Box>
                                <Typography variant="h6" fontWeight="800">สัดส่วนสินค้า</Typography>
                                <Typography variant="caption" color="text.secondary">แยกตามหมวดหมู่ (%)</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="45%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2}>
                                            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value, name, props) => [`${value} ชิ้น`, `${name} (${props.payload.percent}%)`]} contentStyle={{ borderRadius: 12 }} />
                                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', bottom: 10 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <Box display="flex" alignItems="center" justifyContent="center" height="100%"><Typography color="text.secondary">ไม่มีข้อมูล</Typography></Box>}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* --- 4. Grid Row 3: Data & Lists --- */}
            <Grid container spacing={3}>
                
                {/* 🔴 Left Column (6): Recent Orders (Data Table) */}
                <Grid item size={{ xs:12, lg:6 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: {xs: 'flex-start', sm: 'center'}, gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="800">รายการขายล่าสุด</Typography>
                                <Typography variant="caption" color="text.secondary">ข้อมูลตารางยอดขาย</Typography>
                            </Box>
                            <TextField 
                                size="small"
                                placeholder="ค้นหา..."
                                variant="outlined"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>),
                                    sx: { borderRadius: 2, bgcolor: 'white', maxWidth: 150 }
                                }}
                            />
                        </Box>
                        <Divider />
                        <TableContainer sx={{ flex: 1, maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead sx={{ '& th': { bgcolor: '#F9FAFB' } }}>
                                    <TableRow>
                                        <TableCell sx={{ pl: 3, fontWeight: 700 }}>เลขที่บิล</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>เวลา</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ยอดสุทธิ</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedData.map((order) => (
                                        <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #F2F4F7' } }}>
                                            {/* Clickable Order Number */}
                                            <TableCell sx={{ pl: 3 }}>
                                                <Typography 
                                                    variant="subtitle2" 
                                                    fontFamily="monospace" 
                                                    fontWeight="700" 
                                                    color="primary.main"
                                                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                    onClick={() => handleOpenReceipt(order)}
                                                >
                                                    {order.order_number}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{order.transaction_date && order.transaction_date.seconds ? new Date(order.transaction_date.seconds * 1000).toLocaleDateString('th-TH') : '-'}</Typography></TableCell>
                                            <TableCell><Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00AB55' }}>฿{Number(order.grand_total).toLocaleString()}</Typography></TableCell>
                                            <TableCell><Chip label={order.status === 'completed' ? 'สำเร็จ' : order.status} size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.16), color: theme.palette.success.dark, fontWeight: 'bold', borderRadius: 1, height: 24 }} /></TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedData.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10]}
                            component="div"
                            count={filteredTableData.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            labelRowsPerPage="แถว:"
                        />
                    </Card>
                </Grid>

                {/* 🟡 Middle Column (3): Low Stock */}
                <Grid item size={{ xs:12, md:6, lg:3 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%' }}>
                        <CardHeader title="สินค้าต้องเติมสต็อก" titleTypographyProps={{ fontWeight: 800, fontSize: '0.95rem', color: 'error.main' }} action={<Chip label={lowStockItems.length} color="error" size="small" />} sx={{ px: 3, pt: 3, pb: 1 }} />
                        <Divider />
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table size="small">
                                <TableBody>
                                    {lowStockItems.length > 0 ? (
                                        lowStockItems.map((item) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell sx={{ pl: 3, py: 1.5 }}><Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 120 }}>{item.product_name}</Typography></TableCell>
                                                <TableCell align="right" sx={{ pr: 3 }}><Chip label={item.stock_quantity} color={Number(item.stock_quantity) === 0 ? "error" : "warning"} size="small" sx={{ fontWeight: 800, minWidth: 40, height: 24 }} /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (<TableRow><TableCell colSpan={2} align="center" sx={{ py: 3 }}><Typography color="text.secondary" variant="caption">สต็อกปกติทุกรายการ</Typography></TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>

                {/* 🟢 Right Column (3): Top 5 Products */}
                <Grid item size={{ xs:12, md:6, lg:3 }}>
                     <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEventsIcon sx={{ color: '#FFC107' }} />
                            <Typography variant="h6" fontWeight="800">5 สินค้าขายดี</Typography>
                        </Box>
                        <List sx={{ py: 0 }}>
                            {topProducts.map((product, index) => (
                                <React.Fragment key={product.id}>
                                    <ListItem alignItems="center" sx={{ py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" src={product.image} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 36, height: 36 }}><Inventory2Icon fontSize="small" /></Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={<Typography variant="subtitle2" fontWeight="bold" noWrap>{product.name}</Typography>} secondary={<Typography variant="caption" color="text.secondary">เหลือ {product.stock}</Typography>} />
                                        <Box textAlign="right"><Typography variant="subtitle2" fontWeight="800" color="success.main">{product.sold}</Typography></Box>
                                    </ListItem>
                                    {index < topProducts.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                            {topProducts.length === 0 && <Box p={3} textAlign="center"><Typography variant="caption">ไม่มีข้อมูล</Typography></Box>}
                        </List>
                    </Card>
                </Grid>

            </Grid>

            {/* --- Receipt Dialog --- */}
            <Dialog
                open={openReceipt}
                onClose={handleCloseReceipt}
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 2, width: 350 } }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {/* ✅ ใส่ ref ที่ Box นี้เพื่อให้พิมพ์เฉพาะส่วนใบเสร็จ */}
                    <Box ref={receiptRef} sx={{ p: 3, bgcolor: 'white', color: 'black', fontFamily: 'monospace' }}>
                        <Box textAlign="center" mb={2}>
                            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold">ชำระเงินสำเร็จ</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedOrder?.transaction_date?.seconds ? new Date(selectedOrder.transaction_date.seconds * 1000).toLocaleString('th-TH') : ''}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                        <Box textAlign="center" mb={2}>
                            <Typography fontWeight="bold" variant="subtitle1">Three Shop</Typography>
                            <Typography variant="caption" display="block">เลขที่ใบเสร็จ: {selectedOrder?.order_number}</Typography>
                            <Typography variant="caption" display="block">พนักงาน: {selectedOrder?.cashier_name || 'Admin'}</Typography>
                        </Box>

                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                        <Box>
                            {selectedOrder?.items?.map((item, index) => (
                                <Box key={index} display="flex" justifyContent="space-between" mb={0.5}>
                                    <Box sx={{ width: '60%' }}>
                                        {/* ใช้ product_name หรือ name ตามที่มีใน DB */}
                                        <Typography variant="caption" fontWeight="bold">{item.product_name || item.name}</Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {/* ใช้ selling_price หรือ price */}
                                            {item.qty || item.quantity} x {Number(item.selling_price || item.price).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" fontWeight="bold">
                                        {(item.total_line || ((item.qty || item.quantity) * (item.selling_price || item.price))).toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">รวมเป็นเงิน</Typography>
                            <Typography variant="caption">{selectedOrder?.subtotal?.toLocaleString()}</Typography>
                        </Box>
                        {selectedOrder?.discount > 0 && (
                            <Box display="flex" justifyContent="space-between" color="error.main">
                                <Typography variant="caption">ส่วนลด</Typography>
                                <Typography variant="caption">-{selectedOrder?.discount?.toLocaleString()}</Typography>
                            </Box>
                        )}
                        <Box display="flex" justifyContent="space-between" mt={1}>
                            <Typography variant="subtitle2" fontWeight="bold">ยอดสุทธิ</Typography>
                            <Typography variant="subtitle2" fontWeight="bold">{selectedOrder?.grand_total?.toLocaleString()}</Typography>
                        </Box>

                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">ชำระโดย ({selectedOrder?.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'})</Typography>
                            <Typography variant="caption">{selectedOrder?.received_amount?.toLocaleString()}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">เงินทอน</Typography>
                            <Typography variant="caption">{selectedOrder?.change_amount?.toLocaleString()}</Typography>
                        </Box>

                        <Box textAlign="center" mt={3}>
                            <Typography variant="caption" color="text.secondary">ขอบคุณที่ใช้บริการ</Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
                    <Button onClick={handleCloseReceipt} variant="outlined" fullWidth color="inherit">ปิด</Button>
                    <Button onClick={handlePrintReceipt} variant="contained" fullWidth startIcon={<PrintIcon />} color="primary">พิมพ์ใบเสร็จ</Button>
                </DialogActions>
            </Dialog>

        </Container>
        </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;