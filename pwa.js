// Copyright 2020-2024, GUILLEUS Hugues <ghugues@netc.fr>
// BSD 3-Clause License

(async (_) => {
  const serviceWorker = navigator.serviceWorker,
    pwaInstallation = document.getElementById("pwaInstallation"),
    pwaMessage = document.getElementById("pwaMessage"),
    pwaUpdate = document.getElementById("pwaUpdate");

  if (!serviceWorker) {
    console.info("no service worker");
    return;
  }

  const registration = await serviceWorker.register("sw.js");

  // UPDATE
  if (pwaUpdate) {
    pwaUpdate.hidden = false;
    pwaUpdate.addEventListener("click", (_) =>
      registration
        .update("sw.js")
        .then(
          ({ installing }) => ((installing || {}).onstatechange = (_) =>
            installing.state == "activated" && document.location.reload()),
        ));
  }

  // INSTALLATION
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!pwaInstallation) {
      return console.warn("There are no #pwaInstallation element");
    }

    pwaInstallation.hidden = false;
    pwaInstallation.addEventListener(
      "click",
      () => event.prompt().catch(console.error),
    );
  });
})();
