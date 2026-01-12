import React, { useState, useEffect } from "react";
// --- Config Firebase ---
// ⚠️ ตรวจสอบ Path นี้ให้ถูกต้องว่าไฟล์ config อยู่ที่ไหน
import { db } from "../firebase/config"; 
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- Charts ---
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- MUI Imports ---
import {
  Box,
  Container,
  Grid,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Stack,
  Card,
  CardHeader,
  Button,
  useTheme,
  alpha,
} from "@mui/material";

// --- Icons ---
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RefreshIcon from "@mui/icons-material/Refresh";

// ================= SUB-COMPONENTS (ย้ายออกมาข้างนอกเพื่อประสิทธิภาพ) =================

const KpiCard = ({ title, value, icon, color, trend }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: alpha(color, 0.2),
      bgcolor: 'white',
      transition: 'all 0.3s ease',
      '&:hover': {
         boxShadow: `0 10px 40px -10px ${alpha(color, 0.3)}`,
         transform: 'translateY(-4px)'
      }
    }}
  >
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Avatar
              variant="rounded"
              sx={{
                  bgcolor: alpha(color, 0.1),
                  color: color,
                  width: 54,
                  height: 54,
                  borderRadius: 3,
                  mb: 2
              }}
          >
              {icon}
          </Avatar>
          {trend && (
              <Chip 
                  label={trend} 
                  size="small" 
                  sx={{ 
                      bgcolor: alpha(color, 0.1), 
                      color: color, 
                      fontWeight: 'bold', 
                      borderRadius: 2 
                  }} 
                  icon={<ArrowUpwardIcon style={{color: color, width: 14}} />} 
              />
          )}
      </Stack>
      
      <Typography variant="h4" fontWeight="800" sx={{ color: '#2d3436', mb: 0.5 }}>
          {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="600">
          {title}
      </Typography>
    </Box>

    {/* Background Decor */}
    <Box 
      sx={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          opacity: 0.1,
          transform: 'rotate(-15deg) scale(2.5)',
          color: color,
          zIndex: 0
      }}
    >
      {icon}
    </Box>
  </Card>
);

// ================= MAIN COMPONENT =================

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Products
      const productsSnapshot = await getDocs(collection(db, "Products"));
      const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const totalProd = products.length;
      const lowStock = products.filter((p) => (parseInt(p.stock_quantity) || 0) < 10);

      // 2. Orders (50 รายการล่าสุด)
      const ordersRef = collection(db, "Orders");
      const qOrders = query(ordersRef, orderBy("transaction_date", "desc"), limit(50)); 
      const ordersSnapshot = await getDocs(qOrders);
      const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const totalSales = orders.reduce((sum, order) => sum + (Number(order.grand_total) || 0), 0);
      const chartData = processSalesData(orders);

      setSummary({
        totalSales,
        totalOrders: orders.length,
        totalProducts: totalProd,
        lowStockCount: lowStock.length,
      });
      setRecentOrders(orders.slice(0, 10)); // 10 รายการ
      setLowStockItems(lowStock.slice(0, 10)); // 10 รายการ
      setSalesData(chartData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processSalesData = (orders) => {
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
      last7Days[dateStr] = 0;
    }

    orders.forEach((order) => {
      if (order.transaction_date) {
        // รองรับทั้ง Timestamp และ Date object
        const date = order.transaction_date.seconds 
          ? new Date(order.transaction_date.seconds * 1000)
          : new Date(order.transaction_date);
          
        const dateStr = date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr] += (Number(order.grand_total) || 0);
        }
      }
    });

    return Object.keys(last7Days).map((key) => ({
      name: key,
      ยอดขาย: last7Days[key],
    }));
  };

  // ================= RENDER =================

  if (loading) {
    return (
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f8f9fa">
            <CircularProgress color="primary" thickness={5} />
        </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        {/* --- Header --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={5} spacing={2}>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a1a', letterSpacing: '-0.5px' }}>
                    Dashboard Overview
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                    ยินดีต้อนรับกลับ, นี่คือภาพรวมธุรกิจของคุณวันนี้
                </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
                <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />}
                    onClick={fetchData}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, borderColor: '#e0e0e0', color: '#555' }}
                >
                    รีเฟรช
                </Button>
                <Chip 
                    icon={<CalendarTodayIcon style={{fontSize: 16}} />} 
                    label={new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })} 
                    sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', fontWeight: 600, height: 36, borderRadius: 3 }}
                />
            </Stack>
        </Stack>

        {/* --- 1. KPI Cards --- */}
        <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
                <KpiCard
                    title="ยอดขายรวม"
                    value={`฿${summary.totalSales.toLocaleString()}`}
                    icon={<MonetizationOnIcon sx={{ fontSize: 28 }} />}
                    color={theme.palette.success.main}
                    trend="+12%"
                />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <KpiCard
                    title="จำนวนออเดอร์"
                    value={summary.totalOrders}
                    icon={<ReceiptLongIcon sx={{ fontSize: 28 }} />}
                    color={theme.palette.info.main}
                    trend="+5%"
                />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <KpiCard
                    title="สินค้าในคลัง"
                    value={summary.totalProducts}
                    icon={<Inventory2Icon sx={{ fontSize: 28 }} />}
                    color={theme.palette.primary.main}
                />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <KpiCard
                    title="สินค้าใกล้หมด"
                    value={summary.lowStockCount}
                    icon={<WarningAmberIcon sx={{ fontSize: 28 }} />}
                    color={theme.palette.warning.main}
                    trend={summary.lowStockCount > 0 ? "Alert" : null}
                />
            </Grid>
        </Grid>

        {/* --- 2. Charts & Tables Section --- */}
        <Grid container spacing={3} mb={4} alignItems="stretch">
            
            {/* Sales Chart */}
            <Grid item xs={12} lg={8}>
                <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
                    <CardHeader 
                        title="สถิติยอดขาย 7 วันล่าสุด"
                        subheader="เปรียบเทียบยอดขายรายวัน"
                        titleTypographyProps={{ fontWeight: 800, fontSize: '1.1rem' }}
                        action={<IconButton><MoreVertIcon /></IconButton>}
                        sx={{ px: 3, pt: 3 }}
                    />
                    <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00AB55" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#00AB55" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#637381', fontSize: 12 }} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#637381', fontSize: 12 }} 
                                    tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
                                />
                                <Tooltip 
                                    cursor={{ stroke: '#00AB55', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="ยอดขาย" 
                                    stroke="#00AB55" 
                                    strokeWidth={3} 
                                    fill="url(#colorSales)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </Card>
            </Grid>

            {/* Low Stock Alert List */}
            <Grid item xs={12} lg={4}>
                <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', height: '100%', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
                    <CardHeader 
                        title="สินค้าต้องเติมสต็อก"
                        titleTypographyProps={{ fontWeight: 800, fontSize: '1.1rem', color: 'error.main' }}
                        sx={{ px: 3, pt: 3, pb: 2 }}
                    />
                    <TableContainer sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, border: 'none', pl: 1 }}>สินค้า</TableCell>
                                    <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, border: 'none', pr: 1 }}>คงเหลือ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map((item, index) => (
                                        <TableRow key={item.id} hover sx={{ '& td': { borderBottom: '1px dashed #f0f0f0' } }}>
                                            <TableCell sx={{ py: 1.5, pl: 1 }}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar 
                                                        variant="rounded" 
                                                        sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}
                                                    >
                                                        <Inventory2Icon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="700">{item.product_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{item.barcode}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 1 }}>
                                                <Chip 
                                                    label={item.stock_quantity} 
                                                    color={Number(item.stock_quantity) === 0 ? "error" : "warning"} 
                                                    size="small" 
                                                    sx={{ fontWeight: 800, minWidth: 30, height: 24 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center">
                                                <Inventory2Icon sx={{ fontSize: 40, color: '#e0e0e0', mb: 1 }} />
                                                <Typography color="text.secondary" variant="body2">สต็อกปกติ</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Grid>
        </Grid>

        {/* --- 3. Recent Orders --- */}
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <CardHeader 
                title="รายการขายล่าสุด"
                titleTypographyProps={{ fontWeight: 800, fontSize: '1.1rem' }}
                sx={{ px: 3, pt: 3, pb: 2 }}
            />
            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>เลขที่บิล</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>เวลา</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ยอดสุทธิ</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ชำระโดย</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>สถานะ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentOrders.map((order) => (
                            <TableRow key={order.id} hover sx={{ '& td': { borderBottom: '1px solid #F2F4F7' } }}>
                                <TableCell>
                                    <Typography variant="subtitle2" fontFamily="monospace" fontWeight="700" color="primary.main">
                                        {order.order_number}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="600">
                                        {order.transaction_date && order.transaction_date.seconds
                                            ? new Date(order.transaction_date.seconds * 1000).toLocaleDateString('th-TH')
                                            : '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {order.transaction_date && order.transaction_date.seconds
                                            ? new Date(order.transaction_date.seconds * 1000).toLocaleTimeString('th-TH')
                                            : ''}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00AB55' }}>
                                        ฿{Number(order.grand_total).toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        {order.payment_method === 'cash' 
                                            ? <MonetizationOnIcon fontSize="small" sx={{color: '#919EAB'}} /> 
                                            : <QrCodeScannerIcon fontSize="small" sx={{color: '#1890FF'}} />
                                        }
                                        <Typography variant="body2" fontWeight="500">
                                            {order.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={order.status === 'completed' ? 'สำเร็จ' : order.status} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: alpha(theme.palette.success.main, 0.16), 
                                            color: theme.palette.success.dark,
                                            fontWeight: 'bold',
                                            borderRadius: 1
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {recentOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">ยังไม่มีข้อมูลการขาย</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>

      </Container>
    </Box>
  );
};

export default Dashboard;