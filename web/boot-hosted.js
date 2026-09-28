/* Hosted page boot.

   Install this on a future Waypoint Studio page with data-delivery="hosted".
   It does nothing on the local Flask pages. It does not start a live lab.
*/
(function () {
  function contentBase() {
    var root = document.documentElement;
    return root.getAttribute("data-content-base") || "content/";
  }

  function boot() {
    if (!window.RadioLab || !window.RadioLabPublicCapabilities || !window.RadioLabBrowserProgress) {
      return;
    }
    if (document.documentElement.getAttribute("data-delivery") !== "hosted") {
      return;
    }
    var base = contentBase();
    RadioLab.configure({ contentBase: base });
    RadioLab.useProgress(RadioLabBrowserProgress.create());
    var get = typeof fetch === "function" ? fetch : null;
    if (!get) {
      return;
    }
    var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
    get(prefix + "capabilities.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("capabilities");
        }
        return response.json();
      })
      .then(function (manifest) {
        RadioLab.useCapabilities(RadioLabPublicCapabilities.create(manifest));
        return RadioLab.curriculum.load().then(function () {
          return RadioLab.roadmap.load();
        });
      })
      .catch(function () {
        /* The page can still explain that shared content did not load. */
      });
  }

  if (typeof document === "undefined") {
    return;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
