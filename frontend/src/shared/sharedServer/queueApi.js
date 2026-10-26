import apiClient from "./apiClient.js";
export const queueApi = {
  async list(signal) {
    return (await apiClient.get("/queue", { signal })).data;
  },
  async checkIn(reference) {
    return (await apiClient.post("/queue/check-in", { reference })).data;
  },
  async callNext(staffId) {
    return (await apiClient.post("/queue/call-next", { staffId })).data;
  },
  async change(id, action) {
    return (await apiClient.patch(`/queue/${id}/${action}`)).data;
  },
  async prioritize(id, priority) {
    return (await apiClient.patch(`/queue/${id}/priority`, { priority })).data;
  },
};
