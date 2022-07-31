// Octobre 2021 GUILLEUS Hugues ghugues[at]netc.fr

var timer = null,
	sessions = null,
	out,
	bar;

const SECOND = 1000,
	MINUTE = 60 * SECOND,
	barCircumference = Math.PI * 2 * 40;

function main() {
	sessions = Sessions.storageImport();
	const delayWork = $("delayWork");
	const delayExtra = $("delayExtra");
	const delayBreak = $("delayBreak");
	out = $("out");
	bar = $("bar");

	function stop() {
		if (timer) timer.drop();
	}

	$("goWork").addEventListener("click", () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayWork.value * MINUTE, true);
	});
	$("goExtra").addEventListener("click", () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayExtra.value * MINUTE, false);
	});
	$("goBreak").addEventListener("click", () => {
		stop();
		Notification.requestPermission(r => {});
		timer = new Timer(delayBreak.value * MINUTE, false);
	});
	$("stop").addEventListener("click", stop);
	$("removeData").addEventListener("click", () => {
		if (
			window.confirm(
				"Étes vous sur de vouloir effacer vos donné, vous ne pourez plus les récupérer."
			)
		) {
			Sessions.removeData();
		}
	});
}

class Timer {
	constructor(delay, towork) {
		this.towork = towork;
		this.delay = delay;
		this.begin = new Date();
		this.interval = setInterval(() => this.update(), SECOND / 60);
		this.timeout = setTimeout(() => this.end(), delay);
		Timer.printDuration(0, 0);
		bar.style.strokeDasharray = "0 " + barCircumference;
		$("launch").hidden = true;
		$("run").hidden = false;
	}
	update() {
		const delay = Math.trunc((new Date() - this.begin) / SECOND);
		const m = Math.trunc(delay / (MINUTE / SECOND));
		const s = delay % (MINUTE / SECOND);
		Timer.printDuration(m, s);
		bar.style.strokeDasharray = `${((new Date() - this.begin) *
			barCircumference) /
			this.delay} ${barCircumference}`;
	}
	drop() {
		clearTimeout(this.timeout);
		clearInterval(this.interval);
		$("launch").hidden = false;
		$("run").hidden = true;
		bar.style.strokeDasharray = barCircumference + " " + barCircumference;
		Timer.printDuration(0, 0);
	}
	async end() {
		this.drop();
		if (this.towork) sessions.addToday();

		new Notification("Fin décompte", {
			body: `Décompte de ${Math.trunc(this.delay / MINUTE)}`,
			icon: "favicon.png",
			vibrate: [1000],
			tag: "vibration-sample"
		});

		for (let i = 0; i < 5; i++) {
			new Audio(`audio/${Math.trunc(Math.random() * 2) + 1}.mp3`).play();
			await wait(200);
		}
	}
	static printDuration(m, s) {
		const pn = n =>
			n.toLocaleString("nu-arabic", {
				minimumIntegerDigits: 2
			});
		out.textContent = `${pn(m)}:${pn(s)}`;
	}
}

// Return a promise that resolve in the delay milisecond in the future.
function wait(delay) {
	return new Promise(end => setTimeout(end, delay));
}

// Get element with the id.
function $(id) {
	return document.getElementById(id);
}

// Save, restore and display all work sessions of this year.
class Sessions {
	static STORAGE = "work-sessions";
	static DAY = 24 * 3600 * 1000;
	// Return the millisecond 0 of the day d (in millisecond since Epoch).
	// Used to uniform the day index.
	static set2Day(d) {
		return Math.trunc(d / Sessions.DAY) * Sessions.DAY;
	}
	// Return the present day ready for indexing.
	static now() {
		return Sessions.set2Day(Date.now());
	}
	// Create a new Session object from json string.
	static fromJSON(j) {
		return new Sessions(JSON.parse(j));
	}
	static storageImport() {
		return Sessions.fromJSON(window.localStorage.getItem(Sessions.STORAGE));
	}
	// remove the data in local storage and recreate a new sessions instante.
	static removeData() {
		window.localStorage.removeItem(Sessions.STORAGE);
		sessions = new Sessions();
	}
	storageSave() {
		window.localStorage.setItem(Sessions.STORAGE, this.toJSON());
	}
	constructor(obj) {
		this.graph = $("graph");
		this.graphText = $("graphText");
		this.drop = $("drop");
		this.load(obj);

		$("graphSave").onclick = () => {
			const a = document.createElement("a"),
				u = URL.createObjectURL(
					new Blob([this.toJSON()], {
						type: "application/json"
					})
				);
			document.body.append(a);
			a.href = u;
			a.download = "sessions.json";
			a.click();
			a.remove();
			URL.revokeObjectURL(u);
		};

		document.ondragover = event => event.preventDefault();
		document.ondrop = async event => {
			event.preventDefault();
			if (event.dataTransfer.files.length == 0) return;
			this.load(JSON.parse(await event.dataTransfer.files[0].text()));
			this.storageSave();
			this.drop.hidden = true;
		};
		document.ondragleave = () => (this.drop.hidden = true);
		document.ondragover = () => (this.drop.hidden = false);
	}
	// Load data from obj.
	load(obj) {
		// Recreate the calendar of this year.
		this.firstDayOfTheYear = new Date(new Date().getFullYear(), 0);
		this.days = new Map();
		const now = Date.now();
		let day = Sessions.set2Day(this.firstDayOfTheYear);
		while (day < now) {
			this.days.set(day, 0);
			day += Sessions.DAY;
		}

		// From the gived object, load valid day that exist in this.days.
		Object.keys(obj || {})
			.map(k => [Sessions.set2Day(Date.parse(k)), Number(obj[k])])
			.filter(([d, nb]) => !isNaN(d) && this.days.has(d) && !isNaN(nb))
			.forEach(([d, nb]) => this.days.set(d, nb));

		this.display();
	}
	// Return all days in JSON format: { days: value, ...}, days is in
	// the format: "2021-01-01T00:00:00.000Z"
	toJSON() {
		return (
			"{\n" +
			Array.from(this.days.entries())
				.map(([d, nb]) => `"${new Date(d).toJSON()}": ${nb}`)
				.join(",\n") +
			"\n}\n"
		);
	}
	// Get the max number of work session from all days.
	max() {
		let m = 0;
		this.days.forEach(nb => (m = Math.max(m, nb)));
		return m;
	}
	// Increment the number of working session today.
	addToday() {
		const now = Sessions.now();
		this.days.set(now, (this.days.get(now) || 0) + 1);
		this.display();
		this.storageSave();
	}
	// Refresh the graph.
	display() {
		Array.from(this.graph.children).forEach(item => item.remove());

		const offset = (this.firstDayOfTheYear.getDay() - 1 + 7) % 7;
		const max = this.max() || 1;

		for (let [k, nb] of this.days.entries()) {
			const d = new Date(k),
				div = document.createElement("div");
			this.graph.append(div);
			div.classList.add(`graph-nb-${nb ? Math.round((nb * 4) / max) + 1 : 0}`);
			div.style.gridColumnStart =
				Math.trunc((offset + (k - this.firstDayOfTheYear) / Sessions.DAY) / 7) + 1;
			div.style.gridRowEnd = ((d.getDay() - 1 + 7) % 7) + 1;
			div.addEventListener("mouseover", () => {
				this.graphText.innerText = `[${nb}] ${d.toLocaleDateString()}`;
			});
		}
	}
}

document.readyState == "loading"
	? document.addEventListener("DOMContentLoaded", main, {
			once: true
	  })
	: main();
