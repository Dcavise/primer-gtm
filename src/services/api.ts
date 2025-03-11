import axios from "axios";
import { API_BASE_URL } from "./api-config";

// Set up a default axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
