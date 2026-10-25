import apiClient from "./apiClient.js";

export async function loginUser(email, password) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function getCurrentUser(accessToken) {
  const response = await apiClient.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.user;
}
