import apiClient from "./apiClient.js";
export const serviceApi = {
  async list(includeInactive = false, signal) {
    return (
      await apiClient.get("/services", { params: { includeInactive }, signal })
    ).data;
  },
  async save(id, data) {
    return (
      await (id
        ? apiClient.put(`/services/${id}`, data)
        : apiClient.post("/services", data))
    ).data;
  },
  async setActive(id, isActive) {
    return (await apiClient.patch(`/services/${id}/active`, { isActive })).data;
  },
};
