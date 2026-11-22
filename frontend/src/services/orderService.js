import api from "./api";
import { USE_MOCK } from "./config";
import * as mock from "./mockApi";

export async function validateCoupon(code) {
  if (USE_MOCK) return mock.validateCoupon(code);
  const { data } = await api.post("/promotions/validate/", { code });
  return data;
}

export async function createOrder(payload, user) {
  if (USE_MOCK) return mock.createOrder(payload, user);
  const { data } = await api.post("/orders/", payload);
  return data;
}

export async function listOrders(user) {
  if (USE_MOCK) return mock.listOrders(user);
  const { data } = await api.get("/orders/");
  return data.results ?? data;
}

export async function getOrder(code, user) {
  if (USE_MOCK) return mock.getOrder(code, user);
  const { data } = await api.get(`/orders/${code}/`);
  return data;
}

export async function submitQuote(values, file) {
  if (USE_MOCK) return mock.createQuote({ ...values, attachment_name: file?.name || null });
  const form = new FormData();
  form.append("data", JSON.stringify(values));
  if (file) form.append("attachment", file);
  const { data } = await api.post("/quotations/", form);
  return data;
}
