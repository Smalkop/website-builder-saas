const API_BASE = '/api/site';

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

export async function getSiteConfig(): Promise<SiteConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to load site config');
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}
