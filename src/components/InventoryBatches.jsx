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
  CircularProgress, Grid, Button
} from "@mui/material";

// --- Icons ---
import SearchIcon from "@mui/icons-material/Search";
import WidgetsIcon from '@mui/icons-material/Widgets'; // Icon for batches
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const InventoryBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await api.get("/stock/all-batches"); // The new endpoint
        setBatches(response.data);
      } catch (error) {
        console.error("Error fetching inventory batches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter((batch) => {
    const term = searchTerm.toLowerCase();
    const productName = (batch.product_name || "").toLowerCase();
    const sku = (batch.sku || "").toLowerCase();
    const supplierLotNo = (batch.supplier_lot_no || "").toLowerCase();
    const supplierName = (batch.supplier_name || "").toLowerCase();
    return productName.includes(term) || sku.includes(term) || supplierLotNo.includes(term) || supplierName.includes(term);
  });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleResetFilters = () => {
    setSearchTerm("");
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary" mt={3}>กำลังโหลดข้อมูลล็อตสินค้า...</Typography>
      </Box>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 5, mb: 5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <WidgetsIcon sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }} />
            รายการล็อตสินค้าทั้งหมด
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            แสดงล็อตสินค้าทั้งหมดในคลัง ({batches.length} รายการ)
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={11}>
                <TextField
                    placeholder="ค้นหาชื่อสินค้า, SKU, เลขล็อตผู้จำหน่าย, ชื่อซัพพลายเออร์..."
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
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>สินค้า (SKU)</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>เลขล็อตผู้จำหน่าย</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ซัพพลายเออร์</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>วันที่รับเข้า</TableCell>
              <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>ราคาทุน</TableCell>
              <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>จำนวนเริ่มต้น</TableCell>
              <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>จำนวนคงเหลือ</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ตำแหน่ง</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((batch) => (
              <TableRow key={batch.batch_id} hover>
                <TableCell>
                    <Typography variant="body2" fontWeight="bold">{batch.product_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{batch.sku || '-'}</Typography>
                </TableCell>
                <TableCell>
                    <Chip label={batch.supplier_lot_no || 'N/A'} size="small" variant="outlined" />
                </TableCell>
                <TableCell><Typography variant="body2">{batch.supplier_name || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2" noWrap>{dayjs(batch.received_date).format("D MMM BBBB")}</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2" color="primary.main" fontWeight="bold">฿{Number(batch.cost_price).toLocaleString()}</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2">{batch.initial_quantity}</Typography></TableCell>
                <TableCell align="right"><Typography variant="h6" component="span" fontWeight="bold">{batch.current_quantity}</Typography></TableCell>
                <TableCell><Typography variant="body2">{batch.location_name}</Typography></TableCell>
                <TableCell>
                    <Chip label={batch.status} color={batch.status === 'AVAILABLE' ? 'success' : 'warning'} size="small" />
                </TableCell>
              </TableRow>
            ))}
            {filteredBatches.length === 0 && (<TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>)}
          </TableBody>
        </Table>
        <TablePagination rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={filteredBatches.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="แสดง:" />
      </TableContainer>
    </Container>
  );
};

export default InventoryBatches;