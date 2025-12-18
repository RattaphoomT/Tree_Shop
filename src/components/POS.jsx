import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  TextField,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

// ตัวอย่างข้อมูลสินค้า (mock data)
const sampleProducts = [
  {
    id: 1,
    name: "ต้นเฟิร์น",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "ต้นกระบองเพชร",
    price: 80,
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    name: "ต้นลิ้นมังกร",
    price: 200,
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 5,
    name: "ต้นฟิโลเดนดรอน",
    price: 250,
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
];

const POS = () => {
  const [cart, setCart] = useState([]);

  // TODO: เชื่อมต่อฐานข้อมูลเพื่อดึงข้อมูลสินค้า
  // useEffect(() => {
  //   fetch("/api/products")
  //     .then(res => res.json())
  //     .then(data => setProducts(data));
  // }, []);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleDeleteFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleQuantityChange = (productId, value) => {
    const qty = Math.max(1, parseInt(value) || 1);
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // TODO: เชื่อมต่อฐานข้อมูลเพื่อบันทึกการขาย
  // const handleCheckout = () => {
  //   fetch("/api/sales", {
  //     method: "POST",
  //     body: JSON.stringify(cart),
  //   });
  // };

  return (
    <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
      {/* สินค้า */}
      <Box sx={{ flex: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          สินค้าทั้งหมด
        </Typography>
        <Grid container spacing={2}>
          {sampleProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardMedia
                  component="img"
                  height="120"
                  image={product.image}
                  alt={product.name}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600 }}
                    noWrap
                  >
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.price.toLocaleString()} บาท
                  </Typography>
                </CardContent>
                <Button
                  variant="contained"
                  color="success"
                  sx={{ m: 2, mt: "auto" }}
                  onClick={() => handleAddToCart(product)}
                >
                  เพิ่มลงตะกร้า
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ตะกร้าสินค้า */}
      <Box sx={{ flex: 1, minWidth: 320 }}>
        <Paper sx={{ p: 2, position: "sticky", top: 24 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
            display="flex"
            alignItems="center"
          >
            <ShoppingCartIcon sx={{ mr: 1, color: "#4caf50" }} />
            ตะกร้าสินค้า
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {cart.length === 0 ? (
              <Typography color="text.secondary" align="center">
                ไม่มีสินค้าในตะกร้า
              </Typography>
            ) : (
              cart.map((item) => (
                <ListItem key={item.id} alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mt: 1,
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, e.target.value)
                          }
                          inputProps={{
                            min: 1,
                            style: { width: 40, textAlign: "center" },
                          }}
                          sx={{ mx: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleAddToCart(item)}
                        >
                          <AddIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2 }}>
                          {item.price * item.quantity} บาท
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleDeleteFromCart(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography>รวมทั้งหมด</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {total.toLocaleString()} บาท
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            fullWidth
            disabled={cart.length === 0}
            sx={{ mt: 1, fontWeight: 700 }}
            // onClick={handleCheckout} // TODO: เชื่อมต่อฐานข้อมูลเพื่อบันทึกการขาย
          >
            ชำระเงิน
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default POS;
