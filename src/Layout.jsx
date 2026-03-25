import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// This is a placeholder for your main application layout.
// It should contain your Sidebar, Navbar, etc.
const Layout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* For example, you would place your <Sidebar /> component here */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet /> {/* This will render the matched route's component (e.g., Dashboard, Product) */}
      </Box>
    </Box>
  );
};

export default Layout;
