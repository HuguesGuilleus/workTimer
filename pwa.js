// Copyright 2020, GUILLEUS Hugues <ghugues@netc.fr>
// BSD 3-Clause License

(async function () {
	function $(id) {
		return document.getElementById(id);
	}

	function $t(id, def) {
		const e = $(id);
		if (!e) {
			console.warn(`No found element#${id} to get text.`);
			return def;
		}
		return e.innerText;
	}

	if (!('serviceWorker' in navigator)) {
		console.warn('serviceWorker is not supported');
		return;
	}

	const registration = await (navigator.serviceWorker.controller ?
		navigator.serviceWorker.getRegistration() :
		navigator.serviceWorker.register('sw.js')
	);

	const pwdNeedNetwork = $t('pwdNeedNetwork', 'PWA installation need network.'),
		pwdCurrentUpdate = $t('pwdCurrentUpdate', 'The PWA are updating.'),
		pwaUpdate = $('pwaUpdate');
	if (!pwaUpdate) {
		console.warn('There are not #pwaUpdate element.');
		return;
	}
	pwaUpdate.hidden = false;
	pwaUpdate.addEventListener('click', async () => {
		if (!navigator.onLine) return window.alert(pwdNeedNetwork);
		document.body.innerText = pwdCurrentUpdate;
		await registration.unregister();
		document.location.reload();
	});
})();
