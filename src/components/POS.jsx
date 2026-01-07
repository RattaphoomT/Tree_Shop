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
  CircularProgress,
  Snackbar,
  Alert,
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
  const [categories, setCategories] = useState([
    { id: "all", name: "ทั้งหมด" },
  ]);

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

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

  const handleAddToCart = (product) => {
    const stock = parseInt(product.stock_quantity) || 0;

    // 1. เช็คของหมดตั้งแต่ต้น (แจ้งเตือน 🔴)
    if (stock <= 0) {
      showNotification(`สินค้า "${product.product_name}" หมดสต็อก!`, "error");
      return;
    }

    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        // 2. เช็คกรณีของในตะกร้า + ที่จะเพิ่ม เกินสต็อก (แจ้งเตือน 🟠)
        if (exist.qty >= stock) {
          showNotification(
            `เพิ่มไม่ได้! สินค้าเหลือเพียง ${stock} ชิ้น`,
            "warning"
          );
          return prev;
        }
        // เพิ่มสำเร็จ (ไม่แจ้งเตือน)
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // เพิ่มสินค้าใหม่สำเร็จ (ไม่แจ้งเตือน)
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

            // 3. กดปุ่มบวกในตะกร้า แล้วเกินสต็อก (แจ้งเตือน 🟠)
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
    // 4. ลบสินค้าออกจากตะกร้า (แจ้งเตือน 🔵)
    setCart((prev) => prev.filter((item) => item.id !== id));
    showNotification("ลบสินค้าออกจากตะกร้าแล้ว", "info");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.selling_price) * item.qty,
    0
  );
  const total = subtotal;

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

  // ================= RENDER =================
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress sx={{ color: "#1a472a" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        gap: 3,
        overflow: "hidden",
      }}
    >
      {/* LEFT: CATALOG */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="800" color="#1a472a">
              หน้าขายสินค้า
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} รายการ
            </Typography>
          </Box>
          <TextField
            placeholder="ค้นหาชื่อสินค้า..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#1a472a" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              bgcolor: "white",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          />
        </Box>

        {/* Categories */}
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
                  borderColor:
                    selectedCategoryId === cat.id ? "#1a472a" : "#e0e0e0",
                  "&:hover": {
                    bgcolor:
                      selectedCategoryId === cat.id ? "#143620" : "#f5f5f5",
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Product Grid */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: 1, pb: 2 }}>
          <Grid container spacing={2}>
            {filteredProducts.map((product) => {
              const stock = parseInt(product.stock_quantity) || 0;
              const isOutOfStock = stock <= 0;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      opacity: isOutOfStock ? 0.6 : 1,
                      bgcolor: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      "&:hover": {
                        transform: !isOutOfStock && "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(26, 71, 42, 0.1)",
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleAddToCart(product)}
                      sx={{
                        height: "100%",
                        p: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box width="100%" mb={2}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            mb: 1,
                            lineHeight: 1.3,
                            fontSize: "1.1rem",
                            color: "#333",
                          }}
                        >
                          {product.product_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#1a472a",
                            fontWeight: "bold",
                            bgcolor: "#e8f5e9",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          {getCategoryNameById(product.Categories_category_id)}
                        </Typography>
                      </Box>
                      <Box
                        width="100%"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-end"
                      >
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontSize={12}
                          >
                            ราคา
                          </Typography>
                          <Typography
                            variant="h6"
                            color="#1a472a"
                            fontWeight="800"
                          >
                            ฿{Number(product.selling_price).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip
                          sx={{ mb: 0.5, ml: 1 }}
                          label={isOutOfStock ? "หมด" : `คลัง: ${stock}`}
                          size="small"
                          color={isOutOfStock ? "error" : "default"}
                          variant="outlined"
                          icon={
                            !isOutOfStock ? (
                              <Inventory2OutlinedIcon
                                sx={{ fontSize: "14px !important" }}
                              />
                            ) : undefined
                          }
                        />
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
      <Paper
        elevation={0}
        sx={{
          width: 380,
          flexShrink: 0,
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          bgcolor: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #f0f0f0",
          overflow: "hidden",
        }}
      >
        {/* Cart Header */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Badge
              badgeContent={cart.length}
              color="error"
              sx={{ "& .MuiBadge-badge": { fontWeight: "bold" } }}
            >
              <ShoppingCartOutlinedIcon
                sx={{ color: "#1a472a", fontSize: 28 }}
              />
            </Badge>
            <Typography variant="h6" fontWeight="800" color="#1a472a">
              ตะกร้าสินค้า
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Version 1.0.0
          </Typography>
        </Box>

        {/* Cart Items */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}>
          {cart.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              opacity={0.5}
            >
              <ShoppingCartOutlinedIcon
                sx={{ fontSize: 60, mb: 2, color: "#ccc" }}
              />
              <Typography fontWeight="bold" color="text.secondary">
                ยังไม่มีสินค้าในตะกร้า
              </Typography>
              <Typography variant="caption" color="text.disabled">
                เลือกสินค้าจากฝั่งซ้ายเพื่อเริ่มขาย
              </Typography>
            </Box>
          ) : (
            cart.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  mb: 1.5,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #eee",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    borderColor: "transparent",
                  },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Box sx={{ maxWidth: "85%" }}>
                    <Typography
                      variant="body1"
                      fontWeight="700"
                      sx={{ lineHeight: 1.2, color: "#2d3436" }}
                    >
                      {item.product_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      ราคาต่อหน่วย: ฿
                      {Number(item.selling_price).toLocaleString()}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteItem(item.id)}
                    sx={{
                      color: "#e0e0e0",
                      p: 0.5,
                      "&:hover": { color: "#ff4d4d", bgcolor: "#ffeaea" },
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    bgcolor="#f1f3f5"
                    borderRadius="50px"
                    px={0.5}
                    py={0.5}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQty(item.id, -1)}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        "&:hover": { bgcolor: "#fff" },
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 16, color: "#1a472a" }} />
                    </IconButton>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        mx: 1.5,
                        minWidth: 20,
                        textAlign: "center",
                        color: "#333",
                      }}
                    >
                      {item.qty}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQty(item.id, 1)}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#1a472a",
                        color: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#143620" },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                    color="#1a472a"
                  >
                    ฿{(Number(item.selling_price) * item.qty).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            bgcolor: "#fff",
            borderTop: "1px dashed #e0e0e0",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary" variant="body2">
              จำนวนสินค้า
            </Typography>
            <Typography fontWeight="bold" variant="body2">
              {cart.reduce((a, b) => a + b.qty, 0)} ชิ้น
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography color="text.secondary" variant="body2">
              ยอดรวมสินค้า
            </Typography>
            <Typography fontWeight="bold" variant="body2">
              ฿{total.toLocaleString()}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight="bold" color="#333">
              ยอดสุทธิ
            </Typography>
            <Typography variant="h4" fontWeight="800" color="#1a472a">
              ฿{total.toLocaleString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PaymentIcon />}
            disabled={cart.length === 0}
            sx={{
              bgcolor: "#1a472a",
              borderRadius: 3,
              height: 55,
              fontSize: 18,
              fontWeight: "bold",
              boxShadow: "0 8px 24px rgba(26, 71, 42, 0.25)",
              "&:hover": {
                bgcolor: "#143620",
                boxShadow: "0 8px 24px rgba(26, 71, 42, 0.4)",
              },
            }}
          >
            ชำระเงิน
          </Button>
        </Box>
      </Paper>

      {/* Snackbar Alert */}
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 7 }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3, fontWeight: "bold" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POS;
