import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import ProductsAdmin from "./pages/ProductsAdmin";
import Customers from "./pages/Customers";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products-admin" element={<ProductsAdmin />} />
        <Route path="customers" element={<Customers />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;