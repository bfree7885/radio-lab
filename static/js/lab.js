/* Local page boot.

   Progress on these pages stays in SQLite, rendered by Flask. This file
   does not write browser progress and does not probe hardware. It installs the
   capability snapshot from the page and loads the shared curriculum so the
   browser core is using the same source as the server.
*/
(function () {
  var root = document.documentElement;
  var mode = root.getAttribute("data-lab-mode");
  if (mode !== "simulation" && mode !== "live") {
    root.setAttribute("data-lab-mode", "simulation");
  }
  if (!window.RadioLab || !window.RadioLabLocalCapabilities) {
    return;
  }
  RadioLab.configure({
    contentBase: root.getAttribute("data-content-base") || "/content/",
  });
  var capNode = document.getElementById("radio-lab-capabilities");
  if (capNode) {
    try {
      RadioLab.useCapabilities(RadioLabLocalCapabilities.create(JSON.parse(capNode.textContent)));
    } catch (error) {
      RadioLab.useCapabilities(RadioLabLocalCapabilities.create({}));
    }
  }
  RadioLab.curriculum.load().catch(function () {});
})();
