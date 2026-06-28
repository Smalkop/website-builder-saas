import { useState } from 'react';
import ProductDetail from './ProductDetail';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter, setFilter] = useState('');

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = filter
    ? products.filter(p => p.category === filter)
    : products;

  return (
    <section className="products-section">
      <h2 className="section-title">Nuestros Productos</h2>

      {categories.length > 0 && (
        <div className="category-filters">
          <button
            className={`category-btn ${!filter ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="product-grid">
        {filtered.map(product => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => setSelected(product)}
            style={{ cursor: 'pointer' }}
          >
            {product.images && product.images[0] && (
              <div className="product-card-image">
                <img src={product.images[0]} alt={product.name} />
              </div>
            )}
            <div className="product-card-body">
              <h3 className="product-card-name">{product.name}</h3>
              {product.description && (
                <p className="product-card-desc">{product.description}</p>
              )}
              <p className="product-card-price">
                {new Intl.NumberFormat('es-PY', {
                  style: 'currency',
                  currency: 'PYG',
                  maximumFractionDigits: 0,
                }).format(product.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
