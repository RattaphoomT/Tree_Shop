import React from 'react';
import Layout from '../Layout/Layout';
import { Box } from '@mui/material';
import InventoryBatches from '../components/InventoryBatches';

const Pages_InventoryBatches = () => {
  return (
    <Layout>
      <Box sx={{ width: "100%" }}>
        <InventoryBatches />
      </Box>
    </Layout>
  );
};

export default Pages_InventoryBatches;