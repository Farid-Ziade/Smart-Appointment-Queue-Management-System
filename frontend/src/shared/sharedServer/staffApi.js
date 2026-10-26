import apiClient from "./apiClient.js";
export const staffApi = {
  async list(serviceId, signal) {
    return (await apiClient.get("/staff", { params: { serviceId }, signal }))
      .data;
  },
  async create(data) {
    return (await apiClient.post("/staff", data)).data;
  },
  async saveSchedule(id, data) {
    return (await apiClient.put(`/staff/${id}/schedule`, data)).data;
  },
};
