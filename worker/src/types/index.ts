export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Domain {
  id: string;
  tenant_id: string;
  domain: string;
  type: 'custom' | 'subdomain';
  verified: number;
  created_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  logo_url: string;
  banner_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  animations_enabled: number;
  layout_type: string;
  whatsapp_number: string;
  business_name: string;
  business_description: string;
  facebook_url: string;
  instagram_url: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  images: string;
  category: string;
  active: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  ADMIN_DOMAIN: string;
  PLATFORM_DOMAIN: string;
  JWT_SECRET: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

export interface Variables {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  userEmail: string;
  userRole: string;
}
