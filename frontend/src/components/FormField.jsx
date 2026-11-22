export const inputClass =
  "w-full border border-steel-300 bg-white px-3 py-2.5 text-sm placeholder:text-steel-500 aria-[invalid=true]:border-danger";

export default function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-steel-500">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
