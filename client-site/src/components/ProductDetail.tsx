import { useEffect, useState } from 'react';
import { Product, ProductAttribute } from '../api';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  attributes: ProductAttribute[];
  whatsappNumber: string;
}

export default function ProductDetail({ product, onClose, attributes, whatsappNumber }: ProductDetailProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [missingRequired, setMissingRequired] = useState(false);

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

  useEffect(() => {
    setSelections({});
    setMissingRequired(false);
  }, [product.id]);

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(price);
  }

  function handleSelect(attrId: string, value: string) {
    setSelections(prev => ({ ...prev, [attrId]: value }));
    setMissingRequired(false);
  }

  function buildWhatsAppMessage(): string {
    let msg = `Hola, quiero informaci\u00f3n sobre: ${product.name}`;
    if (product.offer_active && product.offer_price) {
      msg += ` (Gs. ${product.offer_price.toLocaleString()})`;
    } else {
      msg += ` (Gs. ${product.price.toLocaleString()})`;
    }
    const parts: string[] = [];
    for (const attr of attributes) {
      const val = selections[attr.id];
      if (val) {
        parts.push(`${attr.name}: ${val}`);
      }
    }
    if (parts.length > 0) {
      msg += `\n${parts.join('\n')}`;
    }
    return encodeURIComponent(msg);
  }

  function handleWhatsApp() {
    const requiredAttrs = attributes.filter(a => a.required);
    const missing = requiredAttrs.some(a => !selections[a.id]);
    if (missing) {
      setMissingRequired(true);
      return;
    }
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${buildWhatsAppMessage()}`, '_blank');
  }

  const showVariants = attributes.length > 0;

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
            {product.category_name && (
              <span className="product-detail-category">{product.category_name}</span>
            )}
            <div className="product-detail-prices">
              {product.offer_active && product.offer_price ? (
                <>
                  <p className="product-detail-price product-detail-price--offer">
                    {formatPrice(product.offer_price)}
                  </p>
                  <p className="product-detail-price--original">
                    {formatPrice(product.price)}
                  </p>
                </>
              ) : (
                <p className="product-detail-price">{formatPrice(product.price)}</p>
              )}
            </div>
            {product.description && (
              <p className="product-detail-desc">{product.description}</p>
            )}

            {showVariants && (
              <div className="variant-selectors">
                {attributes.map(attr => (
                  <div key={attr.id} className="variant-selector-group">
                    <label className="variant-label">
                      {attr.name}
                      {attr.required ? <span className="variant-required">*</span> : null}
                    </label>
                    <div className="variant-options">
                      {attr.values.map(val => (
                        <button
                          key={val.id}
                          className={`variant-option ${selections[attr.id] === val.value ? 'selected' : ''}`}
                          onClick={() => handleSelect(attr.id, val.value)}
                        >
                          {val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {missingRequired && (
                  <p className="variant-error">Seleccioná todas las opciones obligatorias antes de consultar</p>
                )}
              </div>
            )}

            {whatsappNumber && (
              <button className="whatsapp-consult-btn" onClick={handleWhatsApp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
