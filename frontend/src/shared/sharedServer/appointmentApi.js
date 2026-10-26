import apiClient from "./apiClient.js";
export const appointmentApi = {
  async availability(params, signal) {
    return (await apiClient.get("/availability", { params, signal })).data;
  },
  async book(data, key) {
    return (
      await apiClient.post("/appointments", data, {
        headers: { "Idempotency-Key": key },
      })
    ).data;
  },
  async get(id, signal) {
    return (await apiClient.get(`/appointments/${id}`, { signal })).data;
  },
  async list(params, signal) {
    return (await apiClient.get("/appointments", { params, signal })).data;
  },
  async cancel(id) {
    return (await apiClient.patch(`/appointments/${id}/cancel`)).data;
  },
  async confirm(id) {
    return (await apiClient.patch(`/appointments/${id}/confirm`)).data;
  },
  async reschedule(id, data) {
    return (await apiClient.patch(`/appointments/${id}/reschedule`, data)).data;
  },
};
