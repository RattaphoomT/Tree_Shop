import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import AssignmentIcon from "@mui/icons-material/Assignment";

function Sidebarmenu() {
  const menu = [
    { name: "Dashboard", icon: <DashboardIcon /> },
    { name: "Tables", icon: <TableChartIcon />, active: true },
    { name: "Billing", icon: <ReceiptIcon /> },
    { name: "Notifications", icon: <NotificationsIcon /> },
    { name: "Profile", icon: <PersonIcon /> },
    { name: "Sign In", icon: <LoginIcon /> },
    { name: "Sign Up", icon: <AssignmentIcon /> },
  ];

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        background: "#ffffff",
        borderRadius: "0px 15px 15px 0px",
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "fixed", // <- สำคัญ!
        top: 0,
        left: 0,
      }}
    >
      {/* LOGO */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
          ระบบจัดการร้านต้นไม้
        </Typography>

        {/* MENU */}
        <List>
          {menu.map((item, index) => (
            <ListItemButton
              key={index}
              sx={{
                borderRadius: "12px",
                mb: 1,
                background: item.active
                  ? "linear-gradient(90deg, #66bb6a, #4caf50)"
                  : "transparent",
                color: item.active ? "#fff" : "#455a64",
                "&:hover": {
                  background: item.active
                    ? "linear-gradient(90deg, #66bb6a, #4caf50)"
                    : "#eceff1",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.active ? "#fff" : "#455a64",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* UPGRADE BUTTON */}
      <Box
        sx={{
          background: "linear-gradient(90deg, #66bb6a, #4caf50)",
          borderRadius: "12px",
          textAlign: "center",
          p: 1.5,
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        เรียนรู้เพิ่มเติม
      </Box>
    </Box>
  );
}

export default Sidebarmenu;
