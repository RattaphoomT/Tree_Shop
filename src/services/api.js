import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export default api;