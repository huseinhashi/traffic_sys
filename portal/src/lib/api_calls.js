//portal/src/lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authToken
api.interceptors.request.use((config) => {
  const admintoken = localStorage.getItem("admintoken");
  if (admintoken) {
    config.headers.Authorization = `Bearer ${admintoken}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
