import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { listProducts } from "../services/catalogService";
import ProductCard from "./ProductCard";
import { ErrorBox, Loading } from "./ui/State";

export default function ProductRow({ title, flag }) {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(() => listProducts({ flag, ordering: "-created" }, user), [flag, user?.id, user?.wholesale_status]);
  return (
    <section className="mx-auto max-w-page px-4 pt-20" aria-label={title}>
      <div className="flex items-end justify-between gap-4 border-b-2 border-steel-900 pb-3">
        <h2 className="text-h2">{title}</h2>
        <Link to={`/san-pham?flag=${flag}`} className="text-sm font-bold hover:text-brand-600">Xem tất cả</Link>
      </div>
      {loading ? <Loading /> : error ? <div className="mt-6"><ErrorBox /></div> : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.results.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
