// Service Worker für Beach Party Flaschenpost PWA
const CACHE_NAME = 'beach-party-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files die gecacht werden sollen
const CACHE_FILES = [
    '/BeachParty_Flaschenpost/',
    '/BeachParty_Flaschenpost/index.html',
    '/BeachParty_Flaschenpost/style.css',
    '/BeachParty_Flaschenpost/script.js',
    '/BeachParty_Flaschenpost/manifest.json',
    '/BeachParty_Flaschenpost/img/strand.png',
    '/BeachParty_Flaschenpost/img/flaschenpost.png',
    '/BeachParty_Flaschenpost/img/favicon-16x16.png',
    '/BeachParty_Flaschenpost/img/favicon-32x32.png',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
    console.log('[SW] Install Event');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching App Files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                // Aktiviere den neuen Service Worker sofort
                return self.skipWaiting();
            })
    );
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate Event');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Lösche alte Caches
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Clearing Old Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Service Worker übernimmt alle Clients
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network First mit Cache Fallback
self.addEventListener('fetch', (event) => {
    // Nur GET Requests cachen
    if (event.request.method !== 'GET') {
        return;
    }

    // Supabase API Calls nicht cachen (immer live data)
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Wenn Supabase offline ist, zeige offline Nachricht
                return new Response(JSON.stringify({
                    error: 'Offline - Keine Verbindung zur Datenbank',
                    offline: true
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                });
            })
        );
        return;
    }

    // Für alle anderen Requests: Cache First Strategy
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version falls vorhanden
                if (cachedResponse) {
                    // Update cache im Hintergrund (stale-while-revalidate)
                    fetch(event.request).then((response) => {
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                    }).catch(() => { });

                    return cachedResponse;
                }

                // Falls nicht im Cache, versuche Netzwerk
                return fetch(event.request).then((response) => {
                    // Nur erfolgreiche Responses cachen
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Fallback für HTML Seiten
                    if (event.request.destination === 'document') {
                        return caches.match('/BeachParty_Flaschenpost/index.html');
                    }

                    // Fallback für Bilder
                    if (event.request.destination === 'image') {
                        return new Response(`
                            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="#87CEEB"/>
                                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                                      font-family="Arial" font-size="16" fill="#8B4513">
                                    Offline - Bild nicht verfügbar
                                </text>
                            </svg>
                        `, {
                            headers: { 'Content-Type': 'image/svg+xml' }
                        });
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});