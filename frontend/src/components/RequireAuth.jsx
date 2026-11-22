import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./ui/State";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(pathname)}`} replace />;
  return children;
}
