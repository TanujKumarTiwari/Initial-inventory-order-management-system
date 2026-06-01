const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail || "Request failed";
    throw new Error(message);
  }

  return data;
}

export const api = {
  dashboard: () => request("/dashboard"),
  products: {
    list: () => request("/products"),
    create: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => request("/customers"),
    create: (payload) => request("/customers", { method: "POST", body: JSON.stringify(payload) }),
    remove: (id) => request(`/customers/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request("/orders"),
    create: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
    remove: (id) => request(`/orders/${id}`, { method: "DELETE" }),
  },
};
