// Octobre 2020 GUILLEUS Hugues ghugues[at]netc.fr

var timer = null,
	out, bar;

const SECOND = 1000,
	MINUTE = 60 * SECOND;

document.addEventListener('DOMContentLoaded', () => {
	const delayWork = $('delayWork');
	const delayExtra = $('delayExtra');
	const delayBreak = $('delayBreak');
	out = $('out');
	bar = $('bar')

	function stop() {
		if (timer) timer.drop();
	}

	$('goWork').addEventListener('click', () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayWork.value * MINUTE);
	});
	$('goExtra').addEventListener('click', () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayExtra.value * MINUTE);
	});
	$('goBreak').addEventListener('click', () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayBreak.value * MINUTE);
	});
	$('stop').addEventListener('click', stop);
}, {
	once: true,
});

class Timer {
	constructor(delay) {
		bar.max = delay;
		this.delay = delay;
		this.begin = new Date();
		this.interval = setInterval(() => this.update(), SECOND);
		this.timeout = setTimeout(() => this.end(), delay);
	}
	update() {
		const s = Math.trunc((new Date() - this.begin) / SECOND) % MINUTE;
		const m = Math.trunc((new Date() - this.begin) / MINUTE);
		out.innerText = `durée: ${m}:${s}`;
		bar.value = new Date() - this.begin;
	}
	drop() {
		clearTimeout(this.timeout);
		clearInterval(this.interval);
		out.innerText = 'Stopé';
		bar.value = 0;
	}
	async end() {
		this.drop();
		out.innerText = 'Fin';

		new Notification('Fin décompte', {
			body: `Décompte de ${Math.trunc(this.delay/MINUTE)}`,
			icon: 'favicon.png',
			vibrate: [1000],
			tag: 'vibration-sample',
		});

		for (let i = 0; i < 5; i++) {
			new Audio(`audio/${Math.trunc(Math.random()*2)+1}.mp3`).play();
			await wait(200);
		}
	}
}

function wait(delay) {
	return new Promise(end => setTimeout(end, delay));;
}

function $(id) {
	return document.getElementById(id);
}
