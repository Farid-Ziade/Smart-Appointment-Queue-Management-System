import { getAccessToken, invalidateAccessToken } from "./auth/tokenMemory.js";
export function registerInterceptors(client) {
  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !config.headers.has("Authorization"))
      config.headers.set("Authorization", `Bearer ${token}`);
    const authorization = config.headers.get("Authorization");
    config.authTokenUsed =
      typeof authorization === "string"
        ? authorization.match(/^Bearer\s+(\S+)$/i)?.[1]
        : null;
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      error.userMessage =
        error.response?.data?.message ||
        "The request could not be completed. Please check your connection.";
      error.errorCode = error.response?.data?.code;
      if (error.response?.status === 401)
        invalidateAccessToken(error.config?.authTokenUsed);
      return Promise.reject(error);
    },
  );
}
