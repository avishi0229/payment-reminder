let unauthorizedHandler = () => {};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const API_BASE_URL = "http://localhost:5001/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    unauthorizedHandler();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Something went wrong");
  }

  return response.json();
};

export default {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, data, options) => request(endpoint, { ...options, method: "POST", body: JSON.stringify(data) }),
  patch: (endpoint, data, options) => request(endpoint, { ...options, method: "PATCH", body: JSON.stringify(data) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
};
