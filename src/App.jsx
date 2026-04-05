import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pages_pos from "./pages/Pages_pos.jsx";
import Pages_product from "./pages/Pages_product.jsx";
import Pages_history from "./pages/Pages_history.jsx";
import Pages_login from "./pages/Pages_login.jsx";
import Pages_customer from "./pages/Pages_customer.jsx";
import Pages_dashboard from "./pages/Pages_dashboard.jsx";
import Pages_users from "./pages/Pages_users.jsx"; // NEW: นำเข้าหน้าจัดการผู้ใช้
import Pages_StockHistory from "./pages/Pages_StockHistory.jsx";

// --- 1. นำเข้า ProtectedRoute ---
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- 2. หน้า Login จะเป็นหน้าสาธารณะ เข้าได้เลย --- */}
        <Route path="/" element={<Pages_login />} />
        {/* --- 3. กำหนดให้เส้นทางทั้งหมดข้างในนี้ต้องผ่าน "ยาม" ก่อน --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Pages_dashboard />} />
          <Route path="/product" element={<Pages_product />} />
          <Route path="/pos" element={<Pages_pos />} />
          <Route path="/history" element={<Pages_history />} />
          <Route path="/customers" element={<Pages_customer />} />
          <Route path="/stock-history" element={<Pages_StockHistory />} />
          <Route path="/users" element={<Pages_users />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
