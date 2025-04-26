import axios from "axios";
import { getToken } from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status !== 401 &&
      error.response.status !== 403
    ) {
      console.error("API Error:", error);
    }

    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      getToken() &&
      !error.config.url.includes("/comments/")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;