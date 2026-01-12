import React, { useState, useEffect, useRef } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

// --- Print Library ---
import { useReactToPrint } from "react-to-print";

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
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

// --- Icons ---
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PaymentIcon from "@mui/icons-material/Payment";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "ทั้งหมด" },
  ]);

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // --- Discount State ---
  const [discount, setDiscount] = useState(""); 

  // --- Payment State ---
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); 
  const [receivedAmount, setReceivedAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- ✅ Receipt State (เพิ่มใหม่) ---
  const [openReceipt, setOpenReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null); // เก็บข้อมูลบิลล่าสุดเพื่อแสดงผล
  const receiptRef = useRef(); // Ref สำหรับสั่งพิมพ์

  // State แจ้งเตือน
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ================= CONNECT FIREBASE =================
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "Products"), (snapshot) => {
      const productData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productData);
      setLoading(false);
    });

    const unsubCategories = onSnapshot(
      collection(db, "Categories"),
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().category_name || "ไม่ระบุชื่อ",
        }));
        setCategories([{ id: "all", name: "ทั้งหมด" }, ...categoryList]);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // ================= LOGIC =================

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };

  // ✅ ฟังก์ชันสั่งพิมพ์
  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: lastOrder ? lastOrder.order_number : 'Receipt',
  });

  const handleCloseReceipt = () => {
      setOpenReceipt(false);
      setLastOrder(null);
      // เคลียร์ค่าต่างๆ เมื่อปิดหน้าบิล
      setCart([]);
      setDiscount("");
      setReceivedAmount("");
      setChangeAmount(0);
  }

  const handleAddToCart = (product) => {
    const stock = parseInt(product.stock_quantity) || 0;

    if (stock <= 0) {
      showNotification(`สินค้า "${product.product_name}" หมดสต็อก!`, "error");
      return;
    }

    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        if (exist.qty >= stock) {
          showNotification(
            `เพิ่มไม่ได้! สินค้าเหลือเพียง ${stock} ชิ้น`,
            "warning"
          );
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
      prev
        .map((item) => {
          if (item.id === id) {
            const product = products.find((p) => p.id === id);
            const stock = parseInt(product?.stock_quantity) || 0;

            if (delta > 0 && item.qty >= stock) {
              showNotification(`สต็อกไม่พอ (มี ${stock} ชิ้น)`, "warning");
              return item;
            }
            return { ...item, qty: Math.max(0, item.qty + delta) };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleDeleteItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.selling_price) * item.qty,
    0
  );
  
  const discountVal = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountVal);

  const getCategoryNameById = (catId) => {
    if (!catId) return "อื่นๆ";
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : "อื่นๆ";
  };

  const filteredProducts = products.filter((p) => {
    const productCatId = p.Categories_category_id || "";
    const matchCat =
      selectedCategoryId === "all" || productCatId === selectedCategoryId;
    const matchSearch = p.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // ================= PAYMENT LOGIC =================
  const handleOpenPayment = () => {
    setPaymentMethod("cash");
    setReceivedAmount("");
    setChangeAmount(0);
    setOpenPayment(true);
  };

  const handlePaymentMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setPaymentMethod(newMethod);
      if (newMethod === "transfer") {
        setReceivedAmount(total.toString());
        setChangeAmount(0);
      } else {
        setReceivedAmount("");
        setChangeAmount(0);
      }
    }
  };

  const handleCalculateChange = (amount) => {
    setReceivedAmount(amount);
    const received = parseFloat(amount);
    if (!isNaN(received)) {
      setChangeAmount(received - total);
    } else {
      setChangeAmount(0);
    }
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV-${dateStr}-${timeStr}-${random}`;
  };

  const handleProcessPayment = async () => {
    const receivedVal = parseFloat(receivedAmount) || 0;

    if (receivedVal < total) {
      showNotification("ยอดเงินที่รับมาไม่เพียงพอ", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const orderRef = doc(collection(db, "Orders"));
      const transactionRef = collection(db, "Stock_Transactions");

      const orderItems = cart.map((item) => {
        const lineTotal = item.qty * parseFloat(item.selling_price);
        
        const productRef = doc(db, "Products", item.id);
        batch.update(productRef, {
            stock_quantity: increment(-item.qty)
        });

        const newTransRef = doc(transactionRef);
        batch.set(newTransRef, {
            product_id: item.id,
            barcode: item.barcode || "",
            product_name: item.product_name,
            transaction_type: "sale_out",
            quantity_change: -item.qty,
            previous_stock: parseInt(item.stock_quantity),
            current_stock: parseInt(item.stock_quantity) - item.qty,
            note: `ขายปลีกบิล #${orderRef.id}`,
            transaction_date: serverTimestamp(),
            cost_price: parseFloat(item.cost_price),
            selling_price: parseFloat(item.selling_price)
        });

        return {
          product_id: item.id,
          barcode: item.barcode || "",
          product_name: item.product_name,
          category: getCategoryNameById(item.Categories_category_id),
          cost_price: parseFloat(item.cost_price),
          selling_price: parseFloat(item.selling_price),
          quantity: item.qty,
          discount_per_item: 0.00,
          total_line: lineTotal
        };
      });

      // Prepare Order Data
      const orderData = {
        id: orderRef.id,
        order_number: generateOrderNumber(),
        transaction_date: serverTimestamp(), // ส่งขึ้น Firebase
        display_date: new Date(), // ✅ เก็บค่า Date object ไว้แสดงผลทันทีใน Receipt (ไม่ต้องรอโหลด)
        
        subtotal: subtotal,
        discount: discountVal,
        grand_total: total,
        
        payment_method: paymentMethod,
        received_amount: receivedVal,
        change_amount: paymentMethod === 'transfer' ? 0 : (changeAmount > 0 ? changeAmount : 0),
        
        cashier_id: "USER_ADMIN",
        cashier_name: "Admin",
        status: "completed",
        note: "",
        items: orderItems
      };

      batch.set(orderRef, orderData);
      await batch.commit();

      showNotification(`ชำระเงินสำเร็จ!`, "success");
      
      // ✅ เก็บข้อมูลบิลล่าสุด และเปิดหน้าใบเสร็จ
      setLastOrder(orderData);
      setOpenPayment(false); // ปิดหน้าจ่ายเงิน
      setOpenReceipt(true);  // เปิดหน้าใบเสร็จ

    } catch (error) {
      console.error("Error processing payment:", error);
      showNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= RENDER =================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress sx={{ color: "#1a472a" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", gap: 3, overflow: "hidden" }}>
      {/* ... [LEFT: CATALOG & RIGHT: CART - ส่วนเดิมทั้งหมด] ... */}
      {/* (เพื่อความกระชับ ผมละส่วนนี้ไว้ ถ้าคุณก๊อปปี้ไปทับ โค้ดเดิมจะถูกแทนที่ถูกต้องครับ) */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
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
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: "#1a472a" }} /></InputAdornment>),
            }}
            sx={{ width: 300, bgcolor: "white", borderRadius: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          />
        </Box>

        <Box sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
          <Stack direction="row" spacing={1}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                onClick={() => setSelectedCategoryId(cat.id)}
                sx={{
                  fontWeight: 600,
                  bgcolor: selectedCategoryId === cat.id ? "#1a472a" : "white",
                  color: selectedCategoryId === cat.id ? "white" : "#555",
                  border: "1px solid",
                  borderColor: selectedCategoryId === cat.id ? "#1a472a" : "#e0e0e0",
                  "&:hover": { bgcolor: selectedCategoryId === cat.id ? "#143620" : "#f5f5f5" },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", pr: 1, pb: 2 }}>
          <Grid container spacing={2}>
            {filteredProducts.map((product) => {
              const stock = parseInt(product.stock_quantity) || 0;
              const isOutOfStock = stock <= 0;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card sx={{ height: "100%", borderRadius: 3, opacity: isOutOfStock ? 0.6 : 1, bgcolor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", "&:hover": { transform: !isOutOfStock && "translateY(-4px)", boxShadow: "0 8px 16px rgba(26, 71, 42, 0.1)" } }}>
                    <CardActionArea onClick={() => handleAddToCart(product)} sx={{ height: "100%", p: 2.5, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <Box width="100%" mb={2}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3, fontSize: "1.1rem", color: "#333" }}>{product.product_name}</Typography>
                        <Typography variant="caption" sx={{ color: "#1a472a", fontWeight: "bold", bgcolor: "#e8f5e9", px: 1, py: 0.5, borderRadius: 1 }}>{getCategoryNameById(product.Categories_category_id)}</Typography>
                      </Box>
                      <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-end">
                        <Box>
                          <Typography variant="body2" color="text.secondary" fontSize={12}>ราคา</Typography>
                          <Typography variant="h6" color="#1a472a" fontWeight="800">฿{Number(product.selling_price).toLocaleString()}</Typography>
                        </Box>
                        <Chip sx={{ mb: 0.5, ml: 1 }} label={isOutOfStock ? "หมด" : `คลัง: ${stock}`} size="small" color={isOutOfStock ? "error" : "default"} variant="outlined" icon={!isOutOfStock ? (<Inventory2OutlinedIcon sx={{ fontSize: "14px !important" }} />) : undefined} />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>

      {/* RIGHT: CART */}
      <Paper elevation={0} sx={{ width: 380, flexShrink: 0, borderRadius: 4, display: "flex", flexDirection: "column", bgcolor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <Box sx={{ p: 2.5, bgcolor: "#fff", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Badge badgeContent={cart.length} color="error" sx={{ "& .MuiBadge-badge": { fontWeight: "bold" } }}>
              <ShoppingCartOutlinedIcon sx={{ color: "#1a472a", fontSize: 28 }} />
            </Badge>
            <Typography variant="h6" fontWeight="800" color="#1a472a">ตะกร้าสินค้า</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">Version 1.2.0</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}>
          {cart.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" opacity={0.5}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 60, mb: 2, color: "#ccc" }} />
              <Typography fontWeight="bold" color="text.secondary">ยังไม่มีสินค้าในตะกร้า</Typography>
            </Box>
          ) : (
            cart.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ mb: 1.5, p: 2, borderRadius: 3, border: "1px solid #eee" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box sx={{ maxWidth: "85%" }}>
                        <Typography variant="body1" fontWeight="700" sx={{ lineHeight: 1.2, color: "#2d3436" }}>{item.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>฿{Number(item.selling_price).toLocaleString()}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleDeleteItem(item.id)} sx={{ color: "#e0e0e0", p: 0.5, "&:hover": { color: "#ff4d4d", bgcolor: "#ffeaea" } }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Box display="flex" alignItems="center" bgcolor="#f1f3f5" borderRadius="50px" px={0.5} py={0.5}>
                        <IconButton size="small" onClick={() => handleUpdateQty(item.id, -1)} sx={{ width: 28, height: 28, bgcolor: "white" }}><RemoveIcon sx={{ fontSize: 16, color: "#1a472a" }} /></IconButton>
                        <Typography variant="body2" fontWeight="bold" sx={{ mx: 1.5, minWidth: 20, textAlign: "center" }}>{item.qty}</Typography>
                        <IconButton size="small" onClick={() => handleUpdateQty(item.id, 1)} sx={{ width: 28, height: 28, bgcolor: "#1a472a", color: "white" }}><AddIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="800" color="#1a472a">฿{(Number(item.selling_price) * item.qty).toLocaleString()}</Typography>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        <Box sx={{ p: 3, bgcolor: "#fff", borderTop: "1px dashed #e0e0e0", boxShadow: "0 -4px 20px rgba(0,0,0,0.02)" }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary" variant="body2">ยอดรวมสินค้า</Typography>
                <Typography fontWeight="bold" variant="body2">฿{subtotal.toLocaleString()}</Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <LocalOfferIcon sx={{ fontSize: 16, color: '#ed6c02' }} />
                    <Typography color="text.secondary" variant="body2">ส่วนลด</Typography>
                </Box>
                <TextField 
                    size="small"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    type="number"
                    InputProps={{
                        startAdornment: <Typography variant="caption" sx={{mr:0.5}}>฿</Typography>,
                        sx: { height: 30, width: 100, fontSize: '0.9rem', textAlign: 'right', '& input': { textAlign: 'right', p: 0.5 } }
                    }}
                />
            </Box>

            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold" color="#333">ยอดสุทธิ</Typography>
                <Typography variant="h4" fontWeight="800" color="#1a472a">฿{total.toLocaleString()}</Typography>
            </Box>
            <Button variant="contained" size="large" fullWidth startIcon={<PaymentIcon />} disabled={cart.length === 0} onClick={handleOpenPayment} sx={{ bgcolor: "#1a472a", borderRadius: 3, height: 55, fontSize: 18, fontWeight: "bold", "&:hover": { bgcolor: "#143620" } }}>ชำระเงิน</Button>
        </Box>
      </Paper>

      {/* --- PAYMENT DIALOG --- */}
      <Dialog 
        open={openPayment} 
        onClose={() => !isProcessing && setOpenPayment(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#1a472a', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon />
            ชำระเงิน
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3} mt={2}>
                <Typography variant="body1" color="textSecondary">ยอดที่ต้องชำระ</Typography>
                <Typography variant="h3" fontWeight="800" color="#1a472a">฿{total.toLocaleString()}</Typography>
                {discountVal > 0 && (
                    <Chip label={`ส่วนลด ${discountVal.toLocaleString()} บาท`} size="small" color="warning" sx={{ mt: 1 }} />
                )}
            </Box>

            <Box display="flex" justifyContent="center" mb={4}>
                <ToggleButtonGroup
                    value={paymentMethod}
                    exclusive
                    onChange={handlePaymentMethodChange}
                    aria-label="payment method"
                    fullWidth
                    sx={{ width: '100%' }}
                >
                    <ToggleButton value="cash" sx={{ py: 1.5, gap: 1 }}>
                        <MonetizationOnIcon /> เงินสด
                    </ToggleButton>
                    <ToggleButton value="transfer" sx={{ py: 1.5, gap: 1 }}>
                        <QrCodeScannerIcon /> เงินโอน / สแกน
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            {paymentMethod === 'cash' ? (
                <>
                    <TextField 
                        label="รับเงินมา (บาท)" 
                        fullWidth 
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => handleCalculateChange(e.target.value)}
                        autoFocus
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><MonetizationOnIcon color="success"/></InputAdornment>,
                            sx: { fontSize: '1.5rem', fontWeight: 'bold' }
                        }}
                    />
                    <Box mt={3} p={2} bgcolor="#f8f9fa" borderRadius={2} border="1px dashed #ccc">
                        <Grid container justifyContent="space-between">
                            <Grid item><Typography>ทอนเงิน:</Typography></Grid>
                            <Grid item>
                                <Typography variant="h5" fontWeight="bold" color={changeAmount < 0 ? "error" : "primary"}>
                                    ฿{changeAmount.toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </>
            ) : (
                <Box display="flex" flexDirection="column" alignItems="center" p={2} border="1px solid #eee" borderRadius={2}>
                    <QrCodeScannerIcon sx={{ fontSize: 80, color: '#1a472a', mb: 2, opacity: 0.8 }} />
                    <Typography variant="h6" fontWeight="bold">รอการโอนเงิน...</Typography>
                    <Typography color="textSecondary" variant="body2" mb={2}>
                         กรุณาตรวจสอบยอดเงินเข้าบัญชีก่อนกดยืนยัน
                    </Typography>
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <Box width="100%" display="flex" justifyContent="space-between" mt={1}>
                         <Typography>ยอดโอนที่ถูกต้อง:</Typography>
                         <Typography fontWeight="bold" color="#1a472a">฿{total.toLocaleString()}</Typography>
                    </Box>
                </Box>
            )}

        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenPayment(false)} disabled={isProcessing} size="large" sx={{ color: '#666' }}>ยกเลิก</Button>
            <Button 
                onClick={handleProcessPayment} 
                variant="contained" 
                size="large" 
                disabled={isProcessing || (parseFloat(receivedAmount) < total)}
                sx={{ bgcolor: '#1a472a', px: 4, py: 1.5, fontSize: '1.1rem', "&:hover": { bgcolor: '#143620' } }}
            >
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : `ยืนยัน (${paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'})`}
            </Button>
        </DialogActions>
      </Dialog>

      {/* --- ✅ RECEIPT DIALOG (ส่วนบิลใบเสร็จ) --- */}
      <Dialog
        open={openReceipt}
        onClose={handleCloseReceipt}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, width: 350 } }} // ขนาดประมาณบิลความร้อน 80mm
      >
        <DialogContent sx={{ p: 0 }}>
            {/* พื้นที่ที่จะสั่งพิมพ์ */}
            <Box ref={receiptRef} sx={{ p: 3, bgcolor: 'white', color: 'black', fontFamily: 'monospace' }}>
                <Box textAlign="center" mb={2}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">ชำระเงินสำเร็จ</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {lastOrder?.display_date?.toLocaleString('th-TH') || '-'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                {/* Receipt Header Info */}
                <Box textAlign="center" mb={2}>
                    <Typography fontWeight="bold" variant="subtitle1">Three Shop</Typography>
                    <Typography variant="caption" display="block">เลขที่ใบเสร็จ: {lastOrder?.order_number}</Typography>
                    <Typography variant="caption" display="block">พนักงาน: {lastOrder?.cashier_name}</Typography>
                </Box>

                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                {/* Items List */}
                <Box>
                    {lastOrder?.items?.map((item, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" mb={0.5}>
                            <Box sx={{ width: '60%' }}>
                                <Typography variant="caption" fontWeight="bold">{item.product_name}</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    {item.quantity} x {item.selling_price}
                                </Typography>
                            </Box>
                            <Typography variant="caption" fontWeight="bold">
                                {item.total_line.toLocaleString()}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                {/* Totals */}
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">รวมเป็นเงิน</Typography>
                    <Typography variant="caption">{lastOrder?.subtotal?.toLocaleString()}</Typography>
                </Box>
                {lastOrder?.discount > 0 && (
                    <Box display="flex" justifyContent="space-between" color="error.main">
                        <Typography variant="caption">ส่วนลด</Typography>
                        <Typography variant="caption">-{lastOrder?.discount?.toLocaleString()}</Typography>
                    </Box>
                )}
                <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="subtitle2" fontWeight="bold">ยอดสุทธิ</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">{lastOrder?.grand_total?.toLocaleString()}</Typography>
                </Box>

                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                {/* Payment Info */}
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">ชำระโดย ({lastOrder?.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'})</Typography>
                    <Typography variant="caption">{lastOrder?.received_amount?.toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">เงินทอน</Typography>
                    <Typography variant="caption">{lastOrder?.change_amount?.toLocaleString()}</Typography>
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

      <Snackbar open={notification.open} autoHideDuration={2000} onClose={handleCloseNotification} anchorOrigin={{ vertical: "top", horizontal: "right" }} sx={{ mt: 7 }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: "100%", boxShadow: 3, fontWeight: "bold" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POS;