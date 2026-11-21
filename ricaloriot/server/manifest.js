// The web-app manifest. With ?k=CODE the installed app opens already unlocked.
export default {
  fetch(request) {
    const k = (new URL(request.url).searchParams.get('k') || '').replace(/[^0-9a-zA-Z]/g, '').slice(0, 32);
    const manifest = {
      name: 'Ricaloriot',
      short_name: 'Ricaloriot',
      description: 'כמה נשאר לאכול היום — קלוריות וחלבון',
      lang: 'he',
      dir: 'rtl',
      id: '/',
      start_url: k ? `/?k=${k}` : '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#EFF8F0',
      theme_color: '#EFF8F0',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };
    return new Response(JSON.stringify(manifest), {
      headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'no-store' },
    });
  },
};
