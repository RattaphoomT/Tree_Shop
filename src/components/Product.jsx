import React, { useState, useEffect, useRef } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

// --- SweetAlert2 Import ---
import Swal from "sweetalert2";

// --- Barcode & Print Libraries ---
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";

// --- Material UI Imports ---
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Divider,
  Stack,
  Tooltip,
  Snackbar,
  Alert,
  Checkbox,
  Grid,
  TablePagination, // ✅ เพิ่ม Pagination
  TableSortLabel, // ✅ เพิ่ม Sort Label
} from "@mui/material";

// --- Icons Imports ---
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CategoryIcon from "@mui/icons-material/Category";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PrintIcon from "@mui/icons-material/Print";
import { visuallyHidden } from "@mui/utils"; // ✅ Helper for accessibility

// ================= SORTING HELPERS (วางไว้นอก Component) =================
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// ฟังก์ชันนี้ช่วยให้การเรียงลำดับเสถียร (Stable Sort)
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// กำหนดหัวตารางเพื่อใช้ Loop สร้าง Sort Header
const headCells = [
  { id: "barcode", numeric: false, disablePadding: false, label: "BARCODE" },
  {
    id: "product_name",
    numeric: false,
    disablePadding: false,
    label: "ชื่อสินค้า",
  },
  {
    id: "Categories_category_id",
    numeric: false,
    disablePadding: false,
    label: "หมวดหมู่",
  }, // Sort ตาม ID
  {
    id: "selling_price",
    numeric: true,
    disablePadding: false,
    label: "ราคาขาย",
  },
  {
    id: "stock_quantity",
    numeric: true,
    disablePadding: false,
    label: "คงเหลือ",
  },
  { id: "status", numeric: true, disablePadding: false, label: "สถานะ" }, // Custom Logic later
  {
    id: "action",
    numeric: true,
    disablePadding: false,
    label: "Action",
    disableSort: true,
  },
];

const Product = () => {
  // ================= STATE MANAGEMENT =================
  const initialFormState = {
    barcode: "",
    product_name: "",
    cost_price: "",
    selling_price: "",
    location: "",
    stock_quantity: "",
    Categories_category_id: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- Filter & Search State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // --- Pagination & Sorting State ✅ ---
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("product_name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // --- UI States ---
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openCatModal, setOpenCatModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- Barcode & Selection States ---
  const [selectedIds, setSelectedIds] = useState([]);
  const [openBarcodeDialog, setOpenBarcodeDialog] = useState(false);
  const [itemsToPrint, setItemsToPrint] = useState([]);
  const componentRef = useRef();

  const refProductTable = collection(db, "Products");
  const refCategoryTable = collection(db, "Categories");

  // ================= USE EFFECT (Realtime Data) =================
  useEffect(() => {
    const unsubProd = onSnapshot(refProductTable, (snapshot) => {
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(newData);
    });

    const unsubCat = onSnapshot(refCategoryTable, (snapshot) => {
      const newCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(newCats);
    });

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  // ✅ เมื่อมีการเปลี่ยน Filter ให้กลับไปหน้า 1 เสมอ
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterStatus, filterCategory]);

  // ================= LOGIC: FILTER / SEARCH =================
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const pName = item.product_name ? item.product_name.toLowerCase() : "";
    const pBarcode = item.barcode ? item.barcode.toString() : "";
    const pLoc = item.location ? item.location.toLowerCase() : "";

    const matchesSearch =
      pName.includes(term) || pBarcode.includes(term) || pLoc.includes(term);
    const matchesCategory =
      filterCategory === "all" ||
      item.Categories_category_id === filterCategory;

    let matchesStatus = true;
    const qty = parseInt(item.stock_quantity) || 0;
    if (filterStatus === "out_of_stock") {
      matchesStatus = qty === 0;
    } else if (filterStatus === "low_stock") {
      matchesStatus = qty > 0 && qty < 10;
    } else if (filterStatus === "in_stock") {
      matchesStatus = qty >= 10;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ================= HANDLERS: SORTING & PAGINATION ✅ =================
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // คำนวณข้อมูลที่จะแสดงในหน้านั้นๆ
  const visibleRows = stableSort(
    filteredData,
    getComparator(order, orderBy)
  ).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ================= HANDLERS: CRUD =================
  const handleChang = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGenerateBarcode = () => {
    let isUnique = false;
    let randomCode = "";
    while (!isUnique) {
      randomCode = Math.floor(
        100000000000 + Math.random() * 900000000000
      ).toString();
      const exists = data.some((item) => item.barcode === randomCode);
      if (!exists) isUnique = true;
    }
    setForm({ ...form, barcode: randomCode });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(initialFormState);
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm(item);
    setErrors({});
    setOpen(true);
  };

  const handleSaveProduct = async () => {
    const newErrors = {};
    if (!form.product_name) newErrors.product_name = "กรุณากรอกชื่อสินค้า";
    if (form.cost_price === "") newErrors.cost_price = "ระบุราคาทุน";
    if (form.selling_price === "") newErrors.selling_price = "ระบุราคาขาย";
    if (form.stock_quantity === "") newErrors.stock_quantity = "ระบุจำนวน";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...form,
      cost_price: parseFloat(form.cost_price),
      selling_price: parseFloat(form.selling_price),
      stock_quantity: parseInt(form.stock_quantity),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "Products", editId), payload);
        showSnackbar("อัปเดตข้อมูลเรียบร้อยแล้ว", "success");
      } else {
        await addDoc(refProductTable, payload);
        showSnackbar("เพิ่มสินค้าใหม่เรียบร้อยแล้ว", "success");
      }
      setForm(initialFormState);
      setOpen(false);
      setEditId(null);
    } catch (err) {
      console.error(err);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบสินค้านี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(refProductTable, id));
          showSnackbar("ลบข้อมูลสำเร็จ", "success");
        } catch (err) {
          showSnackbar("ไม่สามารถลบข้อมูลได้", "error");
        }
      }
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(refCategoryTable, { category_name: newCategoryName });
      showSnackbar("เพิ่มหมวดหมู่สำเร็จ", "success");
      setNewCategoryName("");
      setOpenCatModal(false);
    } catch (err) {
      console.error(err);
      showSnackbar("เกิดข้อผิดพลาด", "error");
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? (
      cat.category_name
    ) : (
      <span style={{ color: "#999", fontStyle: "italic" }}>ไม่ระบุ</span>
    );
  };

  const getStockStatus = (qty) => {
    const q = parseInt(qty);
    if (q === 0)
      return (
        <Chip label="หมดสต็อก" color="error" size="small" variant="outlined" />
      );
    if (q < 10)
      return (
        <Chip label="ใกล้หมด" color="warning" size="small" variant="outlined" />
      );
    return (
      <Chip label="พร้อมขาย" color="success" size="small" variant="outlined" />
    );
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCategory("all");
    setSelectedIds([]);
  };

  // ================= HANDLERS: BARCODE & PRINTING =================
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelecteds = visibleRows.map((n) => n.id); // เลือกเฉพาะหน้าปัจจุบัน
      setSelectedIds(newSelecteds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }
    setSelectedIds(newSelected);
  };

  const handleOpenSingleBarcode = (item) => {
    setItemsToPrint([item]);
    setOpenBarcodeDialog(true);
  };

  const handleOpenMultipleBarcode = () => {
    const targets = data.filter((item) => selectedIds.includes(item.id));
    setItemsToPrint(targets);
    setOpenBarcodeDialog(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // ================= RENDER =================
  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 5, mb: 5, fontFamily: "Sarabun, sans-serif" }}
    >
      <style>{` .swal2-container { z-index: 20000 !important; } `}</style>

      {/* --- HEADER TOP --- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            color="success.main"
          >
            <Inventory2OutlinedIcon
              sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }}
            />
            จัดการคลังสินค้า
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            ภาพรวมรายการสต็อกทั้งหมด ( {data.length} รายการ )
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleOpenMultipleBarcode}
              sx={{ borderRadius: 2 }}
            >
              พิมพ์ Barcode ({selectedIds.length})
            </Button>
          )}

          <Button
            variant="contained"
            size="large"
            color="success"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenAdd}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
          >
            เพิ่มสินค้าใหม่
          </Button>
        </Stack>
      </Box>

      {/* --- FILTER TOOLBAR --- */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: "white",
          border: "1px solid #e0e0e0",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            placeholder="ค้นหาชื่อ, Barcode, ตำแหน่ง..."
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
              <CategoryIcon
                sx={{ fontSize: 16, verticalAlign: "text-top", mr: 0.5 }}
              />
              หมวดหมู่
            </InputLabel>
            <Select
              value={filterCategory}
              label="หมวดหมู่"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} fullWidth>
            <InputLabel>
              <FilterAltIcon
                sx={{ fontSize: 16, verticalAlign: "text-top", mr: 0.5 }}
              />
              สถานะสินค้า
            </InputLabel>
            <Select
              value={filterStatus}
              label="สถานะสินค้า"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="in_stock">✅ พร้อมขาย</MenuItem>
              <MenuItem value="low_stock">⚠️ ใกล้หมด</MenuItem>
              <MenuItem value="out_of_stock">❌ หมดสต็อก</MenuItem>
            </Select>
          </FormControl>
          {(searchTerm ||
            filterStatus !== "all" ||
            filterCategory !== "all") && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={handleResetFilter}
              sx={{ borderColor: "#ddd", color: "#666", whiteSpace: "nowrap" }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </Stack>
      </Paper>

      {/* --- TABLE SECTION ✅ --- */}
      <TableContainer
        component={Paper}
        elevation={4}
        sx={{ borderRadius: 3, overflow: "hidden" }}
      >
        <Table sx={{ minWidth: 700 }}>
          {/* ✅ Sortable Table Head */}
          <TableHead sx={{ bgcolor: "#4caf50" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < visibleRows.length
                  }
                  checked={
                    visibleRows.length > 0 &&
                    selectedIds.length === visibleRows.length
                  }
                  onChange={handleSelectAll}
                  sx={{
                    color: "white",
                    "&.Mui-checked": { color: "white" },
                    "&.MuiCheckbox-indeterminate": { color: "white" },
                  }}
                />
              </TableCell>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"} // จัดตำแหน่งตามประเภทข้อมูล
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : "asc"}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                      sx={{
                        color: "white !important", // บังคับสีขาว
                        "& .MuiTableSortLabel-icon": {
                          color: "white !important",
                        },
                      }}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === "desc"
                            ? "sorted descending"
                            : "sorted ascending"}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((item) => {
                const isSelected = selectedIds.indexOf(item.id) !== -1;
                return (
                  <TableRow
                    key={item.id}
                    hover
                    selected={isSelected}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="success"
                        checked={isSelected}
                        onChange={(event) => handleSelectOne(event, item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="คลิกเพื่อสร้าง/ปริ้น Barcode">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenSingleBarcode(item)}
                          >
                            <QrCodeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" fontFamily="monospace">
                          {item.barcode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.product_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Zone: {item.location || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryName(item.Categories_category_id)}
                        size="small"
                        sx={{ bgcolor: "#e3f2fd", color: "#1565c0" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="success.main">
                        ฿{Number(item.selling_price).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        ทุน: {Number(item.cost_price).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {" "}
                      {/* จัดกึ่งกลางไม่ได้ใน Sort Mode ต้องล้อตาม Header */}
                      <Typography
                        variant="h6"
                        component="span"
                        fontWeight="bold"
                      >
                        {item.stock_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {getStockStatus(item.stock_quantity)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="แก้ไขข้อมูล">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#ff9800",
                              bgcolor: "#fff3e0",
                              "&:hover": { bgcolor: "#ffe0b2" },
                            }}
                            onClick={() => handleOpenEdit(item)}
                          >
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="ลบข้อมูล">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#ef5350",
                              bgcolor: "#ffebee",
                              "&:hover": { bgcolor: "#ffcdd2" },
                            }}
                            onClick={() => handleDeleteProduct(item.id)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Inventory2OutlinedIcon
                    sx={{ fontSize: 60, color: "#e0e0e0", mb: 2 }}
                  />
                  <Typography color="text.secondary" variant="h6">
                    ไม่พบข้อมูลสินค้า
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleResetFilter}
                    sx={{ mt: 2 }}
                  >
                    แสดงข้อมูลทั้งหมด
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination Control */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="แถวต่อหน้า:"
        />
      </TableContainer>

      {/* --- DIALOG: PRINT BARCODE --- */}
      <Dialog
        open={openBarcodeDialog}
        onClose={() => setOpenBarcodeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          พิมพ์ Barcode ({itemsToPrint.length} รายการ)
        </DialogTitle>
        <DialogContent dividers>
          <Box
            ref={componentRef}
            sx={{
              p: 2,
              backgroundColor: "white",
              "@media print": { padding: "20px" },
            }}
          >
            <Grid container spacing={3}>
              {itemsToPrint.map((item) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={item.id}
                  sx={{ textAlign: "center", pageBreakInside: "avoid" }}
                >
                  <Box
                    sx={{
                      border: "1px dashed #ccc",
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ mb: 1, fontSize: "0.9rem" }}
                    >
                      {item.product_name}
                    </Typography>

                    {item.barcode ? (
                      <Barcode
                        value={item.barcode}
                        width={1.5}
                        height={50}
                        fontSize={14}
                        margin={0}
                      />
                    ) : (
                      <Box
                        height={50}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="#f5f5f5"
                        width="100%"
                      >
                        <Typography variant="caption">ไม่มี Barcode</Typography>
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      ฿{Number(item.selling_price).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBarcodeDialog(false)}>ปิด</Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
          >
            สั่งพิมพ์
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ADD/EDIT PRODUCT --- */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{ bgcolor: "#f8f9fa", borderBottom: "1px solid #eee", py: 2 }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                bgcolor: editId ? "#ff9800" : "success.main",
                color: "white",
                p: 1,
                borderRadius: 1,
                display: "flex",
              }}
            >
              {editId ? (
                <EditOutlinedIcon fontSize="small" />
              ) : (
                <StorefrontIcon fontSize="small" />
              )}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                {editId ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Identity */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <QrCodeIcon fontSize="small" /> ข้อมูลทั่วไป
              </Typography>
              <Box
                display="flex"
                gap={2}
                sx={{ flexDirection: { xs: "column", sm: "row" } }}
              >
                <Box sx={{ flex: { sm: 0.35 }, width: "100%" }}>
                  <TextField
                    label="Barcode / SKU"
                    name="barcode"
                    fullWidth
                    value={form.barcode}
                    onChange={handleChang}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="สุ่มรหัส">
                            <IconButton
                              onClick={handleGenerateBarcode}
                              edge="end"
                              color="primary"
                            >
                              <AutorenewIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1, width: "100%" }}>
                  <TextField
                    label="ชื่อสินค้า"
                    name="product_name"
                    fullWidth
                    required
                    error={!!errors.product_name}
                    helperText={errors.product_name}
                    value={form.product_name}
                    onChange={handleChang}
                  />
                </Box>
              </Box>
            </Box>
            <Divider sx={{ borderStyle: "dashed" }} />
            {/* Category & Location */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <CategoryIcon fontSize="small" /> การจัดเก็บ
              </Typography>
              <Box
                display="flex"
                gap={2}
                sx={{ flexDirection: { xs: "column", sm: "row" } }}
              >
                <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>หมวดหมู่สินค้า</InputLabel>
                    <Select
                      name="Categories_category_id"
                      value={form.Categories_category_id}
                      label="หมวดหมู่สินค้า"
                      onChange={handleChang}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.category_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    sx={{
                      minWidth: 56,
                      height: 56,
                      borderColor: "#ccc",
                      color: "#666",
                    }}
                    onClick={() => setOpenCatModal(true)}
                  >
                    <AddCircleOutlineIcon />
                  </Button>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="ตำแหน่งเก็บ (Location)"
                    name="location"
                    fullWidth
                    value={form.location}
                    onChange={handleChang}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory2OutlinedIcon
                            fontSize="small"
                            sx={{ color: "text.disabled" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Divider sx={{ borderStyle: "dashed" }} />
            {/* Price & Stock */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <AttachMoneyIcon fontSize="small" /> ราคาและสต็อก
              </Typography>
              <Box
                display="flex"
                gap={2}
                sx={{ flexDirection: { xs: "column", sm: "row" } }}
              >
                <TextField
                  label="ราคาทุน"
                  name="cost_price"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.cost_price}
                  helperText={errors.cost_price}
                  value={form.cost_price}
                  onChange={handleChang}
                />
                <TextField
                  label="ราคาขาย"
                  name="selling_price"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.selling_price}
                  helperText={errors.selling_price}
                  value={form.selling_price}
                  onChange={handleChang}
                />
                <TextField
                  label="จำนวนสต็อก"
                  name="stock_quantity"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.stock_quantity}
                  helperText={errors.stock_quantity}
                  value={form.stock_quantity}
                  onChange={handleChang}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, bgcolor: "#f8f9fa", borderTop: "1px solid #eee" }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveProduct}
            variant="contained"
            color="success"
            size="large"
            sx={{ px: 4 }}
          >
            {editId ? "อัปเดตข้อมูล" : "บันทึกสินค้า"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ADD CATEGORY --- */}
      <Dialog open={openCatModal} onClose={() => setOpenCatModal(false)}>
        <DialogTitle>เพิ่มหมวดหมู่สินค้า</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ชื่อหมวดหมู่"
            fullWidth
            variant="standard"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCatModal(false)}>ยกเลิก</Button>
          <Button onClick={handleAddCategory} variant="contained">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Product;
