// Octobre 2020 GUILLEUS Hugues ghugues[at]netc.fr

var timer = null,
	out, bar;

const SECOND = 1000,
	MINUTE = 60 * SECOND,
	barCircumference = 282.6;

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
		this.delay = delay;
		this.begin = new Date();
		this.interval = setInterval(() => this.update(), SECOND / 60);
		this.timeout = setTimeout(() => this.end(), delay);
		printDuration(0, 0);
		bar.style.strokeDasharray = '0 ' + barCircumference;
		$('launch').hidden = true;
		$('run').hidden = false;
	}
	update() {
		const delay = Math.trunc((new Date() - this.begin) / SECOND);
		const m = Math.trunc(delay / (MINUTE / SECOND));
		const s = delay % (MINUTE / SECOND);
		printDuration(m, s);
		bar.style.strokeDasharray = `${(new Date() - this.begin)*barCircumference/this.delay} ${barCircumference}`
	}
	drop() {
		clearTimeout(this.timeout);
		clearInterval(this.interval);
		$('launch').hidden = false;
		$('run').hidden = true;
		bar.style.strokeDasharray = barCircumference + ' ' + barCircumference;
		printDuration(0, 0);
	}
	async end() {
		this.drop();

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

function printDuration(m, s) {
	const pn = n => n.toLocaleString('nu-arabic', {
		minimumIntegerDigits: 2
	});
	out.textContent = `${pn(m)}:${pn(s)}`;
}

function wait(delay) {
	return new Promise(end => setTimeout(end, delay));;
}

function $(id) {
	return document.getElementById(id);
}
