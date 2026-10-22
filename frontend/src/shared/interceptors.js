export function registerInterceptors(client) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      error.userMessage =
        error.response?.data?.message || "The request could not be completed.";

      return Promise.reject(error);
    },
  );
}
