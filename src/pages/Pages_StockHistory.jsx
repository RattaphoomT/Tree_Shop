import React from 'react';
import Layout from '../Layout/Layout';
import { Box } from '@mui/material';
import StockHistory from '../components/StockHistory';

const Pages_StockHistory = () => {
  return (
    <Layout>
      <Box sx={{ width: "100%" }}>
        <StockHistory />
      </Box>
    </Layout>
  );
};

export default Pages_StockHistory;