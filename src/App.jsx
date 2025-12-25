import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dasborad";
import Pages_pos from "./pages/Pages_pos";
import Pages_product from "./pages/Pages_product";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pages_pos />} />
        <Route path="/product" element={<Pages_product />} />
        <Route path="/pos" element={<Pages_pos />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
