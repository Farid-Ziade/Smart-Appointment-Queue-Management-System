import apiClient from "./apiClient.js";

export async function loginUser(email, password) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}
