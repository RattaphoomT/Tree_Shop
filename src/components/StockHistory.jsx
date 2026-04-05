import React, { useState, useEffect } from "react";
import api from "./api";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

// Config Date
dayjs.extend(buddhistEra);
dayjs.locale("th");

// --- MUI Imports ---
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, TextField, InputAdornment, TablePagination, 
  CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, Button
} from "@mui/material";

// --- MUI X Date Pickers ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// --- Icons ---
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from '@mui/icons-material/Assessment'; // Icon for the page
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const StockHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New filter states
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.get("/stock-history"); // New API endpoint
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching stock transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const productName = (tx.product_name || "").toLowerCase();
    const note = (tx.note || "").toLowerCase();
    const userName = (tx.user_name || "").toLowerCase();
    const matchesSearch = productName.includes(term) || note.includes(term) || userName.includes(term);

    // Filter by type
    const matchesType = filterType === "all" || tx.transaction_type === filterType;

    // Filter by date
    const matchesDate = !filterDate || dayjs(tx.created_at).isSame(filterDate, 'day');

    return matchesSearch && matchesType && matchesDate;
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterDate(null);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderTypeChip = (type) => {
    let color = "default";
    let label = type;

    if (type === "IN" || type === "RETURN") { color = "success"; label = type === "IN" ? "รับเข้า/คืนสต็อก" : "ลูกค้านำมาคืน"; }
    else if (type === "OUT") { color = "primary"; label = "ขาย"; }
    else if (type === "WASTE" || type === "GIVEAWAY") { color = "error"; label = type === "WASTE" ? "ของเสีย" : "ของแถม"; }
    else if (type === "ADJUST") { color = "warning"; label = "ปรับสต็อก"; }

    return <Chip 
      label={label} 
      color={color} 
      size="small" 
      variant="outlined" sx={{ fontWeight: 'bold' }} />;
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary" mt={3}>กำลังโหลดประวัติสต็อก...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 5, mb: 5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <AssessmentIcon sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }} />
            ประวัติการเคลื่อนไหวสต็อกทั้งหมด
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            ประวัติการทำรายการเกี่ยวกับสต็อกทั้งหมด ({transactions.length} รายการ)
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
                <TextField
                    placeholder="ค้นหาชื่อสินค้า, หมายเหตุ, ผู้ทำรายการ..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                        ),
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>ประเภทรายการ</InputLabel>
                    <Select value={filterType} label="ประเภทรายการ" onChange={(e) => setFilterType(e.target.value)}>
                        <MenuItem value="all">ทั้งหมด</MenuItem>
                        <MenuItem value="IN">IN (รับเข้า/คืนสต็อก)</MenuItem>
                        <MenuItem value="OUT">OUT (ขาย)</MenuItem>
                        <MenuItem value="ADJUST">ADJUST (ปรับสต็อก)</MenuItem>
                        <MenuItem value="WASTE">WASTE (ของเสีย)</MenuItem>
                        <MenuItem value="RETURN">RETURN (ลูกค้านำมาคืน)</MenuItem>
                        <MenuItem value="GIVEAWAY">GIVEAWAY (ของแถม)</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                    label="เลือกวันที่"
                    value={filterDate}
                    onChange={(newValue) => setFilterDate(newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
            </Grid>
            <Grid item xs={12} md={1}>
                <Button variant="outlined" color="inherit" fullWidth onClick={handleResetFilters} sx={{ height: '40px' }}>
                    <RestartAltIcon />
                </Button>
            </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "primary.main" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>วันที่/เวลา</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>สินค้า</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ประเภท</TableCell>
              <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>จำนวนเปลี่ยนแปลง</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ผู้ทำรายการ</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>หมายเหตุ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tx) => (
              <TableRow key={tx.transaction_id} hover>
                <TableCell><Typography variant="body2" noWrap>{dayjs(tx.created_at).format("D MMM BBBB HH:mm")}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight="bold">{tx.product_name || '[สินค้าถูกลบ]'}</Typography></TableCell>
                <TableCell>{renderTypeChip(tx.transaction_type)}</TableCell>
                <TableCell align="center"><Typography variant="body2" fontWeight="bold" color={tx.quantity_change > 0 ? "success.main" : "error.main"}>{tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{tx.user_name || 'N/A'}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{tx.note || "-"}</Typography></TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (<TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>)}
          </TableBody>
        </Table>
        <TablePagination rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={filteredTransactions.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="แสดง:" />
      </TableContainer>
    </Container>
    </LocalizationProvider>
  );
};

export default StockHistory;