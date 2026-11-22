export default function ProductImage({ product, className = "" }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} loading="lazy" className={`object-cover ${className}`} />;
  }
  return (
    <div role="img" aria-label={product.name} className={`brick-light flex items-end bg-steel-100 p-3 ${className}`}>
      <span className="bg-steel-900 px-2 py-1 text-xs font-bold text-white">{product.brand}</span>
    </div>
  );
}
