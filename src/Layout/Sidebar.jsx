import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Divider,
  Collapse,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 260;
const collapsedWidth = 80;

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const [hoverExpand, setHoverExpand] = React.useState(false);

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { to: "/pos", label: "POS", icon: <PointOfSaleIcon /> },
    { to: "/product", label: "สินค้า", icon: <Inventory2Icon /> },
    { to: "/orders", label: "คำสั่งซื้อ", icon: <ShoppingCartIcon /> },
    { to: "/customers", label: "ลูกค้า", icon: <PeopleIcon /> },
  ];

  const isExpanded = open || hoverExpand;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      onMouseEnter={() => !open && setHoverExpand(true)}
      onMouseLeave={() => setHoverExpand(false)}
      sx={{
        width: isExpanded ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        transition: "width 0.3s ease",
        [`& .MuiDrawer-paper`]: {
          width: isExpanded ? drawerWidth : collapsedWidth,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderRightColor: "divider",
          backgroundColor: "#1a472a",
          color: "white",
          transition: "width 0.3s ease",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar />
      
      <Collapse in={isExpanded} timeout="auto">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 2,
            background: "linear-gradient(135deg, #2d5a3d 0%, #1a472a 100%)",
          }}
        >
          <Avatar sx={{ bgcolor: "#4caf50", width: 48, height: 48 }}>
            <LocalFloristIcon />
          </Avatar>
          <Box>
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ fontWeight: 700, color: "#4caf50" }}
            >
              Tree Shop
            </Typography>
            <Typography 
              variant="caption" 
              noWrap 
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              ระบบจัดการร้านต้นไม้
            </Typography>
          </Box>
        </Box>
      </Collapse>

      <Box sx={{ py: 1 }}>
        <Collapse in={isExpanded} timeout="auto">
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
        </Collapse>
      </Box>

      <List sx={{ px: isExpanded ? 1 : 0 }}>
        {items.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={selected}
                title={item.label}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: isExpanded ? "0 20px 20px 0" : "0 16px 16px 0",
                  margin: isExpanded ? "0 8px" : "0 4px",
                  justifyContent: isExpanded ? "flex-start" : "center",
                  backgroundColor: selected ? "#4caf50" : "transparent",
                  color: selected ? "white" : "rgba(255,255,255,0.7)",
                  transition: "all 0.5s ease",
                  "&.Mui-selected": {
                    bgcolor: "#4caf50",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" },
                  },
                  "&:hover": {
                    bgcolor: selected ? "#4caf50" : "rgba(76, 175, 80, 0.2)",
                    color: "white", 
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: isExpanded ? 40 : 24,
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Collapse in={isExpanded} timeout="auto" orientation="horizontal">
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ 
                      fontWeight: 600,
                      fontSize: "0.95rem"
                    }}
                  />
                </Collapse>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
