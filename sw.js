// Copyright 2020, GUILLEUS Hugues <ghugues@netc.fr>
// BSD 3-Clause License

const assetsVersion = "x2";
const assets = [
	'.',
	'audio/1.mp3',
	'audio/2.mp3',
	'favicon.png',
	'index.html',
	'index.js',
	'manifest.webmanifest',
	'pwa.js',
	'style.css',
];

if (location.hostname !== 'localhost') {
	self.addEventListener('install', async event => {
		await Promise.all(
			(await caches.keys())
			.map(c => caches.delete(c))
		);
		await caches.open(assetsVersion).then(c => c.addAll(assets));
		skipWaiting();
	});

	self.addEventListener('fetch', event => event.respondWith(
		caches.open(assetsVersion)
		.then(c => c.match(event.request))
		.then(rep => rep ||
			fetch(event.request).then(rep => {
				if (!rep.ok) throw new TypeError('Bad response status');
				caches.open(assetsVersion).then(c => c.put(event.request, rep));
				return rep.clone();
			}).catch(() => new Response('fetch error, maybe the navigator is offline.\n', {
				status: 404,
				statusText: 'offline',
			}))
		)
	));
} else {
	console.warn('Service worker in dev mode');
	self.addEventListener('install', async () => {
		skipWaiting();
		(await caches.keys()).forEach(c => caches.delete(c))
	});
	self.addEventListener('fetch', event => event.respondWith(
		fetch(event.request)
	));
}
