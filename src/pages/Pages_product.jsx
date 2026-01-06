import React from "react";
import Layout from '../Layout/Layout'
import { Box } from '@mui/material'
import Product from "../components/Product";


const Pages_product = () => {
  return (
    <Layout>
      <Box sx={{  overflow: "hidden" }}>
          {/* contain */}
            <Product/>
      </Box>
    </Layout>
  );
};

export default Pages_product;
