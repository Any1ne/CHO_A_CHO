import axios from "axios";
import { getBaseURL } from "./getBaseURL";

const axiosInstance = axios.create({
  baseURL: getBaseURL() + "/api",  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Додатково: Інтерцептори (опціонально)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;