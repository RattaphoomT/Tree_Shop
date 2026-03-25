import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton
} from "@mui/material";
// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist"; // ไอคอนเดิมของคุณ
import CloseIcon from "@mui/icons-material/Close"; // เพิ่มปุ่มปิดสำหรับมือถือ
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts"; // NEW: ไอคอนจัดการผู้ใช้
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 260;
const collapsedWidth = 80;

export default function Sidebar({ open, onClose, isMobile, user }) {
  const location = useLocation();
  const [hoverExpand, setHoverExpand] = React.useState(false);

  const allItems = [
    { to: "/dashboard", label: "ภาพรวม", icon: <DashboardIcon /> },
    { to: "/pos", label: "POS", icon: <PointOfSaleIcon /> },
    { to: "/product", label: "สินค้า", icon: <Inventory2Icon /> },
    { to: "/history", label: "ประวัติการขาย", icon: <ShoppingCartIcon /> },
    { to: "/customers", label: "จัดการลูกค้า", icon: <PeopleIcon /> },
    { to: "/users", label: "จัดการผู้ใช้", icon: <ManageAccountsIcon /> },
  ];

  // Filter items based on user role
  const items = React.useMemo(() => {
    if (user?.role === 'Staff') {
      return allItems.filter(item => item.to === '/pos' || item.to === '/dashboard');
    }
    return allItems; // For Owner and Manager, show all items
  }, [user]);

  // Logic การขยาย:
  const isExpanded = isMobile ? true : (open || hoverExpand);

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      anchor={isMobile ? "top" : "left"}
      open={open}
      onClose={onClose}
      onMouseEnter={() => !isMobile && setHoverExpand(true)}
      onMouseLeave={() => !isMobile && setHoverExpand(false)}
      sx={{
        width: isMobile ? "100%" : (isExpanded ? drawerWidth : collapsedWidth),
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: isMobile ? "100%" : (isExpanded ? drawerWidth : collapsedWidth),
          // ปรับระยะห่างจากด้านบน:
          // - มือถือ: เว้น 56px (ความสูง AppBar มือถือ)
          // - Desktop: เว้น 64px (ความสูง AppBar ปกติ)
          marginTop: isMobile ? "56px" : "64px", 
          height: isMobile ? "auto" : "calc(100% - 64px)",
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: "width 0.5s ease",
          background: "linear-gradient(180deg, #1a472a 0%, #0d2b18 100%)",
          color: "white",
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: isMobile ? "0 4px 12px rgba(0,0,0,0.5)" : "none",
        },
      }}
    >
      {/* --- ส่วนหัว Sidebar (ที่หายไป) --- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          p: 2,
          minHeight: 64, // ความสูงขั้นต่ำ
        }}
      >
        <Box display="flex" alignItems="center" overflow="hidden">
           <Avatar 
             sx={{ 
               bgcolor: "white", 
               color: "#1a472a", 
               width: 40, 
               height: 40,
               minWidth: 40, // ป้องกันการบีบตัว
               boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
             }}
           >
             <LocalFloristIcon />
           </Avatar>
           
           {/* ชื่อระบบ แสดงเฉพาะตอนขยาย */}
           <Box 
             sx={{ 
               ml: 2, 
               opacity: isExpanded ? 1 : 0, 
               display: isExpanded ? "block" : "none",
               transition: "opacity 0.3s",
               whiteSpace: "nowrap"
             }}
           >
             <Typography variant="subtitle1" fontWeight="bold">
               GreenShop
             </Typography>
             <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
               ระบบจัดการร้านต้นไม้
             </Typography>
           </Box>
        </Box>

        {/* ปุ่มปิดเฉพาะบนมือถือ (Optional) */}
        {isMobile && (
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* --- รายการเมนู --- */}
      <List sx={{ pt: 1 }}>
        {items.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItem key={item.label} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={Link}
                to={item.to}
                onClick={() => isMobile && onClose()} 
                sx={{
                  minHeight: 48,
                  justifyContent: isExpanded ? "initial" : "center",
                  px: 2.5,
                  mx: isExpanded ? 1 : 0.5,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: selected ? "#4caf50" : "transparent",
                  color: selected ? "white" : "rgba(255,255,255,0.7)",
                  "&:hover": {
                    backgroundColor: selected ? "#4caf50" : "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isExpanded ? 2 : "auto",
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    opacity: isExpanded ? 1 : 0,
                    display: isExpanded ? "block" : "none",
                  }}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}