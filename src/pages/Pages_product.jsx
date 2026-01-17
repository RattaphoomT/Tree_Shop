import React from "react";
import Layout from '../Layout/Layout'
import { Box } from '@mui/material'
import Product from "../components/Product";

const Pages_product = () => {
  return (
    <Layout>
      {/* แก้ไข: ลบ overflow: "hidden" และเพิ่ม minHeight เพื่อให้ Scroll ได้ปกติบนมือถือ */}
      <Box sx={{ width: "100%", minHeight: "100vh" }}>
          {/* contain */}
            <Product/>
      </Box>
    </Layout>
  );
};

export default Pages_product;