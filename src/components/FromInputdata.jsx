import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";  
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { Link } from "react-router-dom";

const FromInputdata = () => {
  const [form, setForm] = useState({});
  const [data, setData] = useState([]);
  const refTable = collection(db, "Tree");

  useEffect(() => {
    const unsub = loadDataRealtime();
    return () => {
      unsub();
    };
  }, []);

  const loadDataRealtime = () => {
    const unsub = onSnapshot(refTable, (snapshot) => {
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(newData);
    });
    return () => {
      unsub();
    };
  };

  //   const loadData = async () => {
  //     await getDocs(collection(db, "Tree"))
  //       .then((query) => {
  //         const newData = query.docs.map((doc) => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  //         setData(newData);
  //       })
  //       .catch((err) => console.log(err));
  //   };

  const handleChang = (e) => {
    // console.log(e.target.name, e.target.value);
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(refTable, id))
      .then((res) => {
        console.log(res);
        // loadData();
      })
      .catch((err) => console.log(err));
  };

  const handleAddData = async () => {
    await addDoc(refTable, form)
      .then((res) => {
        console.log(res);
        setForm({
          nametree: "",
          price: "",
        });
        // loadData();
      })
      .catch((err) => console.log(err));

    console.log("Add_doc_success");
  };

  return (
    <>
      <h1 align="center">ระบบจัดการร้านขายต้นไม้</h1>
      <div>
        <Container maxWidth="sm">
          <Stack spacing={2} direction="column">
            <TextField
              onChange={(e) => handleChang(e)}
              value={form.nametree || ""}
              label="ชื่อต้นไม้"
              variant="outlined"
              name="nametree"
              type="text"
            />
            <TextField
              onChange={(e) => handleChang(e)}
              value={form.price || ""}
              label="ราคาต้นไม้"
              variant="outlined"
              name="price"
              type="number"
            />
            <Button variant="contained" onClick={handleAddData}>
              เพิ่มต้นไม้
            </Button>
          </Stack>
        </Container>
      </div>
      <div>
        <Container maxWidth="sm">
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>ลำดับ</TableCell>
                <TableCell>ชื่อต้นไม้</TableCell>
                <TableCell>ราคา</TableCell>
                <TableCell align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.nametree}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell align="center">
                    <IconButton>
                      <DeleteIcon onClick={() => handleDelete(item.id)} />
                    </IconButton>
                    <IconButton>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div maxWidth="sm">
            <Link to="/Dasborad">
              <Button fullWidth variant="contained">
                ไปหน้าแสดงรายละเอียด
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
};

export default FromInputdata;
