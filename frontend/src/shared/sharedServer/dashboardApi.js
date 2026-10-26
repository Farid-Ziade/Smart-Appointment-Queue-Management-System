import apiClient from "./apiClient.js";
export async function getDashboard(params, signal) {
  return (await apiClient.get("/dashboard", { params, signal })).data;
}
