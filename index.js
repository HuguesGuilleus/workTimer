// Octobre 2020-2024 GUILLEUS Hugues ghugues[at]netc.fr

const SECOND = 1000,
  MINUTE = 60 * SECOND,
  DAY = 24 * 60 * MINUTE,
  BAR_CIRCUMFERENCE = Math.PI * 2 * 40;

class Timer {
  // Create a timer.
  // @param {delay} number of millisecond for delay to finish.
  // @param {sessions} session storage of nothing.
  constructor(delay, sessions) {
    this.delay = delay;
    this.sessions = sessions;
    this.begin = new Date();
    this.interval = setInterval(() => this.display(), SECOND / 60);
    this.timeout = setTimeout(() => this.end(), delay);
    stopTimer.onclick = () => this.stop();
    launch.hidden = true;
    run.hidden = false;
    this.display();
    Notification.requestPermission();
  }

  // Update the display.
  display() {
    function format(n) {
      return n.toLocaleString("nu-arabic", {
        minimumIntegerDigits: 2,
      });
    }
    const elapse = Date.now() - this.begin;
    const minute = Math.trunc(elapse / SECOND) % MINUTE;
    const second = Math.trunc(elapse / MINUTE);
    out.textContent = format(minute) + ":" + format(second);
    bar.style.strokeDasharray = (elapse * BAR_CIRCUMFERENCE) / this.delay +
      " " + BAR_CIRCUMFERENCE;
  }

  // Stop timers and print lauch pannel
  stop() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
    launch.hidden = false;
    run.hidden = true;
  }
  // Stop, add this session, make a notification and play audio.
  async end() {
    this.stop();
    this.sessions?.add(this.begin);

    new Notification("Fin décompte", {
      body: `Décompte de ${Math.trunc(this.delay / MINUTE)}`,
      icon: "favicon.png",
      vibrate: [1000],
      tag: "vibration-sample",
    });

    const audios = [];
    for (let i = 0; i < 5; i++) {
      const audio = new Audio(`audio/${Math.trunc(Math.random() * 2) + 1}.mp3`);
      audios.push(audio);
      audio.play().catch(() => {});
      await new Promise((end) => setTimeout(end, 200));
    }
    await new Promise((end) => setTimeout(end, 1000));
    audios.forEach((a) => a.pause());
  }
}

class Sessions {
  static #STORAGE = "work-sessions";

  // Return a key string (used by days) from a date.
  static #date2key(date) {
    return date.getFullYear() + "-" +
      (date.getMonth() + 1) + "-" +
      date.getDate();
  }

  #days = new Map();
  constructor() {
    this.load(localStorage.getItem(Sessions.#STORAGE));
  }

  // Clear all data (local storage and display).
  clear() {
    graphLast.innerText = "";
    this.load();
  }

  // Load data save it and display it.
  load(obj) {
    obj ||= "{}";
    const now = new Date();

    // Create a empty calendar
    this.#days.clear();
    for (
      let day = new Date(now.getFullYear(), 0);
      day < now;
      day = 24 * 3600 * 1000 + day.valueOf()
    ) {
      this.#days.set(Sessions.#date2key(new Date(day)), 0);
    }

    // Load days from obj
    for (let [day, nb] of Object.entries(JSON.parse(obj))) {
      day = new Date(day);
      nb = Number(nb);
      if (
        day.getFullYear() !== now.getFullYear() || day > now ||
        day == "Invalid Date" || isNaN(nb)
      ) continue;
      this.#days.set(Sessions.#date2key(day), nb);
    }

    this.#saveAndDisplay();
  }

  // Add +1 to the day.
  add(day) {
    graphLast.innerText = "Début de la dernière session: " +
      day.toLocaleString();
    const key = Sessions.#date2key(day);
    this.#days.set(key, (this.#days.get(key) || 0) + 1);
    this.#saveAndDisplay();
  }

  // Save and display days into #graph
  #saveAndDisplay() {
    localStorage.setItem(
      Sessions.#STORAGE,
      JSON.stringify(Object.fromEntries(this.#days)),
    );
    graph.innerText = "";

    const first = new Date(new Date().getFullYear(), 0);
    const offset = ((first.getDay() || 7) - 1) * DAY;
    const max = Math.max(...this.#days.values());
    for (const [key, nb] of this.#days) {
      const day = new Date(key),
        div = document.createElement("div");
      graph.append(div);

      div.style.gridRowStart = day.getDay() || 7;
      div.style.gridColumnStart = 1 + Math.trunc(
        (day - first + offset) / (7 * DAY),
      );
      if (nb) {
        div.style.backgroundColor = `hsl(210,100%,${100 - nb * 90 / max}%)`;
      }

      div.onmouseover = () => {
        graphText.innerText = `[${nb}] ${day.toLocaleDateString()}`;
      };
    }
  }

  download() {
    const a = document.createElement("a");
    document.body.append(a);
    a.download = `workTimer-${new Date().getFullYear()}.json`;
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(Object.fromEntries(this.#days), null, "\t")], {
        type: "application/json",
      }),
    );
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }
}

(function () {
  const sessions = new Sessions();
  graphSave.onclick = () => sessions.download();
  removeData.onclick = () => {
    confirm(
      "Êtes-vous sûrs de vouloir effacer vos données, vous ne pourez plus les récupérer.",
    ) && sessions.clear();
  };

  goWork.onclick = () => new Timer(delayWork.value * MINUTE, sessions);
  goExtra.onclick = () => new Timer(delayExtra.value * MINUTE);
  goBreak.onclick = () => new Timer(delayBreak.value * MINUTE);

  document.ondragleave = () => (drop.hidden = true);
  document.ondragover = () => (drop.hidden = false);
  document.ondrop = async (event) => {
    event.preventDefault();
    drop.hidden = true;
    if (event.dataTransfer.files.length == 0) return;
    sessions.load(await event.dataTransfer.files[0].text());
  };
})();
