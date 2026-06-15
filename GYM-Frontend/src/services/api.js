import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gym_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401 && !requestUrl.includes("/login")) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        localStorage.removeItem("gym_token");
        localStorage.removeItem("gym_user");
        localStorage.removeItem("gym_role");
      }
    }

    return Promise.reject(error);
  }
);

export default API;
