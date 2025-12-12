import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dasborad";
import Product from "./pages/Product";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Product />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
