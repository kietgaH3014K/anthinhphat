import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  // Chữ than trên nền cam: tỉ lệ tương phản ~6:1 (chữ trắng trên cam chỉ ~2:1 nên không dùng)
  primary: "bg-brand-500 text-steel-900 hover:bg-brand-600 hover:text-white",
  dark: "bg-steel-900 text-white hover:bg-steel-700",
  outline: "border-2 border-steel-900 text-steel-900 hover:bg-steel-900 hover:text-white",
  outlineLight: "border-2 border-white text-white hover:bg-white hover:text-steel-900",
};

/** Truyền `to` để render thành liên kết điều hướng, nếu không sẽ là <button>. */
export default function Button({ variant = "primary", to, className = "", children, ...props }) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>;
  return <button type="button" className={classes} {...props}>{children}</button>;
}
