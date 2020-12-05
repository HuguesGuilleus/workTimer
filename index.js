// Octobre 2020 GUILLEUS Hugues ghugues[at]netc.fr

var timer = null,
	sessions = null,
	out, bar;

const SECOND = 1000,
	MINUTE = 60 * SECOND,
	barCircumference = Math.PI * 2 * 40;

document.addEventListener('DOMContentLoaded', () => {
	sessions = Sessions.storageImport();
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

class Sessions {
	static STORAGE = 'work-sessions';
	static DAY = 24 * 3600 * 1000;
	static set2Day(d) {
		return Math.round(d / Sessions.DAY) * Sessions.DAY;
	}
	static now() {
		return Sessions.set2Day(Date.now());
	}
	static fromJSON(j) {
		return new Sessions(JSON.parse(j));
	}
	static storageImport() {
		return new Sessions(window.localStorage.getItem(Sessions.STORAGE));
	}
	storageSave() {
		window.localStorage.setItem(Sessions.STORAGE, this.toJSON());
	}
	constructor(obj) {
		const nbDay = 2 * 7 + new Date().getDay();
		let day = Sessions.now() - nbDay * Sessions.DAY;
		this.days = new Map();
		for (let i = 0; i < nbDay; i++) {
			this.days.set(day, 0);
			day += Sessions.DAY;
		}

		Object.keys(obj || {})
			.map(k => [Sessions.set2Day(Date.parse(k)), Number(obj[k])])
			.filter(([d, nb]) => !isNaN(d) && this.days.has(d) && !isNaN(nb))
			.forEach(([d, nb]) => this.days.set(d, nb));

		this.graph = $('graph');
		this.graphText = $('graphText');
		this.display();
	}
	toJSON() {
		return '{' + Array.from(this.days.entries())
			.map(([d, nb]) => `"${new Date(d).toJSON()}":${nb}`)
			.join(',') + '}';
	}
	max() {
		let m = 0;
		this.days.forEach(nb => m = Math.max(m, nb))
		return m;
	}
	addToday() {
		const now = Sessions.now();
		this.days.set(now, (this.days.get(now) || 0) + 1);
		this.display();
		this.storageSave();
	}
	display() {
		Array.from(this.graph.children).forEach(item => item.remove());
		const max = this.max() || 1;
		for (let [k, nb] of this.days.entries()) {
			const d = new Date(k);
			let div = document.createElement('div');
			this.graph.append(div);
			div.classList.add(`graph-nb-${Math.round(nb*5/max)}`);
			div.addEventListener('mouseover', () => {
				this.graphText.innerText = `[${nb}] ${d.toLocaleDateString()}`;
			});
		}
	}
}
