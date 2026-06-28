import { useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="product-detail-layout">
          {product.images && product.images[0] && (
            <div className="product-detail-image">
              <img src={product.images[0]} alt={product.name} />
            </div>
          )}

          <div className="product-detail-info">
            <h2 className="product-detail-name">{product.name}</h2>
            {product.category && (
              <span className="product-detail-category">{product.category}</span>
            )}
            <p className="product-detail-price">
              {new Intl.NumberFormat('es-PY', {
                style: 'currency',
                currency: 'PYG',
                maximumFractionDigits: 0,
              }).format(product.price)}
            </p>
            {product.description && (
              <p className="product-detail-desc">{product.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
