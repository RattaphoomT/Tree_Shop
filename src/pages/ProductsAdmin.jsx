import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../services/api";

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (e) {
        setProducts([]);
      }
    })();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("ลบสินค้านี้?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>จัดการสินค้า</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ชื่อ</TableCell>
              <TableCell>ราคา</TableCell>
              <TableCell>การกระทำ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.price} ฿</TableCell>
                <TableCell>
                  <IconButton onClick={() => onDelete(p.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ProductsAdmin;