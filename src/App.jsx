import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pages_pos from "./pages/Pages_pos";
import Pages_product from "./pages/Pages_product";
import { Pages } from "@mui/icons-material";
import Pages_dasborad from "./pages/pages_dasborad";
import Pages_history from "./pages/Pages_history";
import Pages_login from "./pages/Pages_login";

const App = () => {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Pages_login />} />
        <Route path="/product" element={<Pages_product />} />
        <Route path="/pos" element={<Pages_pos />} />
        <Route path="/dashboard" element={<Pages_dasborad />} />
        <Route path="/history" element={<Pages_history />} />
      </Routes>
    </Router>
  );
};

export default App;
