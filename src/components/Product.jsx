import React, { useState, useEffect, useRef } from "react";
// --- Config Firebase ---
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy as firestoreOrderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// --- SweetAlert2 Import ---
import Swal from "sweetalert2";

// --- Barcode & Print Libraries ---
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";

// --- AI Library (Google Gemini) ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Material UI Imports ---
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Divider,
  Stack,
  Tooltip,
  Snackbar,
  Alert,
  Checkbox,
  Grid,
  Pagination,
  TableSortLabel,
  Avatar,
  TablePagination,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";

// --- Icons Imports ---
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CategoryIcon from "@mui/icons-material/Category";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PrintIcon from "@mui/icons-material/Print";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClassIcon from '@mui/icons-material/Class';
import TagIcon from '@mui/icons-material/Tag'; 
import CameraAltIcon from '@mui/icons-material/CameraAlt'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import SaveAsIcon from '@mui/icons-material/SaveAs'; 
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { visuallyHidden } from "@mui/utils";

// ================= API CONFIG (แก้ไขแล้ว ✅) =================
// ดึง Key จากไฟล์ .env อย่างปลอดภัย
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ================= SORTING HELPERS =================
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// ================= TABLE HEADERS =================
const headCells = [
  { id: "barcode", numeric: false, disablePadding: false, label: "BARCODE" },
  { id: "product_name", numeric: false, disablePadding: false, label: "ชื่อสินค้า" },
  { id: "Categories_category_id", numeric: false, disablePadding: false, label: "หมวดหมู่" },
  { id: "selling_price", numeric: true, disablePadding: false, label: "ราคาขาย" },
  { id: "stock_quantity", numeric: true, disablePadding: false, label: "คงเหลือ" },
  { id: "status", numeric: true, disablePadding: false, label: "สถานะ" },
  { id: "action", numeric: true, disablePadding: false, label: "Action", disableSort: true },
];

const Product = () => {
  const theme = useTheme();

  // ================= STATE MANAGEMENT =================
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const initialFormState = {
    barcode: "",
    product_name: "",
    cost_price: "",
    selling_price: "",
    location: "",
    stock_quantity: "",
    Categories_category_id: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genPrefix, setGenPrefix] = useState("");

  // --- Filter & Search ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // --- Pagination & Sorting ---
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("product_name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // --- UI States ---
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openCatModal, setOpenCatModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // --- Transaction History ---
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedProductHistory, setSelectedProductHistory] = useState(null);
  const [historyFilterDate, setHistoryFilterDate] = useState(""); 
  const [historyFilterType, setHistoryFilterType] = useState("all");
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);
  const [historyOrder, setHistoryOrder] = useState('desc');
  const [historyOrderBy, setHistoryOrderBy] = useState('transaction_date');

  // --- Barcode & Selection ---
  const [selectedIds, setSelectedIds] = useState([]);
  const [openBarcodeDialog, setOpenBarcodeDialog] = useState(false);
  const [itemsToPrint, setItemsToPrint] = useState([]);
  const componentRef = useRef();

  // --- AI / Bill Scan ---
  const [openScanDialog, setOpenScanDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [scannedImage, setScannedImage] = useState(null);
  const [scannedPrefix, setScannedPrefix] = useState("");

  const refProductTable = collection(db, "Products");
  const refCategoryTable = collection(db, "Categories");
  const refTransactionTable = collection(db, "Stock_Transactions");

  // ================= USE EFFECT =================
  useEffect(() => {
    setLoading(true);
    const unsubProd = onSnapshot(refProductTable, (snapshot) => {
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(newData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
    });

    const unsubCat = onSnapshot(refCategoryTable, (snapshot) => {
      const newCats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(newCats);
    });

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterStatus, filterCategory]);

  // ================= LOGIC: FILTER / SEARCH =================
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const pName = item.product_name ? item.product_name.toLowerCase() : "";
    const pBarcode = item.barcode ? item.barcode.toString() : "";
    const pLoc = item.location ? item.location.toLowerCase() : "";

    const matchesSearch =
      pName.includes(term) || pBarcode.includes(term) || pLoc.includes(term);
    const matchesCategory =
      filterCategory === "all" ||
      item.Categories_category_id === filterCategory;

    let matchesStatus = true;
    const qty = parseInt(item.stock_quantity) || 0;
    if (filterStatus === "out_of_stock") {
      matchesStatus = qty === 0;
    } else if (filterStatus === "low_stock") {
      matchesStatus = qty > 0 && qty < 10;
    } else if (filterStatus === "in_stock") {
      matchesStatus = qty >= 10;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ================= HANDLERS: SORTING & PAGINATION =================
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = stableSort(
    filteredData,
    getComparator(order, orderBy)
  ).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const countPages = Math.ceil(filteredData.length / rowsPerPage);

  // ================= HELPER: RECORD FULL TRANSACTION =================
  const recordTransaction = async (productData, type, qtyChange, prevStock, currentStock, note = "") => {
    try {
      await addDoc(refTransactionTable, {
        product_id: productData.id || "",
        barcode: productData.barcode || "",
        product_name: productData.product_name || "",
        cost_price: parseFloat(productData.cost_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
        location: productData.location || "",
        transaction_type: type,
        quantity_change: qtyChange,
        previous_stock: prevStock,
        current_stock: currentStock,
        note: note,
        transaction_date: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error recording transaction:", err);
    }
  };

  // ================= HANDLERS: CRUD =================
  const handleChang = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGenerateBarcode = () => {
    let randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    setForm({ ...form, barcode: (genPrefix || "") + randomCode });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(initialFormState);
    setGenPrefix(""); 
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm(item);
    setGenPrefix(""); 
    setErrors({});
    setOpen(true);
  };

  const handleSaveProduct = async () => {
    const newErrors = {};
    if (!form.product_name) newErrors.product_name = "กรุณากรอกชื่อสินค้า";
    if (form.cost_price === "") newErrors.cost_price = "ระบุราคาทุน";
    if (form.selling_price === "") newErrors.selling_price = "ระบุราคาขาย";
    if (form.stock_quantity === "") newErrors.stock_quantity = "ระบุจำนวน";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const currentQty = parseInt(form.stock_quantity);
    
    const payload = {
      ...form,
      cost_price: parseFloat(form.cost_price),
      selling_price: parseFloat(form.selling_price),
      stock_quantity: currentQty,
    };

    try {
      if (editId) {
        const oldData = data.find((d) => d.id === editId);
        const oldQty = oldData ? parseInt(oldData.stock_quantity) : 0;

        await updateDoc(doc(db, "Products", editId), payload);

        const isStockChanged = oldQty !== currentQty;
        if (isStockChanged) {
          const diff = currentQty - oldQty;
          const type = diff > 0 ? "stock_in_edit" : "stock_out_edit";
          await recordTransaction({ id: editId, ...payload }, type, diff, oldQty, currentQty, "แก้ไขจำนวนสต็อก");
        } else {
             await recordTransaction({ id: editId, ...payload }, "edit_info", 0, oldQty, currentQty, "แก้ไขข้อมูลสินค้า");
        }
        showSnackbar("อัปเดตข้อมูลเรียบร้อยแล้ว", "success");
      } else {
        const docRef = await addDoc(refProductTable, { ...payload, created_at: serverTimestamp() });
        await recordTransaction({ id: docRef.id, ...payload }, "new_product", currentQty, 0, currentQty, "เพิ่มสินค้าใหม่เข้าระบบ");
        showSnackbar("เพิ่มสินค้าใหม่เรียบร้อยแล้ว", "success");
      }
      setForm(initialFormState);
      setOpen(false);
      setEditId(null);
    } catch (err) {
      console.error(err);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: "การลบสินค้านี้จะลบประวัติการทำรายการทั้งหมดด้วย คุณแน่ใจหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const q = query(refTransactionTable, where("product_id", "==", id));
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => batch.delete(doc.ref));
          if (!querySnapshot.empty) await batch.commit();
          await deleteDoc(doc(refProductTable, id));
          showSnackbar("ลบข้อมูลและประวัติเรียบร้อยแล้ว", "success");
        } catch (err) {
          console.error("Error deleting product:", err);
          showSnackbar("เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(refCategoryTable, { category_name: newCategoryName });
      showSnackbar("เพิ่มหมวดหมู่สำเร็จ", "success");
      setNewCategoryName("");
      setOpenCatModal(false);
    } catch (err) {
      console.error(err);
      showSnackbar("เกิดข้อผิดพลาด", "error");
    }
  };

  const handleOpenHistory = async (item) => {
    setSelectedProductHistory(item);
    setHistoryData([]);
    setHistoryFilterDate(""); 
    setHistoryFilterType("all");
    setHistoryPage(0);
    setHistoryRowsPerPage(5);
    setOpenHistoryDialog(true);
    setHistoryLoading(true);

    try {
      const q = query(
        refTransactionTable,
        where("product_id", "==", item.id),
        firestoreOrderBy("transaction_date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHistoryData(logs);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
        setHistoryLoading(false); 
    }
  };

  const handleResetHistoryFilter = () => {
      setHistoryFilterDate("");
      setHistoryFilterType("all");
      setHistoryPage(0);
  }

  const handleRequestHistorySort = (event, property) => {
      const isAsc = historyOrderBy === property && historyOrder === 'asc';
      setHistoryOrder(isAsc ? 'desc' : 'asc');
      setHistoryOrderBy(property);
  };

  const handleChangeHistoryPage = (event, newPage) => {
      setHistoryPage(newPage);
  };

  const handleChangeHistoryRowsPerPage = (event) => {
      setHistoryRowsPerPage(parseInt(event.target.value, 10));
      setHistoryPage(0);
  };

  const filteredHistoryData = historyData.filter((log) => {
    let matchDate = true;
    if (historyFilterDate) {
        const logDate = log.transaction_date 
            ? new Date(log.transaction_date.seconds * 1000).toISOString().split('T')[0] 
            : "";
        matchDate = logDate === historyFilterDate;
    }
    let matchType = true;
    if (historyFilterType !== "all") {
        if (historyFilterType === "in") matchType = log.transaction_type.includes("in") || log.transaction_type === "new_product";
        else if (historyFilterType === "out") matchType = log.transaction_type.includes("out") || log.transaction_type.includes("delete");
        else if (historyFilterType === "price") matchType = log.transaction_type === "price_change";
        else if (historyFilterType === "edit") matchType = log.transaction_type === "edit_info";
    }
    return matchDate && matchType;
  });

  const visibleHistoryRows = stableSort(
      filteredHistoryData,
      getComparator(historyOrder, historyOrderBy)
  ).slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage);

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.category_name : <span style={{ color: "#999", fontStyle: "italic" }}>ไม่ระบุ</span>;
  };

  const getStockStatus = (qty) => {
    const q = parseInt(qty);
    if (q === 0) return <Chip label="หมดสต็อก" color="error" size="small" variant="outlined" />;
    if (q < 10) return <Chip label="ใกล้หมด" color="warning" size="small" variant="outlined" />;
    return <Chip label="พร้อมขาย" color="success" size="small" variant="outlined" />;
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCategory("all");
    setSelectedIds([]);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelecteds = visibleRows.map((n) => n.id);
      setSelectedIds(newSelecteds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) newSelected = newSelected.concat(selectedIds, id);
    else if (selectedIndex === 0) newSelected = newSelected.concat(selectedIds.slice(1));
    else if (selectedIndex === selectedIds.length - 1) newSelected = newSelected.concat(selectedIds.slice(0, -1));
    else if (selectedIndex > 0) newSelected = newSelected.concat(selectedIds.slice(0, selectedIndex), selectedIds.slice(selectedIndex + 1));
    setSelectedIds(newSelected);
  };

  const handleOpenSingleBarcode = (item) => {
    setItemsToPrint([item]);
    setOpenBarcodeDialog(true);
  };

  const handleOpenMultipleBarcode = () => {
    const targets = data.filter((item) => selectedIds.includes(item.id));
    setItemsToPrint(targets);
    setOpenBarcodeDialog(true);
  };

  const handlePrint = useReactToPrint({ contentRef: componentRef });


  // ================= AI / BILL SCAN LOGIC (GEMINI REAL) =================

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const analyzeBillImage = async (file) => {
    try {
        if (!API_KEY) {
            throw new Error("ไม่พบ API Key กรุณาตรวจสอบไฟล์ .env");
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        // ✅ ใช้โมเดล gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
          Task: Analyze this receipt/bill image and extract product items.
          Context: You are an inventory assistant for a Thai shop.
          Instructions:
          1. Extract: product_name (Thai), selling_price (number), cost_price (number, if missing assume 70% of selling price), stock_quantity (number, default 1).
          2. Generate: A random 8-digit 'barcode' for each item.
          3. Format: Return ONLY a raw JSON array of objects. No markdown formatting.
          4. Clean up names: Remove text like 'pcs', 'ea', prices in name.
          Example Output: [{"product_name":"Lay Chips", "selling_price":30, "cost_price":20, "stock_quantity":2, "barcode":"12345678"}]
        `;

        const imagePart = await fileToGenerativePart(file);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean markdown backticks if present
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);

    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw error;
    }
  };

  const handleUploadBill = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => setScannedImage(e.target.result);
      reader.readAsDataURL(file);

      setIsScanning(true);
      try {
          const items = await analyzeBillImage(file);
          
          const formattedItems = items.map(item => ({
              ...item,
              Categories_category_id: categories.length > 0 ? categories[0].id : "",
              location: "Store" // Default location
          }));
          
          setScannedItems(formattedItems);
          showSnackbar("อ่านข้อมูลสำเร็จ!", "success");

      } catch (error) {
          console.error("AI Error", error);
          let errMsg = error.message;
          if(errMsg.includes("404")) errMsg = "ไม่พบโมเดล AI (กรุณาตรวจสอบชื่อรุ่นโมเดล)";
          showSnackbar(`เกิดข้อผิดพลาด: ${errMsg}`, "error");
      } finally {
          setIsScanning(false);
      }
  };

  const handleScannedItemChange = (index, field, value) => {
      const updated = [...scannedItems];
      updated[index][field] = value;
      setScannedItems(updated);
  };

  // ✅ NEW: Generate Random Barcode for specific item
  const handleGenerateBarcodeForScannedItem = (index) => {
      let randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      // ใช้ Prefix ที่ตั้งไว้ด้านบนมารวมด้วย
      const finalCode = (scannedPrefix || "").trim() + randomCode;
      handleScannedItemChange(index, 'barcode', finalCode);
  };

  const handleRemoveScannedItem = (index) => {
      const updated = [...scannedItems];
      updated.splice(index, 1);
      setScannedItems(updated);
  };

  const handleSaveScannedItems = async () => {
    setLoading(true);
    try {
        const batch = writeBatch(db); // Note: batch writes limits to 500 ops.
        
        const promises = scannedItems.map(async (item) => {
            const payload = {
                barcode: item.barcode || Math.floor(10000000 + Math.random() * 90000000).toString(),
                product_name: item.product_name,
                cost_price: parseFloat(item.cost_price),
                selling_price: parseFloat(item.selling_price),
                stock_quantity: parseInt(item.stock_quantity),
                location: item.location,
                Categories_category_id: item.Categories_category_id,
                created_at: serverTimestamp()
            };

            const docRef = await addDoc(refProductTable, payload);
            
            await recordTransaction(
                { id: docRef.id, ...payload },
                "new_product",
                parseInt(item.stock_quantity),
                0,
                parseInt(item.stock_quantity),
                "นำเข้าจากบิล/AI"
            );
        });

        await Promise.all(promises);

        showSnackbar(`นำเข้าสินค้าสำเร็จ ${scannedItems.length} รายการ`, "success");
        setOpenScanDialog(false);
        setScannedItems([]);
        setScannedImage(null);
        setScannedPrefix(""); // Reset Prefix

    } catch (error) {
        console.error("Batch Import Error:", error);
        showSnackbar("เกิดข้อผิดพลาดในการนำเข้าสินค้า", "error");
    } finally {
        setLoading(false);
    }
  };


  // ================= RENDER =================
  if (loading && !openScanDialog) {
      return (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f5f5f5">
              <CircularProgress size={60} color="success" />
              <Typography variant="h6" color="textSecondary" mt={3} fontWeight="bold">กำลังโหลดข้อมูลสินค้า...</Typography>
          </Box>
      );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 5, mb: 5, fontFamily: "Sarabun, sans-serif" }}
    >
      <style>{` .swal2-container { z-index: 20000 !important; } `}</style>

      {/* --- HEADER --- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            color="success.main"
          >
            <Inventory2OutlinedIcon
              sx={{ fontSize: 35, verticalAlign: "middle", mr: 1 }}
            />
            จัดการคลังสินค้า
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            ภาพรวมรายการสต็อกทั้งหมด ( {data.length} รายการ )
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-end' }}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleOpenMultipleBarcode}
              sx={{ borderRadius: 2 }}
            >
              พิมพ์ Barcode ({selectedIds.length})
            </Button>
          )}
          
          {/* ✅ Scan Bill Button */}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CameraAltIcon />}
            onClick={() => setOpenScanDialog(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
              background: 'linear-gradient(45deg, #7b1fa2 30%, #ce93d8 90%)',
              color: 'white'
            }}
          >
            สแกนบิลสินค้า (AI)
          </Button>

          <Button
            variant="contained"
            size="large"
            color="success"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenAdd}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
          >
            เพิ่มสินค้าใหม่
          </Button>
        </Stack>
      </Box>

      {/* --- FILTER --- */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: "white",
          border: "1px solid #e0e0e0",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            placeholder="ค้นหาชื่อ, Barcode, ตำแหน่ง..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} fullWidth>
            <InputLabel>
              <CategoryIcon
                sx={{ fontSize: 16, verticalAlign: "text-top", mr: 0.5 }}
              />
              หมวดหมู่
            </InputLabel>
            <Select
              value={filterCategory}
              label="หมวดหมู่"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1, minWidth: 200 }} fullWidth>
            <InputLabel>
              <FilterAltIcon
                sx={{ fontSize: 16, verticalAlign: "text-top", mr: 0.5 }}
              />
              สถานะสินค้า
            </InputLabel>
            <Select
              value={filterStatus}
              label="สถานะสินค้า"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="in_stock">✅ พร้อมขาย</MenuItem>
              <MenuItem value="low_stock">⚠️ ใกล้หมด</MenuItem>
              <MenuItem value="out_of_stock">❌ หมดสต็อก</MenuItem>
            </Select>
          </FormControl>
          {(searchTerm ||
            filterStatus !== "all" ||
            filterCategory !== "all") && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={handleResetFilter}
              sx={{ borderColor: "#ddd", color: "#666", whiteSpace: "nowrap" }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </Stack>
      </Paper>

      {/* --- TABLE SECTION --- */}
      <TableContainer
        component={Paper}
        elevation={4}
        sx={{ borderRadius: 3, overflow: "hidden" }}
      >
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: "#4caf50" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < visibleRows.length
                  }
                  checked={
                    visibleRows.length > 0 &&
                    selectedIds.length === visibleRows.length
                  }
                  onChange={handleSelectAll}
                  sx={{
                    color: "white",
                    "&.Mui-checked": { color: "white" },
                    "&.MuiCheckbox-indeterminate": { color: "white" },
                  }}
                />
              </TableCell>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : "asc"}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                      sx={{
                        color: "white !important",
                        "& .MuiTableSortLabel-icon": {
                          color: "white !important",
                        },
                      }}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === "desc"
                            ? "sorted descending"
                            : "sorted ascending"}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((item) => {
                const isSelected = selectedIds.indexOf(item.id) !== -1;
                return (
                  <TableRow
                    key={item.id}
                    hover
                    selected={isSelected}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="success"
                        checked={isSelected}
                        onChange={(event) => handleSelectOne(event, item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="คลิกเพื่อสร้าง/ปริ้น Barcode">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenSingleBarcode(item)}
                          >
                            {" "}
                            <QrCodeIcon fontSize="small" />{" "}
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" fontFamily="monospace">
                          {item.barcode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.product_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Zone: {item.location || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryName(item.Categories_category_id)}
                        size="small"
                        sx={{ bgcolor: "#e3f2fd", color: "#1565c0" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="success.main">
                        ฿{Number(item.selling_price).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        ทุน: {Number(item.cost_price).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="h6"
                        component="span"
                        fontWeight="bold"
                      >
                        {item.stock_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {getStockStatus(item.stock_quantity)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="ประวัติสต็อก">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#1976d2",
                              bgcolor: "#e3f2fd",
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                            onClick={() => handleOpenHistory(item)}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไขข้อมูล">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#ff9800",
                              bgcolor: "#fff3e0",
                              "&:hover": { bgcolor: "#ffe0b2" },
                            }}
                            onClick={() => handleOpenEdit(item)}
                          >
                            {" "}
                            <EditOutlinedIcon />{" "}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบข้อมูล">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#ef5350",
                              bgcolor: "#ffebee",
                              "&:hover": { bgcolor: "#ffcdd2" },
                            }}
                            onClick={() => handleDeleteProduct(item.id)}
                          >
                            {" "}
                            <DeleteOutlineIcon />{" "}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Inventory2OutlinedIcon
                    sx={{ fontSize: 60, color: "#e0e0e0", mb: 2 }}
                  />
                  <Typography color="text.secondary" variant="h6">
                    ไม่พบข้อมูลสินค้า
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleResetFilter}
                    sx={{ mt: 2 }}
                  >
                    แสดงข้อมูลทั้งหมด
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderTop: "1px solid #eee",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              แสดง
            </Typography>
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                sx={{
                  height: 32,
                  fontSize: "0.875rem",
                  bgcolor: "#f5f5f5",
                  "& fieldset": { border: "none" },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              รายการ/หน้า
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
              (รวม {filteredData.length} รายการ)
            </Typography>
          </Box>
          <Pagination
            count={countPages}
            page={page + 1}
            onChange={handlePageChange}
            color="success"
            shape="rounded"
            showFirstButton
            showLastButton
            siblingCount={1}
          />
        </Box>
      </TableContainer>

      {/* --- DIALOG: SCAN BILL (AI IMPORT - PROFESSIONAL UI) --- */}
      <Dialog 
        open={openScanDialog} 
        onClose={() => setOpenScanDialog(false)} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '90vh' } }}
      >
        <Box sx={{ 
            background: 'linear-gradient(45deg, #7b1fa2 30%, #ce93d8 90%)', 
            color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 3, zIndex: 1
        }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: '#7b1fa2' }}><CameraAltIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">สแกนบิลสินค้าด้วย AI</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {scannedItems.length > 0 ? `ตรวจสอบรายการสินค้าที่พบ (${scannedItems.length} รายการ)` : "อัปโหลดรูปภาพบิลหรือใบเสร็จ"}
                    </Typography>
                </Box>
            </Box>
            <IconButton onClick={() => setOpenScanDialog(false)} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 0, bgcolor: '#f4f6f8', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {scannedItems.length === 0 && !isScanning ? (
                // --- STAGE 1: UPLOAD (Clean Center Layout) ---
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    justifyContent="center" 
                    height="100%"
                    p={4}
                >
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                            border: '2px dashed #ccc', borderRadius: 4, bgcolor: 'white',
                            cursor: 'pointer', transition: '0.3s',
                            '&:hover': { borderColor: '#7b1fa2', bgcolor: '#f3e5f5' }
                        }}
                        component="label"
                    >
                        <CloudUploadIcon sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>ลากไฟล์มาวางที่นี่</Typography>
                        <Typography variant="body2" color="text.disabled" gutterBottom>หรือคลิกเพื่อเลือกไฟล์รูปภาพ</Typography>
                        <Button
                            variant="contained"
                            component="span" // Important for label wrap
                            startIcon={<PhotoLibraryIcon />}
                            sx={{ mt: 3, bgcolor: '#9c27b0', borderRadius: 5, px: 4, py: 1, '&:hover': { bgcolor: '#7b1fa2' } }}
                        >
                            เลือกรูปภาพ
                        </Button>
                        <input hidden accept="image/*" type="file" onChange={handleUploadBill} />
                    </Paper>
                </Box>
            ) : isScanning ? (
                // --- STAGE 2: PROCESSING (Modern Loading) ---
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Box position="relative" display="inline-flex">
                        <CircularProgress size={80} sx={{ color: '#9c27b0' }} thickness={4} />
                        <Box
                            top={0} left={0} bottom={0} right={0}
                            position="absolute" display="flex" alignItems="center" justifyContent="center"
                        >
                            <CameraAltIcon sx={{ color: '#ce93d8', fontSize: 30 }} />
                        </Box>
                    </Box>
                    <Typography variant="h6" sx={{ mt: 3, color: '#4a4a4a', fontWeight: 'bold' }}>AI กำลังอ่านข้อมูล...</Typography>
                    <Typography variant="body2" color="text.secondary">ระบบกำลังวิเคราะห์ชื่อ ราคา และจำนวนสินค้าจากภาพ</Typography>
                </Box>
            ) : (
                // --- STAGE 3: REVIEW (Split Layout Professional) ---
                <Grid container sx={{ height: '100%' }}>
                    {/* Left Panel: Image Preview (Sticky) */}
                    <Grid item size={{ xs: 12, md: 4, lg: 3 }} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                        <Box p={2} borderBottom="1px solid #eee">
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                <PhotoLibraryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                ต้นฉบับ
                            </Typography>
                        </Box>
                        <Box flex={1} p={2} display="flex" alignItems="flex-start" justifyContent="center" sx={{ overflowY: 'auto', bgcolor: '#333' }}>
                             <img src={scannedImage} alt="Original Bill" style={{ maxWidth: '100%', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
                        </Box>
                        <Box p={2} borderTop="1px solid #eee">
                             <Button 
                                fullWidth 
                                variant="outlined" 
                                color="error" 
                                startIcon={<RestartAltIcon />} 
                                onClick={() => { setScannedItems([]); setScannedImage(null); }}
                            >
                                สแกนใหม่
                            </Button>
                        </Box>
                    </Grid>
                    
                    {/* Right Panel: Form Data (Card List) */}
                    <Grid item size={{ xs: 12, md: 8, lg: 9 }} sx={{ bgcolor: '#f4f6f8', height: '100%', overflowY: 'auto', p: 3 }}>
                         {/* Header: Title + Add Category */}
                         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                            <Typography variant="h6" color="text.primary" fontWeight="bold">
                                รายการสินค้า ({scannedItems.length})
                            </Typography>
                             <Button 
                                variant="contained" 
                                color="secondary" 
                                size="small" 
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => setOpenCatModal(true)} // ✅ เปิด Modal หมวดหมู่
                                sx={{ bgcolor: '#7b1fa2', borderRadius: 2 }}
                             >
                                 เพิ่มหมวดหมู่
                             </Button>
                         </Box>

                         {/* Global Prefix Input */}
                         <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0}>
                             <Typography variant="subtitle2" gutterBottom color="text.secondary">ตั้งค่ารหัสสินค้า (Global Setting)</Typography>
                             <TextField 
                                label="รหัสขึ้นต้น (Prefix)" 
                                placeholder="เช่น IMP, BOX, 2024" 
                                value={scannedPrefix}
                                onChange={(e) => setScannedPrefix(e.target.value)}
                                fullWidth 
                                size="small"
                                helperText="พิมพ์ Prefix แล้วกดปุ่มหมุน 🔄 ในแต่ละรายการเพื่อสุ่มรหัสใหม่พร้อม Prefix"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><TagIcon fontSize="small" /></InputAdornment>
                                }}
                             />
                         </Paper>

                         <Stack spacing={2}>
                            {scannedItems.map((item, index) => (
                                <Card key={index} elevation={2} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Grid container spacing={2} alignItems="center">
                                            {/* Row 1: Main Info */}
                                            <Grid item xs={12} md={1}>
                                                 <Box 
                                                    display="flex" alignItems="center" justifyContent="center" 
                                                    bgcolor="#f3e5f5" color="#7b1fa2" 
                                                    width={40} height={40} borderRadius="50%" fontWeight="bold"
                                                 >
                                                     {index + 1}
                                                 </Box>
                                            </Grid>

                                            <Grid item size={{ xs: 12, md: 5 }}>
                                                <TextField
                                                    label="ชื่อสินค้า"
                                                    value={item.product_name}
                                                    onChange={(e) => handleScannedItemChange(index, 'product_name', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                    InputProps={{ sx: { fontWeight: 'bold' } }}
                                                />
                                            </Grid>
                                             <Grid item size={{ xs: 12, md: 3 }}>
                                                <TextField
                                                    label="Barcode"
                                                    value={item.barcode}
                                                    onChange={(e) => handleScannedItemChange(index, 'barcode', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                    InputProps={{ 
                                                        startAdornment: <InputAdornment position="start"><QrCodeIcon fontSize="small" /></InputAdornment>,
                                                        // ✅ ปุ่ม Random Barcode ในแต่ละรายการ
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <Tooltip title="สุ่มรหัสใหม่ (รวม Prefix)">
                                                                    <IconButton size="small" onClick={() => handleGenerateBarcodeForScannedItem(index)}>
                                                                        <AutorenewIcon fontSize="small" color="primary" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 12, md: 3 }}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>หมวดหมู่</InputLabel>
                                                    <Select
                                                        value={item.Categories_category_id}
                                                        label="หมวดหมู่"
                                                        onChange={(e) => handleScannedItemChange(index, 'Categories_category_id', e.target.value)}
                                                    >
                                                        {categories.map((cat) => (
                                                            <MenuItem key={cat.id} value={cat.id}>{cat.category_name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            {/* Row 2: Details */}
                                             <Grid item size={{ xs: 12, md: 1 }}></Grid> {/* Spacer */}
                                             <Grid item size={{ xs: 6, md: 2 }}>
                                                <TextField 
                                                    label="ทุน"
                                                    type="number"
                                                    value={item.cost_price}
                                                    onChange={(e) => handleScannedItemChange(index, 'cost_price', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 6, md: 2 }}>
                                                <TextField 
                                                    label="ราคาขาย"
                                                    type="number"
                                                    value={item.selling_price}
                                                    onChange={(e) => handleScannedItemChange(index, 'selling_price', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start">฿</InputAdornment> }}
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 6, md: 2 }}>
                                                <TextField 
                                                    label="จำนวน"
                                                    type="number"
                                                    value={item.stock_quantity}
                                                    onChange={(e) => handleScannedItemChange(index, 'stock_quantity', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 6, md: 2 }}>
                                                 <TextField 
                                                    label="ตำแหน่งเก็บ"
                                                    value={item.location}
                                                    onChange={(e) => handleScannedItemChange(index, 'location', e.target.value)}
                                                    fullWidth size="small" variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" color="disabled" /></InputAdornment> }}
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 12, md: 1 }} display="flex" justifyContent="flex-end">
                                                <Tooltip title="ลบรายการนี้">
                                                    <IconButton color="error" onClick={() => handleRemoveScannedItem(index)}>
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                         </Stack>
                    </Grid>
                </Grid>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
            <Button onClick={() => setOpenScanDialog(false)} sx={{ color: 'text.secondary', px: 3 }}>ยกเลิก</Button>
            {scannedItems.length > 0 && (
                <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    startIcon={<SaveAsIcon />}
                    onClick={handleSaveScannedItems}
                    sx={{ px: 4, bgcolor: '#9c27b0', borderRadius: 2, '&:hover': { bgcolor: '#7b1fa2' } }}
                >
                    ยืนยันและนำเข้าระบบ ({scannedItems.length})
                </Button>
            )}
        </DialogActions>
      </Dialog>

      {/* --- DIALOG: STOCK HISTORY --- */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ bgcolor: 'success.main', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'success.main' }}><HistoryIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">ประวัติการทำรายการ</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedProductHistory?.product_name} ({selectedProductHistory?.barcode})</Typography>
                </Box>
            </Box>
            <IconButton onClick={() => setOpenHistoryDialog(false)} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>

        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                    <TextField 
                        fullWidth 
                        size="small" 
                        type="date"
                        label="เลือกวันที่"
                        InputLabelProps={{ shrink: true }}
                        value={historyFilterDate}
                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                        InputProps={{
                            sx: { bgcolor: 'white' }
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={5}>
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภทรายการ</InputLabel>
                        <Select
                            value={historyFilterType}
                            label="ประเภทรายการ"
                            onChange={(e) => setHistoryFilterType(e.target.value)}
                            sx={{ bgcolor: 'white' }}
                        >
                            <MenuItem value="all">ทั้งหมด</MenuItem>
                            <MenuItem value="in">📈 เติมสินค้า / ของใหม่</MenuItem>
                            <MenuItem value="out">📉 ขาย / ตัดสต็อก</MenuItem>
                            <MenuItem value="price">💰 ปรับราคา (ทุน/ขาย)</MenuItem>
                            <MenuItem value="edit">📝 แก้ไขข้อมูลทั่วไป</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        fullWidth 
                        onClick={handleResetHistoryFilter}
                        startIcon={<RestartAltIcon />}
                        sx={{ borderColor: '#ccc', color: '#666' }}
                    >
                        ล้าง
                    </Button>
                </Grid>
            </Grid>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {historyLoading ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={300}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="textSecondary" mt={2}>กำลังดึงข้อมูลประวัติ...</Typography>
              </Box>
          ) : (
            <>
              <TableContainer sx={{ minHeight: 300 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                          <TableSortLabel
                            active={historyOrderBy === 'transaction_date'}
                            direction={historyOrderBy === 'transaction_date' ? historyOrder : 'asc'}
                            onClick={(event) => handleRequestHistorySort(event, 'transaction_date')}
                          >
                              วันที่/เวลา
                          </TableSortLabel>
                      </TableCell>
                      <TableCell>สถานะ</TableCell>
                      <TableCell align="right">
                          <TableSortLabel
                            active={historyOrderBy === 'quantity_change'}
                            direction={historyOrderBy === 'quantity_change' ? historyOrder : 'asc'}
                            onClick={(event) => handleRequestHistorySort(event, 'quantity_change')}
                          >
                              เปลี่ยนแปลง
                          </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">คงเหลือ</TableCell>
                      <TableCell align="right">ราคา(ทุน/ขาย)</TableCell>
                      <TableCell>หมายเหตุ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleHistoryRows.length > 0 ? (
                      visibleHistoryRows.map((log) => {
                        const date = log.transaction_date
                          ? new Date(log.transaction_date.seconds * 1000).toLocaleString("th-TH")
                          : "-";
                        const isPositive = log.quantity_change > 0;
                        const isPriceChange = log.transaction_type === "price_change";
                        const isEditInfo = log.transaction_type === "edit_info";

                        let chipColor = "default";
                        let chipLabel = log.transaction_type;
                        let ChipIcon = null;

                        if (log.transaction_type.includes("in") || log.transaction_type === "new_product") {
                          chipColor = "success";
                          ChipIcon = <TrendingUpIcon fontSize="small" />;
                          if(log.transaction_type === "new_product") chipLabel = "สินค้าใหม่";
                          else chipLabel = "เติมสต็อก";
                        } else if (log.transaction_type.includes("out") || log.transaction_type.includes("delete")) {
                          chipColor = "error";
                          ChipIcon = <TrendingDownIcon fontSize="small" />;
                          chipLabel = "ตัดสต็อก";
                        } else if (isPriceChange) {
                          chipColor = "warning"; 
                          ChipIcon = <CurrencyExchangeIcon fontSize="small" />;
                          chipLabel = "ปรับราคา";
                        } else if (isEditInfo) {
                          chipColor = "info"; 
                          ChipIcon = <SettingsIcon fontSize="small" />;
                          chipLabel = "แก้ไขข้อมูล";
                        }

                        return (
                          <TableRow key={log.id} hover>
                            <TableCell sx={{ fontSize: "0.85rem", color: 'text.secondary' }}>{date}</TableCell>
                            <TableCell>
                              <Chip
                                icon={ChipIcon}
                                label={chipLabel}
                                size="small"
                                color={chipColor}
                                variant="outlined"
                                sx={{ fontWeight: 'bold', border: '1px solid', borderColor: `${chipColor}.main`, minWidth: 100, justifyContent: 'flex-start' }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: (isEditInfo || isPriceChange) ? "text.disabled" : isPositive ? "success.main" : "error.main",
                                fontWeight: "bold",
                                fontSize: '1rem'
                              }}
                            >
                              {(isEditInfo || isPriceChange) ? "-" : isPositive ? `+${log.quantity_change}` : log.quantity_change}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              {log.current_stock}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.8rem", color: "#666" }}>
                              <Box display="flex" flexDirection="column" alignItems="flex-end">
                                <span style={{ color: isPriceChange ? '#ed6c02' : 'inherit', fontWeight: isPriceChange ? 'bold' : 'normal' }}>
                                    ฿{Number(log.cost_price).toLocaleString()}
                                </span> 
                                <span style={{ color: isPriceChange ? '#ed6c02' : '#999', fontSize: '0.75rem' }}>
                                    / ฿{Number(log.selling_price).toLocaleString()}
                                </span>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem", maxWidth: 150 }}>
                              {log.note}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            <CalendarMonthIcon sx={{ fontSize: 40, color: '#e0e0e0', mb: 1 }} />
                            <Typography>ไม่พบประวัติการทำรายการในช่วงนี้</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredHistoryData.length}
                rowsPerPage={historyRowsPerPage}
                page={historyPage}
                onPageChange={handleChangeHistoryPage}
                onRowsPerPageChange={handleChangeHistoryRowsPerPage}
                labelRowsPerPage="แสดง:"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: PRINT BARCODE --- */}
      <Dialog
        open={openBarcodeDialog}
        onClose={() => setOpenBarcodeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ bgcolor: '#1976d2', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: '#1976d2' }}><PrintIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">พิมพ์ Barcode</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{itemsToPrint.length} รายการที่เลือก</Typography>
                </Box>
            </Box>
            <IconButton onClick={() => setOpenBarcodeDialog(false)} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 2 }}>
          <Box
            ref={componentRef}
            sx={{
              p: 2,
              backgroundColor: "white",
              "@media print": { padding: "20px" },
            }}
          >
            <Grid container spacing={3}>
              {itemsToPrint.map((item) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={item.id}
                  sx={{ textAlign: "center", pageBreakInside: "avoid" }}
                >
                  <Box
                    sx={{
                      border: "1px dashed #ccc",
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ mb: 1, fontSize: "0.9rem" }}
                    >
                      {item.product_name}
                    </Typography>
                    {item.barcode ? (
                      <Barcode
                        value={item.barcode}
                        width={1.5}
                        height={50}
                        fontSize={14}
                        margin={0}
                      />
                    ) : (
                      <Box
                        height={50}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="#f5f5f5"
                        width="100%"
                      >
                        {" "}
                        <Typography variant="caption">
                          ไม่มี Barcode
                        </Typography>{" "}
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      ฿{Number(item.selling_price).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenBarcodeDialog(false)} sx={{ color: 'text.secondary' }}>ปิด</Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
          >
            สั่งพิมพ์
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ADD/EDIT PRODUCT --- */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ 
            bgcolor: editId ? '#ed6c02' : 'success.main', 
            color: 'white', 
            px: 3, py: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
        }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: editId ? '#ed6c02' : 'success.main' }}>
                    {editId ? <EditOutlinedIcon /> : <AddCircleOutlineIcon />}
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        {editId ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {editId ? `กำลังแก้ไข: ${form.product_name}` : "กรอกข้อมูลสินค้าเพื่อเพิ่มลงในสต็อก"}
                    </Typography>
                </Box>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 4 }}>
          <Stack spacing={3}>
            {/* Identity Group */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <QrCodeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> ข้อมูลสินค้า
              </Typography>
              
              <Box display="flex" gap={2} sx={{ flexDirection: { xs: "column", md: "row" } }}>
                <Box sx={{ flex: { md: 0.25 } }}>
                    <TextField
                        label="รหัสขึ้นต้น"
                        placeholder="เช่น SHOP"
                        value={genPrefix}
                        onChange={(e) => setGenPrefix(e.target.value)}
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <TagIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Box sx={{ flex: { md: 0.4 } }}>
                  <TextField
                    label="Barcode / รหัสสินค้า"
                    name="barcode"
                    fullWidth
                    value={form.barcode}
                    onChange={handleChang}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                            <QrCodeIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="สุ่มรหัส (ต่อท้ายรหัสขึ้นต้น)">
                            <IconButton
                              onClick={handleGenerateBarcode}
                              edge="end"
                              color="primary"
                            >
                              <AutorenewIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ flex: { md: 0.6 } }}>
                    <TextField
                        label="ชื่อสินค้า"
                        name="product_name"
                        fullWidth
                        required
                        error={!!errors.product_name}
                        helperText={errors.product_name}
                        value={form.product_name}
                        onChange={handleChang}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <StorefrontIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: "dashed" }} />

            {/* Category & Location Group */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <CategoryIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> การจัดเก็บ
              </Typography>
              <Box
                display="flex"
                gap={2}
                sx={{ flexDirection: { xs: "column", sm: "row" } }}
              >
                <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>หมวดหมู่สินค้า</InputLabel>
                    <Select
                      name="Categories_category_id"
                      value={form.Categories_category_id}
                      label="หมวดหมู่สินค้า"
                      onChange={handleChang}
                      startAdornment={
                        <InputAdornment position="start">
                            <CategoryIcon fontSize="small" color="action" />
                        </InputAdornment>
                      }
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.category_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    sx={{
                      minWidth: 56,
                      height: 56,
                      borderColor: "#ccc",
                      color: "#666",
                    }}
                    onClick={() => setOpenCatModal(true)}
                  >
                    <AddCircleOutlineIcon />
                  </Button>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="ตำแหน่งเก็บ (Location)"
                    name="location"
                    fullWidth
                    value={form.location}
                    onChange={handleChang}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory2OutlinedIcon
                            fontSize="small"
                            sx={{ color: "text.disabled" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: "dashed" }} />

            {/* Price & Stock Group */}
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "text.secondary", fontWeight: "bold" }}
              >
                <AttachMoneyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> ราคาและสต็อก
              </Typography>
              <Box
                display="flex"
                gap={2}
                sx={{ flexDirection: { xs: "column", sm: "row" } }}
              >
                <TextField
                  label="ราคาทุน"
                  name="cost_price"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.cost_price}
                  helperText={errors.cost_price}
                  value={form.cost_price}
                  onChange={handleChang}
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <AttachMoneyIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="ราคาขาย"
                  name="selling_price"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.selling_price}
                  helperText={errors.selling_price}
                  value={form.selling_price}
                  onChange={handleChang}
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <AttachMoneyIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="จำนวนสต็อก"
                  name="stock_quantity"
                  type="number"
                  inputProps={{ min: 0 }}
                  required
                  fullWidth
                  sx={{ flex: 1 }}
                  error={!!errors.stock_quantity}
                  helperText={errors.stock_quantity}
                  value={form.stock_quantity}
                  onChange={handleChang}
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Inventory2OutlinedIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, bgcolor: "#f8f9fa", borderTop: "1px solid #eee" }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveProduct}
            variant="contained"
            color={editId ? "warning" : "success"}
            size="large"
            sx={{ px: 4 }}
          >
            {editId ? "อัปเดตข้อมูล" : "บันทึกสินค้า"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ADD CATEGORY --- */}
      <Dialog open={openCatModal} onClose={() => setOpenCatModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: 'secondary.main', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'secondary.main' }}><ClassIcon /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold">เพิ่มหมวดหมู่สินค้า</Typography>
                </Box>
            </Box>
            <IconButton onClick={() => setOpenCatModal(false)} sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <TextField
            autoFocus
            margin="dense"
            label="ชื่อหมวดหมู่"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f8f9fa", borderTop: "1px solid #eee" }}>
          <Button onClick={() => setOpenCatModal(false)} sx={{ color: "text.secondary" }}>ยกเลิก</Button>
          <Button onClick={handleAddCategory} variant="contained" color="secondary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Product;