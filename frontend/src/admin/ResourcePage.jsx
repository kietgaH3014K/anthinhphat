import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { manage } from "./adminApi";
import { can } from "./roles";

/** Trang CRUD dùng chung: bảng, tìm kiếm, phân trang, thêm/sửa/xóa theo cấu hình. */
export default function ResourcePage({ config }) {
  const { endpoint, title, columns, fields, writeRoles, toForm, toPayload, newDefaults = {}, canDelete = true } = config;
  const { user } = useAuth();
  const canWrite = can(user, writeRoles);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | item
  const [reload, setReload] = useState(0);
  const [message, setMessage] = useState("");

  const list = useFetch(() => manage.list(endpoint, { page, search: query || undefined }), [endpoint, page, query, reload]);

  useEffect(() => { setPage(1); setQuery(""); setSearch(""); setEditing(null); setMessage(""); }, [endpoint]);

  const remove = async (item) => {
    if (!window.confirm(`Xóa “${item.name || item.code || item.email || item.id}”?`)) return;
    try { await manage.remove(endpoint, item.id); setMessage("Đã xóa."); setReload((n) => n + 1); }
    catch (err) { setMessage(apiErrorMessage(err, "Không xóa được.")); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h2">{title}</h1>
        {canWrite && !editing && <Button onClick={() => setEditing("new")}>Thêm mới</Button>}
      </div>

      {message && <p role="status" className="mt-4 border-l-4 border-gold bg-white p-3 text-sm">{message}</p>}

      {editing ? (
        <ResourceForm
          key={editing === "new" ? "new" : editing.id} fields={fields} endpoint={endpoint}
          item={editing === "new" ? null : editing} defaults={editing === "new" ? newDefaults : toForm ? toForm(editing) : editing}
          toPayload={toPayload}
          onDone={(msg) => { setEditing(null); setMessage(msg); setReload((n) => n + 1); }} onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          {config.searchable !== false && (
            <form className="mt-5 flex max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }} role="search">
              <label htmlFor="rp-search" className="sr-only">Tìm kiếm</label>
              <input id="rp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm…" className={`${inputClass} border-r-0`} />
              <Button type="submit" variant="dark">Tìm</Button>
            </form>
          )}
          <div className="mt-5">
            {list.loading ? <Loading /> : list.error ? <ErrorBox message={apiErrorMessage(list.error)} /> : list.data.results.length === 0 ? <Empty title="Chưa có dữ liệu" /> : (
              <div className="overflow-x-auto border border-steel-200 bg-white">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-steel-100 text-left"><tr>{columns.map((c) => <th key={c.key} className="p-3">{c.label}</th>)}{canWrite && <th className="p-3"><span className="sr-only">Thao tác</span></th>}</tr></thead>
                  <tbody>
                    {list.data.results.map((item) => (
                      <tr key={item.id} className="border-t border-steel-200">
                        {columns.map((c) => <td key={c.key} className="p-3">{c.render ? c.render(item) : String(item[c.key] ?? "")}</td>)}
                        {canWrite && (
                          <td className="whitespace-nowrap p-3 text-right">
                            <button className="font-semibold underline" onClick={() => setEditing(item)}>Sửa</button>
                            {canDelete && <button className="ml-4 font-semibold text-danger underline" onClick={() => remove(item)}>Xóa</button>}
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
        </>
      )}
    </div>
  );
}

function ResourceForm({ fields, endpoint, item, defaults, toPayload, onDone, onCancel }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: defaults });
  const [formError, setFormError] = useState("");
  const hasFile = fields.some((f) => f.type === "file");

  const onSubmit = async (values) => {
    setFormError("");
    const data = {};
    for (const f of fields) {
      let v = values[f.name];
      if (f.type === "file") { if (v && v.length) data[f.name] = v[0]; continue; }
      if (f.type === "number") v = v === "" || v == null ? null : Number(v);
      else if (f.type === "select") v = v === "" ? null : v;
      else if (f.type === "password" && !v) continue;
      else if (f.type === "date") v = v || null;
      data[f.name] = v;
    }
    const payload = toPayload ? toPayload(data) : data;
    let body = payload;
    if (hasFile) {
      body = new FormData();
      Object.entries(payload).forEach(([k, v]) => { if (v !== null && v !== undefined) body.append(k, typeof v === "boolean" ? String(v) : v); });
    }
    try {
      if (item) await manage.update(endpoint, item.id, body); else await manage.create(endpoint, body);
      onDone(item ? "Đã lưu thay đổi." : "Đã thêm mới.");
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object" && !d.detail) {
        let any = false;
        for (const [k, msgs] of Object.entries(d)) { if (fields.some((f) => f.name === k)) { setError(k, { message: Array.isArray(msgs) ? msgs[0] : String(msgs) }); any = true; } }
        if (any) return;
      }
      setFormError(apiErrorMessage(err, "Không lưu được."));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4 border border-steel-200 bg-white p-6 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}>
          {f.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...register(f.name)} /> {f.label}</label>
          ) : (
            <Field label={f.label} htmlFor={`f-${f.name}`} error={errors[f.name]?.message} hint={f.hint}>
              {f.type === "textarea" ? <textarea id={`f-${f.name}`} rows={f.rows || 4} className={inputClass} {...register(f.name)} />
                : f.type === "select" ? <SelectInput field={f} register={register} />
                : f.type === "file" ? <input id={`f-${f.name}`} type="file" accept="image/jpeg,image/png,image/webp" {...register(f.name)} className="block w-full text-sm" />
                : <input id={`f-${f.name}`} type={f.type === "number" ? "number" : f.type || "text"} step={f.type === "number" ? "any" : undefined} autoComplete={f.type === "password" ? "new-password" : undefined}
                    className={inputClass} aria-invalid={!!errors[f.name]}
                    {...register(f.name, { required: f.required && !(f.type === "password" && item) ? "Bắt buộc nhập." : false })} />}
            </Field>
          )}
        </div>
      ))}
      {formError && <p role="alert" className="border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger sm:col-span-2">{formError}</p>}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu…" : "Lưu"}</Button>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  );
}

function SelectInput({ field, register }) {
  const remote = useFetch(() => (field.optionsFrom ? manage.list(field.optionsFrom, { page_size: 200 }) : Promise.resolve(null)), [field.optionsFrom]);
  const options = useMemo(() => field.options || (remote.data?.results || []).map((r) => ({ value: r.id, label: r[field.labelKey || "name"] })), [field.options, remote.data, field.labelKey]);
  if (remote.loading) return <select disabled className={inputClass}><option>Đang tải…</option></select>;
  return (
    <select id={`f-${field.name}`} className={inputClass} {...register(field.name, { required: field.required ? "Bắt buộc chọn." : false })}>
      {!field.required && <option value="">— Không chọn —</option>}
      {field.required && <option value="">Chọn…</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
