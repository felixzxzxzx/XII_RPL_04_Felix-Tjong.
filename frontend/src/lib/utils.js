export function formatRupiah(number) {
  if (number === undefined || number === null || isNaN(number)) {
    return 'Rp 0';
  }
  const formatted = Math.round(Number(number))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function formatDateOnly(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getProductImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

  if (trimmed.startsWith('http://localhost:5000/uploads/') || trimmed.startsWith('http://127.0.0.1:5000/uploads/')) {
    const uploadPath = trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, '');
    return apiBase ? `${apiBase}${uploadPath}` : uploadPath;
  }

  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.substring(trimmed.indexOf('/uploads/'));
    return apiBase ? `${apiBase}${uploadPath}` : uploadPath;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return apiBase ? `${apiBase}${trimmed}` : trimmed;
  }

  return apiBase ? `${apiBase}/${trimmed}` : `/${trimmed}`;
}
