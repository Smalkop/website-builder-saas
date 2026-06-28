import { useState, useEffect } from 'react';
import { getSiteConfig, getProducts } from './api';
import ThemeProvider from './components/ThemeProvider';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import WhatsAppButton from './components/WhatsAppButton';
import Footer from './components/Footer';

interface SiteConfig {
  business_name: string;
  business_description: string;
  logo_url: string;
  banner_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  animations_enabled: number;
  layout_type: string;
  whatsapp_number: string;
  facebook_url: string;
  instagram_url: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSiteConfig(), getProducts()])
      .then(([cfg, prods]) => {
        setConfig(cfg);
        setProducts(prods);
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

  return (
    <ThemeProvider config={config}>
      <div className="site-wrapper">
        <Hero
          businessName={config.business_name}
          description={config.business_description}
          bannerUrl={config.banner_url}
          logoUrl={config.logo_url}
          whatsappNumber={config.whatsapp_number}
        />

        {products.length > 0 && <ProductGrid products={products} />}

        <Footer
          businessName={config.business_name}
          facebookUrl={config.facebook_url}
          instagramUrl={config.instagram_url}
          whatsappNumber={config.whatsapp_number}
        />

        <WhatsAppButton number={config.whatsapp_number} />
      </div>
    </ThemeProvider>
  );
}
