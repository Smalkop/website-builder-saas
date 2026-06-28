const API_BASE = '/api/admin';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function getMe() {
  return request<{ id: string; email: string; role: string }>('/auth/me');
}

export async function getTenants() {
  return request<any[]>('/tenants');
}

export async function getTenant(id: string) {
  return request<any>(`/tenants/${id}`);
}

export async function createTenant(data: any) {
  return request<any>('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenant(id: string, data: any) {
  return request<any>(`/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleTenantStatus(id: string) {
  return request<any>(`/tenants/${id}/status`, { method: 'PATCH' });
}

export async function deleteTenant(id: string) {
  return request<any>(`/tenants/${id}`, { method: 'DELETE' });
}

export async function getSettings(tenantId: string) {
  return request<any>(`/tenants/${tenantId}/settings`);
}

export async function updateSettings(tenantId: string, data: any) {
  return request<any>(`/tenants/${tenantId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getProducts(tenantId: string) {
  return request<any[]>(`/tenants/${tenantId}/products`);
}

export async function createProduct(tenantId: string, data: any) {
  return request<any>(`/tenants/${tenantId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(tenantId: string, productId: string, data: any) {
  return request<any>(`/tenants/${tenantId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(tenantId: string, productId: string) {
  return request<any>(`/tenants/${tenantId}/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function getDomains(tenantId: string) {
  return request<any[]>(`/tenants/${tenantId}/domains`);
}

export async function createDomain(tenantId: string, domain: string) {
  return request<any>(`/tenants/${tenantId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}

export async function verifyDomain(tenantId: string, domainId: string) {
  return request<any>(`/tenants/${tenantId}/domains/${domainId}/verify`, {
    method: 'POST',
  });
}

export async function deleteDomain(tenantId: string, domainId: string) {
  return request<any>(`/tenants/${tenantId}/domains/${domainId}`, {
    method: 'DELETE',
  });
}

export async function uploadImage(tenantId: string, file: File) {
  const token = localStorage.getItem('admin_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/tenants/${tenantId}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
