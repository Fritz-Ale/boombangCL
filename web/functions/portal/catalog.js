// Cloudflare Pages: read-only bridge to the existing Laravel portal catalog.
// Configure BBCL_API_ORIGIN only when an HTTPS Laravel origin is online.
// No browser cookies, Authorization headers, or emulator secrets are forwarded.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});
export async function onRequestGet({ env }) {
  const value = String(env.BBCL_API_ORIGIN || '').trim();
  if (!value) return json({ available: false, message: 'La API Laravel no está configurada para este dominio.' }, 503);
  let origin;
  try {
    origin = new URL(value);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
      return json({ available: false, message: 'Configuración de API no válida.' }, 503);
    }
  } catch {
    return json({ available: false, message: 'Configuración de API no válida.' }, 503);
  }
  try {
    const upstream = await fetch(new URL('/portal/catalog', origin), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      cf: { cacheTtl: 0 },
    });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !type.toLowerCase().includes('application/json')) {
      return json({ available: false, message: 'El catálogo de Laravel no está disponible.' }, 503);
    }
    const data = await upstream.json();
    if (!data || !Array.isArray(data.items)) return json({ available: false, message: 'Respuesta del catálogo no válida.' }, 502);
    // Only expose fields needed to display public catalog entries.
    const items = data.items.slice(0, 3000).filter(item => item && typeof item === 'object').map(item => ({
      name: typeof item.name === 'string' ? item.name : '',
      category: typeof item.category === 'string' ? item.category : '',
      description: typeof item.description === 'string' ? item.description.slice(0, 300) : '',
      price: Number.isFinite(Number(item.price)) && item.price !== null && item.price !== '' ? Number(item.price) : null,
      price_type: typeof item.price_type === 'string' ? item.price_type : '',
    }));
    return json({ available: true, items });
  } catch {
    return json({ available: false, message: 'No es posible conectar con Laravel.' }, 503);
  }
}
