import api from "../services/api";

export const manage = {
  list: (res, params) => api.get(`/manage/${res}/`, { params }).then((r) => r.data),
  create: (res, data) => api.post(`/manage/${res}/`, data).then((r) => r.data),
  update: (res, id, data) => api.patch(`/manage/${res}/${id}/`, data).then((r) => r.data),
  remove: (res, id) => api.delete(`/manage/${res}/${id}/`),
  action: (res, id, name, data) => api.post(`/manage/${res}/${id}/${name}/`, data).then((r) => r.data),
};

/** Tải file có kiểm tra quyền (PDF báo giá, file đính kèm) qua API rồi lưu về máy. */
export async function downloadFile(path, fallbackName) {
  const res = await api.get(path, { responseType: "blob" });
  const match = /filename="?([^";]+)"?/.exec(res.headers["content-disposition"] || "");
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
