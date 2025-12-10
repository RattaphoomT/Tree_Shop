import { Button } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

import Sidebarmenu from "./Sidebarmenu";

const Dasborad = () => {
  return (
    <>
      <div style={{ display: "flex" }}>
        <Sidebarmenu />
        {/* content */}
        <div style={{ flex: 1, padding: 20 }}>
          <Link to="/">
            <Button variant="contained">กลับไปหน้าเพิ่มต้นไม้</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dasborad;
