import React from "react";
import FromInputdata from "./component/FromInputdata";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dasborad from "./component/Dasborad";

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<FromInputdata />} />
          <Route path="/Dasborad" element={<Dasborad />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
