const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
};

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('pos_token');
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Bypass-Tunnel-Reminder': 'true',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/login')) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data.data || data,
      message: data.message,
      errors: data.errors,
      raw: data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: `Gagal terhubung ke server backend di ${baseUrl}. Pastikan server backend sedang berjalan.`
    };
  }
}
