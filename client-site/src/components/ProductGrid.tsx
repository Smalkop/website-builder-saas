import { useState } from 'react';
import ProductDetail from './ProductDetail';
import { Product, Category } from '../api';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
}

export default function ProductGrid({ products, categories }: ProductGridProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter, setFilter] = useState('');

  const activeCategories = categories.filter(c => products.some(p => p.category_id === c.id));
  const filtered = filter
    ? products.filter(p => p.category_id === filter)
    : products;

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <div className="products-section">
      <h2 className="section-title">Nuestros Productos</h2>

      {activeCategories.length > 0 && (
        <div className="category-filters">
          <button
            className={`category-btn ${!filter ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            Todos
          </button>
          {activeCategories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${filter === cat.id ? 'active' : ''}`}
              onClick={() => setFilter(cat.name)}
            >
              {cat.name}
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
              <div className="product-card-prices">
                {product.offer_active && product.offer_price ? (
                  <>
                    <p className="product-card-price product-card-price--offer">
                      {formatPrice(product.offer_price)}
                    </p>
                    <p className="product-card-price--original">
                      {formatPrice(product.price)}
                    </p>
                  </>
                ) : (
                  <p className="product-card-price">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
