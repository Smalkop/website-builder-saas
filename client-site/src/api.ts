const API_BASE = '/api/site';

export interface SiteConfig {
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
  footer_credit_enabled: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  category_id: string | null;
  category_name: string;
  active: number;
  offer_price: number | null;
  offer_active: number;
}

export interface MenuItem {
  id: string;
  label: string;
  anchor: string;
  sort_order: number;
  parent_id: string | null;
  children: MenuItem[];
}

export interface Category {
  id: string;
  name: string;
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

export async function getMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) return [];
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) return [];
  return res.json();
}
