import React, { useState, useEffect } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config"; 
import { collection, onSnapshot } from "firebase/firestore";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Paper,
  Badge,
  IconButton,
  Divider,
  Button,
  CircularProgress
} from "@mui/material";

// --- Icons ---
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PaymentIcon from "@mui/icons-material/Payment";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

const POS = () => {
  const [products, setProducts] = useState([]); 
  // แก้ไข: เก็บเป็น Object { id, name } เพื่อให้เอา ID ไปเทียบกับสินค้าได้
  const [categories, setCategories] = useState([{ id: "all", name: "ทั้งหมด" }]); 
  
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // แก้ไข: เก็บเป็น ID ของหมวดหมู่ที่เลือก (เริ่มต้นเป็น 'all')
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // ================= CONNECT FIREBASE =================
  useEffect(() => {
    // 1. ดึงสินค้า
    const unsubProducts = onSnapshot(collection(db, "Products"), (snapshot) => {
      const productData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productData);
      setLoading(false);
    });

    // 2. ดึงหมวดหมู่ (แก้ไขให้ตรงกับ Field จริง)
    const unsubCategories = onSnapshot(collection(db, "Categories"), (snapshot) => {
      const categoryList = snapshot.docs.map((doc) => ({
        id: doc.id,
        // *** แก้ไขตรงนี้: จาก .name เป็น .category_name ***
        name: doc.data().category_name || "ไม่ระบุชื่อ" 
      }));
      
      // เอา object "ทั้งหมด" ไว้ตัวแรก
      setCategories([{ id: "all", name: "ทั้งหมด" }, ...categoryList]);
    });

    return () => {
        unsubProducts();
        unsubCategories();
    }; 
  }, []);

  // ================= LOGIC =================
  const handleAddToCart = (product) => {
    const stock = parseInt(product.stock_quantity) || 0;
    if (stock <= 0) return; 
    
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        if (exist.qty >= stock) {
            alert("สินค้าหมดสต็อก!");
            return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
           const product = products.find(p => p.id === id);
           const stock = parseInt(product?.stock_quantity) || 0;
           
           if (delta > 0 && item.qty >= stock) return item; 
           return { ...item, qty: Math.max(0, item.qty + delta) };
        }
        return item;
      }).filter(item => item.qty > 0)
    );
  };

  const handleDeleteItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.selling_price) * item.qty), 0);
  const total = subtotal; 

  // ฟังก์ชันช่วยหาชื่อหมวดหมู่จาก ID (สำหรับแสดงบนการ์ดสินค้า)
  const getCategoryNameById = (catId) => {
      if (!catId) return "อื่นๆ";
      const found = categories.find(c => c.id === catId);
      return found ? found.name : "อื่นๆ";
  };

  // Filter Logic (แก้ไขใหม่ให้เทียบ ID)
  const filteredProducts = products.filter((p) => {
    // ดึง ID หมวดหมู่จากสินค้า
    const productCatId = p.Categories_category_id || ""; 
    
    // เงื่อนไข: ถ้าเลือก "all" ให้ผ่านหมด, ถ้าเลือกหมวดอื่นต้อง ID ตรงกัน
    const matchCat = selectedCategoryId === "all" || productCatId === selectedCategoryId;
    
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // ================= RENDER =================
  if (loading) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress sx={{ color: "#1a472a" }} />
            <Typography sx={{ ml: 2, color: "#1a472a" }}>กำลังโหลดข้อมูล...</Typography>
        </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", gap: 3, overflow: "hidden" }}>
      
      {/* LEFT: CATALOG */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
                <Typography variant="h4" fontWeight="800" color="#1a472a">หน้าขายสินค้า</Typography>
                <Typography variant="body2" color="text.secondary">{filteredProducts.length} รายการ</Typography>
            </Box>
            <TextField
                placeholder="ค้นหาชื่อสินค้า..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: "#1a472a" }} /></InputAdornment>) }}
                sx={{ width: 300, bgcolor: "white", borderRadius: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            />
        </Box>

        {/* --- Categories Chips (แก้ไขใหม่) --- */}
        <Box sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
            <Stack direction="row" spacing={1}>
                {categories.map((cat) => (
                    <Chip
                        key={cat.id} // ใช้ ID เป็น key
                        label={cat.name} // แสดงชื่อหมวดหมู่
                        onClick={() => setSelectedCategoryId(cat.id)} // เมื่อคลิก เซ็ต ID
                        sx={{
                            fontWeight: 600,
                            // เช็ค active จาก ID
                            bgcolor: selectedCategoryId === cat.id ? "#1a472a" : "white",
                            color: selectedCategoryId === cat.id ? "white" : "#555",
                            border: "1px solid",
                            borderColor: selectedCategoryId === cat.id ? "#1a472a" : "#e0e0e0",
                            "&:hover": {
                                bgcolor: selectedCategoryId === cat.id ? "#143620" : "#f5f5f5"
                            }
                        }}
                    />
                ))}
            </Stack>
        </Box>
        {/* -------------------------------------- */}

        {/* Product Grid */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: 1, pb: 2 }}>
            <Grid container spacing={2}>
                {filteredProducts.map((product) => {
                    const stock = parseInt(product.stock_quantity) || 0;
                    const isOutOfStock = stock <= 0;
                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                            <Card sx={{ height: "100%", borderRadius: 3, opacity: isOutOfStock ? 0.6 : 1, bgcolor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", "&:hover": { transform: !isOutOfStock && "translateY(-4px)", boxShadow: "0 8px 16px rgba(26, 71, 42, 0.1)" } }}>
                                <CardActionArea onClick={() => handleAddToCart(product)} disabled={isOutOfStock} sx={{ height: "100%", p: 2.5, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between" }}>
                                    <Box width="100%" mb={2}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3, fontSize: "1.1rem", color: "#333" }}>
                                            {product.product_name}
                                        </Typography>
                                        {/* แก้ไข: ใช้ฟังก์ชันแปลง ID เป็นชื่อ */}
                                        <Typography variant="caption" sx={{ color: "#1a472a", fontWeight: "bold", bgcolor: "#e8f5e9", px: 1, py: 0.5, borderRadius: 1 }}>
                                            {getCategoryNameById(product.Categories_category_id)}
                                        </Typography>
                                    </Box>
                                    <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-end">
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" fontSize={12}>ราคา</Typography>
                                            <Typography variant="h6" color="#1a472a" fontWeight="800">฿{Number(product.selling_price).toLocaleString()}</Typography>
                                        </Box>
                                        <Chip sx={{ mb: 0.5 , ml: 1 }} label={isOutOfStock ? "หมด" : `คลัง: ${stock}`} size="small" color={isOutOfStock ? "error" : "default"} variant="outlined" icon={!isOutOfStock ? <Inventory2OutlinedIcon sx={{ fontSize: "14px !important" }} /> : undefined} />
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
      </Box>

      {/* RIGHT: CART (เหมือนเดิม) */}
      <Paper elevation={0} sx={{ width: 380, flexShrink: 0, borderRadius: 4, display: "flex", flexDirection: "column", bgcolor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: "#f9fafb", borderBottom: "1px solid #eee" }}>
            <Box display="flex" alignItems="center" gap={1}>
                <Badge badgeContent={cart.length} color="error"><ShoppingCartOutlinedIcon sx={{ color: "#1a472a" }} /></Badge>
                <Typography variant="h6" fontWeight="bold" color="#1a472a">ตะกร้าสินค้า</Typography>
            </Box>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {cart.map((item) => (
                <Box key={item.id} sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2, p: 2, borderRadius: 2, bgcolor: "#fff", border: "1px solid #f5f5f5", position: "relative" }}>
                     <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box pr={4}><Typography variant="body1" fontWeight="bold">{item.product_name}</Typography><Typography variant="caption" color="text.secondary">@{Number(item.selling_price).toLocaleString()}</Typography></Box>
                        <IconButton size="small" onClick={() => handleDeleteItem(item.id)} sx={{ position: "absolute", top: 8, right: 8, color: "#ef5350", bgcolor: "#ffebee" }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                     </Box>
                     <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                         <Box display="flex" alignItems="center" bgcolor="#f5f5f5" borderRadius={1}>
                            <IconButton size="small" onClick={() => handleUpdateQty(item.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                            <Typography variant="body2" fontWeight="bold" sx={{ mx: 1, minWidth: 20, textAlign: "center" }}>{item.qty}</Typography>
                            <IconButton size="small" onClick={() => handleUpdateQty(item.id, 1)} sx={{ color: "#4caf50" }}><AddIcon fontSize="small" /></IconButton>
                        </Box>
                        <Typography fontWeight="bold" color="#1a472a">฿{(Number(item.selling_price) * item.qty).toLocaleString()}</Typography>
                     </Box>
                </Box>
            ))}
        </Box>
        <Box sx={{ p: 3, bgcolor: "#fff", borderTop: "1px dashed #e0e0e0" }}>
            <Box display="flex" justifyContent="space-between" mb={1}><Typography color="text.secondary">รวมเป็นเงิน</Typography><Typography fontWeight="bold">฿{total.toLocaleString()}</Typography></Box>
            <Divider sx={{ mb: 2, mt: 1 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}><Typography variant="h6" fontWeight="bold">ยอดสุทธิ</Typography><Typography variant="h4" fontWeight="800" color="#1a472a">฿{total.toLocaleString()}</Typography></Box>
            <Button variant="contained" size="large" fullWidth startIcon={<PaymentIcon />} disabled={cart.length === 0} sx={{ bgcolor: "#1a472a", borderRadius: 3, height: 50, fontSize: 18, fontWeight: "bold" }}>ชำระเงิน</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default POS;