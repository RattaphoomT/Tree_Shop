import React, { useState, useEffect } from "react";
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

// --- SweetAlert2 Import (ใช้เฉพาะยืนยันการลบ) ---
import Swal from "sweetalert2";

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
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SearchIcon from '@mui/icons-material/Search'; 
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const Product = () => {
  // ================= STATE MANAGEMENT =================
  const initialFormState = {    
    barcode: "",
    product_name: "",
    cost_price: "",
    selling_price: "",
    location: "",
    stock_quantity: "",
    Categories_category_id: "" 
  };
  
  const [form, setForm] = useState(initialFormState);
  
  // State สำหรับเก็บ Error ของแต่ละ field
  const [errors, setErrors] = useState({}); 

  const [data, setData] = useState([]); 
  const [categories, setCategories] = useState([]); 
  
  // --- Filter & Search State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); 

  // UI States
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openCatModal, setOpenCatModal] = useState(false); 
  const [newCategoryName, setNewCategoryName] = useState(""); 

  // --- Snackbar State ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Firestore References
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

  // ================= LOGIC: FILTER / SEARCH =================
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const pName = item.product_name ? item.product_name.toLowerCase() : "";
    const pBarcode = item.barcode ? item.barcode.toString() : "";
    const pLoc = item.location ? item.location.toLowerCase() : "";
    const matchesSearch = pName.includes(term) || pBarcode.includes(term) || pLoc.includes(term);

    let matchesStatus = true;
    const qty = parseInt(item.stock_quantity) || 0;

    if (filterStatus === "out_of_stock") {
        matchesStatus = qty === 0;
    } else if (filterStatus === "low_stock") {
        matchesStatus = qty > 0 && qty < 10;
    } else if (filterStatus === "in_stock") {
        matchesStatus = qty >= 10;
    }

    return matchesSearch && matchesStatus;
  });

  // ================= HANDLERS =================
  const handleChang = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // เมื่อพิมพ์แก้ ให้ลบ Error ของช่องนั้นทิ้ง
    if (errors[name]) {
        setErrors({ ...errors, [name]: null });
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGenerateBarcode = () => {
    let isUnique = false;
    let randomCode = "";
    while (!isUnique) {
        randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const exists = data.some(item => item.barcode === randomCode);
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
    // ⭐⭐ FIX: Validation Logic แบบ Inline ⭐⭐
    const newErrors = {};
    
    // 1. เช็คชื่อสินค้า
    if (!form.product_name) newErrors.product_name = "กรุณากรอกชื่อสินค้า";

    // 2. เช็คราคาทุน
    if (form.cost_price === "") {
        newErrors.cost_price = "ระบุราคาทุน";
    } else if (parseFloat(form.cost_price) < 0) {
        newErrors.cost_price = "ห้ามติดลบ";
    }

    // 3. เช็คราคาขาย
    if (form.selling_price === "") {
        newErrors.selling_price = "ระบุราคาขาย";
    } else if (parseFloat(form.selling_price) < 0) {
        newErrors.selling_price = "ห้ามติดลบ";
    }

    // 4. เช็คจำนวนสต็อก (ห้ามติดลบ)
    if (form.stock_quantity === "") {
        newErrors.stock_quantity = "ระบุจำนวน";
    } else if (parseInt(form.stock_quantity) < 0) {
        newErrors.stock_quantity = "ห้ามติดลบ"; // ❌ เงื่อนไขที่เพิ่มเข้ามา
    }

    // ถ้ามี error อย่างน้อย 1 ตัว ให้เซ็ต state และหยุดทำงาน
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
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบสินค้านี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
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
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.category_name : <span style={{color: '#999', fontStyle: 'italic'}}>ไม่ระบุ</span>; 
  };

  const getStockStatus = (qty) => {
    const q = parseInt(qty);
    if (q === 0) return <Chip label="หมดสต็อก" color="error" size="small" variant="outlined" />;
    if (q < 10) return <Chip label="ใกล้หมด" color="warning" size="small" variant="outlined" />;
    return <Chip label="พร้อมขาย" color="success" size="small" variant="outlined" />;
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  // ================= RENDER =================
  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5, fontFamily: 'Sarabun, sans-serif' }}>
      
      {/* CSS Fix for SweetAlert Z-Index */}
      <style>{`
        .swal2-container {
          z-index: 20000 !important;
        }
      `}</style>

      {/* --- HEADER TOP --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="success.main">
              <Inventory2OutlinedIcon sx={{ fontSize: 35, verticalAlign: 'middle', mr: 1 }} />
              จัดการคลังสินค้า
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={0.5}>
              ภาพรวมรายการสต็อกทั้งหมด ( {data.length} รายการ )
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            size="large"
            color="success"
            startIcon={<AddCircleOutlineIcon />} 
            onClick={handleOpenAdd}
            sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', boxShadow: 3 }}
        >
            เพิ่มสินค้าใหม่
        </Button>
      </Box>

      {/* --- FILTER TOOLBAR --- */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'white', border: '1px solid #e0e0e0' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
                placeholder="ค้นหาชื่อ, Barcode, ตำแหน่ง..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 2 }}
                InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                }}
            />
            <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} fullWidth>
                <InputLabel><FilterAltIcon sx={{fontSize: 16, verticalAlign: 'text-top', mr: 0.5}}/>สถานะสินค้า</InputLabel>
                <Select
                    value={filterStatus}
                    label="สถานะสินค้า"
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <MenuItem value="all">ทั้งหมด</MenuItem>
                    <MenuItem value="in_stock">✅ พร้อมขาย (In Stock)</MenuItem>
                    <MenuItem value="low_stock">⚠️ ใกล้หมด (Low Stock)</MenuItem>
                    <MenuItem value="out_of_stock">❌ หมดสต็อก (Out of Stock)</MenuItem>
                </Select>
            </FormControl>
            {(searchTerm || filterStatus !== 'all') && (
                <Button 
                    variant="outlined" 
                    color="inherit" 
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetFilter}
                    sx={{ borderColor: '#ddd', color: '#666' }}
                >
                    ล้างตัวกรอง
                </Button>
            )}
        </Stack>
      </Paper>

      {/* --- TABLE SECTION --- */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: '#4caf50' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>BARCODE</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ชื่อสินค้า</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>หมวดหมู่</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>ราคาขาย</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>คงเหลือ</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>สถานะ</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                       <QrCodeIcon color="action" fontSize="small" />
                       <Typography variant="body2" fontFamily="monospace">{item.barcode}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                         {item.product_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Zone: {item.location || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                     <Chip label={getCategoryName(item.Categories_category_id)} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="success.main">
                      ฿{Number(item.selling_price).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      ทุน: {Number(item.cost_price).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {item.stock_quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStockStatus(item.stock_quantity)}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="แก้ไขข้อมูล">
                            <IconButton 
                                size="small"
                                sx={{ color: '#ff9800', bgcolor: '#fff3e0', '&:hover': { bgcolor: '#ffe0b2' } }} 
                                onClick={() => handleOpenEdit(item)}
                            >
                            <EditOutlinedIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="ลบข้อมูล">
                            <IconButton 
                                size="small"
                                sx={{ color: '#ef5350', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }} 
                                onClick={() => handleDeleteProduct(item.id)}
                            >
                            <DeleteOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Inventory2OutlinedIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
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
      </TableContainer>

      {/* --- MODAL ADD/EDIT PRODUCT --- */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', py: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ bgcolor: editId ? '#ff9800' : 'success.main', color: 'white', p: 1, borderRadius: 1, display: 'flex' }}>
                    {editId ? <EditOutlinedIcon fontSize="small" /> : <StorefrontIcon fontSize="small" />}
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                        {editId ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอกให้ครบ
                    </Typography>
                </Box>
            </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Identity */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    <QrCodeIcon fontSize="small" /> ข้อมูลทั่วไป
                </Typography>
                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ flex: { sm: 0.35 }, width: '100%' }}>
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
                                            <IconButton onClick={handleGenerateBarcode} edge="end" color="primary">
                                                <AutorenewIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField 
                            label="ชื่อสินค้า" 
                            name="product_name" 
                            fullWidth 
                            required 
                            // ผูก Error State
                            error={!!errors.product_name}
                            helperText={errors.product_name}
                            value={form.product_name} 
                            onChange={handleChang} 
                        />
                    </Box>
                </Box>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            {/* Category & Location */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    <CategoryIcon fontSize="small" /> การจัดเก็บ
                </Typography>
                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>หมวดหมู่สินค้า</InputLabel>
                            <Select
                                name="Categories_category_id"
                                value={form.Categories_category_id}
                                label="หมวดหมู่สินค้า"  
                                onChange={handleChang}
                            >   
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button 
                            variant="outlined" 
                            sx={{ minWidth: 56, height: 56, borderColor: '#ccc', color: '#666' }}
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
                                startAdornment: <InputAdornment position="start"><Inventory2OutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }}/></InputAdornment>,
                            }}
                        />
                    </Box>
                </Box>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            {/* Price & Stock */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    <AttachMoneyIcon fontSize="small" /> ราคาและสต็อก
                </Typography>
                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField 
                        label="ราคาทุน" 
                        name="cost_price" 
                        type="number"
                        inputProps={{ min: 0 }} // ✅ บังคับ UI ห้ามกดลงต่ำกว่า 0
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
                        inputProps={{ min: 0 }} // ✅ บังคับ UI ห้ามกดลงต่ำกว่า 0
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
                        inputProps={{ min: 0 }} // ✅ บังคับ UI ห้ามกดลงต่ำกว่า 0
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
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', mr: 1 }}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSaveProduct} 
            variant="contained" 
            color={editId ? "warning" : "success"}
            size="large" 
            disableElevation
            startIcon={editId ? <EditOutlinedIcon /> : <AddCircleOutlineIcon />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {editId ? "อัปเดตข้อมูล" : "บันทึกสินค้า"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ADD CATEGORY --- */}
      <Dialog open={openCatModal} onClose={() => setOpenCatModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
                <CategoryIcon color="success" />
                <Typography variant="h6">เพิ่มหมวดหมู่</Typography>
            </Box>
        </DialogTitle>
        <DialogContent>
            <TextField 
                autoFocus
                margin="dense"
                label="ชื่อหมวดหมู่ใหม่"
                fullWidth
                variant="standard"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenCatModal(false)} color="error" >ปิด</Button>
            <Button onClick={handleAddCategory} variant="contained" color="success">
                ยืนยัน
            </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR TOP-RIGHT */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} 
        sx={{ mt: 7 }} 
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ width: '100%', boxShadow: 3, fontSize: '1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default Product;