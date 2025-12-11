import React from "react";
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemText, Button, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCart } from "../context/CartContext";

const CartDrawer = ({ open, onClose, onCheckout }) => {
  const { items, updateQty, remove, total, clear } = useCart();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">ตะกร้าสินค้า</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <List>
          {items.length === 0 && <Typography color="text.secondary">ยังไม่มีสินค้า</Typography>}
          {items.map((it) => (
            <ListItem key={it.id} sx={{ alignItems: "center" }}>
              <ListItemText primary={it.name} secondary={`${(it.price || 0)} ฿`} />
              <TextField size="small" type="number" value={it.qty} onChange={(e) => updateQty(it.id, Math.max(1, parseInt(e.target.value || "1")))} sx={{ width: 80, mr: 1 }} />
              <Button color="error" onClick={() => remove(it.id)}>ลบ</Button>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">รวม: {total} ฿</Typography>
          <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={onCheckout}>ชำระเงิน</Button>
          <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={clear}>ล้างตะกร้า</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CartDrawer;