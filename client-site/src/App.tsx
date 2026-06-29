import { useState, useEffect } from 'react';
import { getSiteConfig, getProducts, getMenu, getCategories, getAttributes, SiteConfig, Product, MenuItem, Category, ProductAttribute } from './api';
import ThemeProvider from './components/ThemeProvider';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import WhatsAppButton from './components/WhatsAppButton';
import Footer from './components/Footer';

export default function App() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSiteConfig(), getProducts(), getMenu(), getCategories(), getAttributes()])
      .then(([cfg, prods, menu, cats, attrs]) => {
        setConfig(cfg);
        setProducts(prods);
        setMenuItems(menu);
        setCategories(cats);
        setAttributes(attrs);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="site-loading">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="site-error">
        <h1>Sitio no disponible</h1>
        <p>{error || 'Error al cargar la configuraci&oacute;n del sitio'}</p>
      </div>
    );
  }

  const hasProducts = products.length > 0;
  const hasContact = !!(config.facebook_url || config.instagram_url || config.whatsapp_number);

  return (
    <ThemeProvider config={config}>
      <div className="site-wrapper">
        <Navbar
          businessName={config.business_name}
          menuItems={menuItems}
          hasProducts={hasProducts}
          hasContact={hasContact}
        />

        <section id="inicio">
          <Hero
            businessName={config.business_name}
            description={config.business_description}
            bannerUrl={config.banner_url}
            logoUrl={config.logo_url}
            whatsappNumber={config.whatsapp_number}
          />
        </section>

        {hasProducts && (
          <section id="productos">
            <ProductGrid
              products={products}
              categories={categories}
              attributes={config.variants_enabled ? attributes : []}
              whatsappNumber={config.whatsapp_number}
            />
          </section>
        )}

        <section id="nosotros" className="about-section">
          <div className="about-content">
            <h2 className="section-title">Sobre Nosotros</h2>
            <p>{config.business_description || 'Bienvenido a nuestra tienda. Descubrí nuestros productos y servicios.'}</p>
          </div>
        </section>

        <section id="contacto">
          <Footer
            businessName={config.business_name}
            facebookUrl={config.facebook_url}
            instagramUrl={config.instagram_url}
            whatsappNumber={config.whatsapp_number}
            footerCreditEnabled={config.footer_credit_enabled}
          />
        </section>

        <WhatsAppButton number={config.whatsapp_number} />
      </div>
    </ThemeProvider>
  );
}
