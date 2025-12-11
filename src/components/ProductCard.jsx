import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";

const ProductCard = ({ product, onAdd }) => {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 6px 18px rgba(16,24,40,0.06)" }}>
      <CardContent>
        <Box sx={{ height: 120, bgcolor: "rgba(0,0,0,0.04)", borderRadius: 1, mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* แทนที่ด้วยรูปสินค้าถ้ามี: <img src={product.image} ... /> */}
          <Typography color="text.secondary">รูป</Typography>
        </Box>
        <Typography variant="subtitle1" noWrap>{product.name}</Typography>
        <Typography variant="body2" color="text.secondary">{product.price} ฿</Typography>
        <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={() => onAdd(product)}>เพิ่ม</Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;