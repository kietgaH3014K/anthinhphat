import { useState } from "react";
import { inputClass } from "../components/FormField";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { WHOLESALE_STATUS } from "../utils/labels";
import { manage } from "./adminApi";
import { MANAGER_UP, can } from "./roles";

const TONE = { none: "neutral", pending: "sale", approved: "ok", rejected: "danger" };

export default function CustomersAdminPage() {
  const { user } = useAuth();
  const canDecide = can(user, MANAGER_UP);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [groups, setGroupChoice] = useState({});
  const [reload, setReload] = useState(0);
  const [message, setMessage] = useState("");
  const list = useFetch(() => manage.list("customers", { page, profile__wholesale_status: status || undefined, search: query || undefined }), [page, status, query, reload]);
  const groupList = useFetch(() => manage.list("customer-groups", { page_size: 200 }), []);

  const decide = async (c, action) => {
    setMessage("");
    try { await manage.action("customers", c.id, action, action === "approve" ? { customer_group: groups[c.id] || "" } : {}); setReload((n) => n + 1); setMessage(action === "approve" ? `Đã duyệt ${c.email}.` : `Đã từ chối ${c.email}.`); }
    catch (err) { setMessage(apiErrorMessage(err)); }
  };

  return (
    <div>
      <h1 className="text-h2">Khách hàng và khách sỉ</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">Hiển thị
          <select className={`${inputClass} !w-auto`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="pending">Chờ duyệt khách sỉ</option><option value="approved">Khách sỉ đã duyệt</option><option value="rejected">Đã từ chối</option><option value="none">Khách lẻ</option><option value="">Tất cả</option>
          </select>
        </label>
        <form className="flex" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label htmlFor="c-search" className="sr-only">Tìm khách hàng</label>
          <input id="c-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email, tên, công ty, MST…" className={`${inputClass} w-64 border-r-0`} />
          <Button type="submit" variant="dark">Tìm</Button>
        </form>
      </div>
      {message && <p role="status" className="mt-4 border-l-4 border-gold bg-white p-3 text-sm">{message}</p>}
      <div className="mt-5">
        {list.loading ? <Loading /> : list.error ? <ErrorBox message={apiErrorMessage(list.error)} /> : list.data.results.length === 0 ? <Empty title="Không có khách hàng phù hợp" /> : (
          <div className="overflow-x-auto border border-steel-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-steel-100 text-left"><tr><th className="p-3">Khách hàng</th><th className="p-3">Công ty / MST</th><th className="p-3">Loại</th><th className="p-3">Ngày đăng ký</th>{canDecide && <th className="p-3">Xử lý</th>}</tr></thead>
              <tbody>
                {list.data.results.map((c) => (
                  <tr key={c.id} className="border-t border-steel-200 align-top">
                    <td className="p-3"><strong>{c.full_name || "—"}</strong><br />{c.email}<br />{c.phone}</td>
                    <td className="p-3">{c.company_name || "—"}<br /><span className="text-steel-500">{c.tax_code}</span></td>
                    <td className="p-3"><Badge tone={TONE[c.wholesale_status]}>{WHOLESALE_STATUS[c.wholesale_status]}</Badge></td>
                    <td className="p-3">{new Date(c.date_joined).toLocaleDateString("vi-VN")}</td>
                    {canDecide && (
                      <td className="p-3">
                        {c.wholesale_status === "pending" ? (
                          <div className="space-y-2">
                            <select aria-label={`Nhóm chiết khấu cho ${c.email}`} className={inputClass} value={groups[c.id] || ""} onChange={(e) => setGroupChoice({ ...groups, [c.id]: e.target.value })}>
                              <option value="">Không gán nhóm</option>{(groupList.data?.results || []).map((g) => <option key={g.id} value={g.id}>{g.name} (−{g.discount_percent}%)</option>)}
                            </select>
                            <div className="flex gap-2"><Button onClick={() => decide(c, "approve")}>Duyệt</Button><Button variant="outline" onClick={() => decide(c, "reject")}>Từ chối</Button></div>
                          </div>
                        ) : <span className="text-steel-500">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={page} totalPages={Math.max(1, Math.ceil(list.data.count / 20))} onChange={setPage} />}
      </div>
    </div>
  );
}
