import axios from "axios";
import { registerInterceptors } from "../interceptors.js";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

registerInterceptors(apiClient);

export default apiClient;
