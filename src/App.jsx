import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pages_pos from "./pages/Pages_pos";
import Pages_product from "./pages/Pages_product";
import { Pages } from "@mui/icons-material";
import Pages_dasborad from "./pages/pages_dasborad";

const App = () => {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Pages_pos />} />
        <Route path="/product" element={<Pages_product />} />
        <Route path="/pos" element={<Pages_pos />} />
        <Route path="/dashboard" element={<Pages_dasborad/>} />
      </Routes>
    </Router>
  );
};

export default App;
