import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { CartProvider, useCart } from "../context/CartContext";
import api from "../services/api";

const POSInner = () => {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/products"); // คาด backend: GET /products
        if (mounted) setProducts(res.data);
      } catch (e) {
        // fallback mock
        if (mounted) setProducts([
          { id: 1, name: "Monstera Deliciosa", price: 350 },
          { id: 2, name: "Ficus Lyrata", price: 480 },
          { id: 3, name: "Sansevieria", price: 120 },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onAdd = (p) => { add(p, 1); setCartOpen(true); };

  const onCheckout = async () => {
    // ดึงข้อมูลตะกร้าจาก context แล้วเรียก API สร้าง order
    // ตัวอย่าง (ต้องปรับให้เชื่อม backend จริง)
    try {
      // const { items, total } = ... // เอาจาก useCart (สามารถสื่อสารผ่าน context callback)
      // await api.post("/orders", { items });
      alert("เรียก API ชำระเงิน (implement backend)"); 
    } catch (err) {
      console.error(err);
      alert("ชำระเงินล้มเหลว");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField fullWidth placeholder="ค้นหาสินค้า..." value={q} onChange={(e) => setQ(e.target.value)} InputProps={{ endAdornment: (<IconButton><SearchIcon /></IconButton>) }} />
        <IconButton color="primary" onClick={() => setCartOpen(true)}>ตะกร้า</IconButton>
      </Box>

      <Grid container spacing={2}>
        {products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).map(p => (
          <Grid item xs={6} sm={4} md={3} key={p.id}>
            <ProductCard product={p} onAdd={onAdd} />
          </Grid>
        ))}
      </Grid>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={onCheckout} />
    </Box>
  );
};

const POS = () => (
  <CartProvider>
    <POSInner />
  </CartProvider>
);

export default POS;