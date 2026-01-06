import React, { useState, useEffect } from "react";
// --- Config Firebase ---
// อย่าลืมตรวจสอบ path ให้ตรงกับโปรเจกต์ของคุณ
import { db } from "../firebase/config"; 
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// --- SweetAlert2 Import ---
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
  Stack
} from "@mui/material";

// --- Icons Imports ---
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CategoryIcon from "@mui/icons-material/Category";

const Product = () => {
  // ================= STATE MANAGEMENT =================
  // 1. Product Form State
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
  
  // 2. Data Lists State
  const [data, setData] = useState([]); // รายการสินค้า
  const [categories, setCategories] = useState([]); // รายการหมวดหมู่
  
  // 3. UI/Modal State
  const [open, setOpen] = useState(false); // Modal สินค้า
  const [openCatModal, setOpenCatModal] = useState(false); // Modal หมวดหมู่
  const [newCategoryName, setNewCategoryName] = useState(""); 

  // Firestore References
  const refProductTable = collection(db, "Products");
  const refCategoryTable = collection(db, "Categories");

  // ================= USE EFFECT (Realtime Data) =================
  useEffect(() => {
    // Listener 1: Products
    const unsubProd = onSnapshot(refProductTable, (snapshot) => {
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(newData);
    });

    // Listener 2: Categories
    const unsubCat = onSnapshot(refCategoryTable, (snapshot) => {
      const newCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(), 
      }));
      setCategories(newCats);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  // ================= HANDLERS =================
  const handleChang = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 1. Add Product with SweetAlert
  const handleAddProduct = async () => {
    // Validation: เช็คว่าชื่อสินค้าไม่ว่าง
    if(!form.product_name) {
        Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อสินค้า', 'warning');
        return;
    }

    const payload = {
      ...form,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
    };

    try {
      await addDoc(refProductTable, payload);
      
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'เพิ่มข้อมูลสินค้าเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });

      setForm(initialFormState);
      setOpen(false);

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  // 2. Delete Product with Confirmation
  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบสินค้านี้ใช่หรือไม่? (ไม่สามารถกู้คืนได้)",
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
          Swal.fire(
            'ลบเรียบร้อย!',
            'ข้อมูลสินค้าถูกลบออกจากระบบแล้ว',
            'success'
          );
        } catch (err) {
          Swal.fire('Error', 'เกิดข้อผิดพลาดในการลบ', 'error');
        }
      }
    });
  };

  // 3. Add Category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await addDoc(refCategoryTable, { category_name: newCategoryName });
      
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มหมวดหมู่สำเร็จ',
        showConfirmButton: false,
        timer: 1000
      });

      setNewCategoryName("");
      setOpenCatModal(false); 
    } catch (err) {
       console.error(err);
    }
  };

  // ================= UI HELPERS =================
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

  // ================= RENDER =================
  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5, fontFamily: 'Sarabun, sans-serif' }}>
      
      {/* --- HEADER SECTION --- */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#f8f9fa' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main" gutterBottom>
              <Inventory2OutlinedIcon sx={{ fontSize: 35, verticalAlign: 'middle', mr: 1 }} />
              จัดการคลังสินค้า
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ภาพรวมรายการสินค้าและจัดการสต็อกของคุณ ({data.length} รายการ)
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AddCircleOutlineIcon />} 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', boxShadow: 2 }}
          >
            เพิ่มสินค้าใหม่
          </Button>
        </Box>
      </Paper>

      {/* --- TABLE SECTION --- */}
      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: '#3f51b5' }}>
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
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                       <QrCodeIcon color="action" fontSize="small" />
                       <Typography variant="body2" fontFamily="monospace">{item.barcode}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">{item.product_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Loc: {item.location || '-'}</Typography>
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
                    <IconButton 
                        size="small"
                        sx={{ color: '#ef5350', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }} 
                        onClick={() => handleDeleteProduct(item.id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Inventory2OutlinedIcon sx={{ fontSize: 60, color: '#e0e0e0' }} />
                        <Typography color="text.secondary">ยังไม่มีข้อมูลสินค้า</Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL 1: Add Product (Professional Flex Layout) --- */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', py: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1, display: 'flex' }}>
                    <StorefrontIcon fontSize="small" />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>เพิ่มสินค้าใหม่</Typography>
                    <Typography variant="caption" color="text.secondary">กรอกรายละเอียดสินค้าให้ครบถ้วน</Typography>
                </Box>
            </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {/* Main Layout using Stack */}
          <Stack spacing={3}>

            {/* === SECTION 1: Identity === */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCodeIcon fontSize="small" /> ข้อมูลทั่วไป
                </Typography>
                
                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ flex: { sm: 0.35 }, width: '100%' }}>
                        <TextField 
                            label="Barcode / SKU" 
                            name="barcode" 
                            fullWidth 
                            size="medium"
                            value={form.barcode} 
                            onChange={handleChang} 
                            placeholder="รหัสสินค้า"
                        />
                    </Box>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField 
                            label="ชื่อสินค้า" 
                            name="product_name" 
                            fullWidth 
                            required
                            value={form.product_name} 
                            onChange={handleChang} 
                            placeholder="ระบุชื่อสินค้า"
                        />
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* === SECTION 2: Category & Location === */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon fontSize="small" /> การจัดเก็บ
                </Typography>

                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Category Group */}
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
                        {/* Add Cat Button */}
                        <Button 
                            variant="outlined" 
                            sx={{ minWidth: 56, height: 56, borderColor: 'rgba(0, 0, 0, 0.23)', color: 'text.secondary' }}
                            onClick={() => setOpenCatModal(true)}
                        >
                            <AddCircleOutlineIcon />
                        </Button>
                    </Box>

                    {/* Location */}
                    <Box sx={{ flex: 1 }}>
                        <TextField 
                            label="ตำแหน่งเก็บ (Location)" 
                            name="location" 
                            fullWidth 
                            value={form.location} 
                            onChange={handleChang} 
                            placeholder="Zone A, ชั้น 2"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Inventory2OutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }}/></InputAdornment>,
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* === SECTION 3: Pricing & Stock === */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" /> ราคาและสต็อก
                </Typography>

                <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField 
                        label="ราคาทุน" 
                        name="cost_price" 
                        type="number" 
                        fullWidth 
                        sx={{ flex: 1 }}
                        value={form.cost_price} 
                        onChange={handleChang} 
                        InputProps={{
                            startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                        }}
                    />
                    <TextField 
                        label="ราคาขาย" 
                        name="selling_price" 
                        type="number" 
                        fullWidth 
                        sx={{ flex: 1 }}
                        value={form.selling_price} 
                        onChange={handleChang}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                        }} 
                    />
                    <TextField 
                        label="จำนวนสต็อก" 
                        name="stock_quantity" 
                        type="number" 
                        fullWidth 
                        sx={{ flex: 1 }}
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
            onClick={handleAddProduct} 
            variant="contained" 
            size="large" 
            disableElevation
            startIcon={<AddCircleOutlineIcon />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            บันทึกสินค้า
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL 2: Add Category (Sub-Modal) --- */}
      <Dialog open={openCatModal} onClose={() => setOpenCatModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
                <CategoryIcon color="secondary" />
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
            <Button onClick={() => setOpenCatModal(false)}>ปิด</Button>
            <Button onClick={handleAddCategory} variant="contained" color="secondary">
                ยืนยัน
            </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Product;